"""
=============================================================================
BioGaz+ / SmartDigest - Backend & Moteur IA Prédictif (FastAPI)
SIREXE Hackathon 2026 - Prix Thématique: Valorisation des Déchets en Biogaz
Ministère des Mines, du Pétrole et de l'Énergie
=============================================================================
Stack: Python 3.10+, FastAPI, Pydantic, Scikit-learn (ou heuristique avancée C/N)
"""

import time
import math
import hashlib
import random
import os
import json
from pathlib import Path
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import requests

try:
    import paho.mqtt.client as mqtt
except ImportError:  # pragma: no cover - optional dependency in local demos
    mqtt = None

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:8501,http://localhost:8501",
).split(",")

app = FastAPI(
    title="BioGaz+ / SmartDigest API",
    description="API IoT, IA d'Optimisation des Intrants et Traçabilité Blockchain pour la Méthanisation",
    version="1.0.0"
)

MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "biogas/plant/+/telemetry")

# Configuration CORS pour Streamlit / Frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# BASE DE CONNAISSANCES & CARACTÉRISTIQUES DES INTRANTS (Substrates Database)
# Adapté au contexte ouest-africain et ivoirien (SIREXE)
# ---------------------------------------------------------------------------
SUBSTRATES_DB = {
    "fumier_bovin": {
        "nom": "Fumier / Lisier Bovin",
        "matiere_seche_pct": 12.0,      # Teneur en Matière Sèche (MS %)
        "matiere_organique_pct": 80.0,   # Matière Volatile (% MS)
        "ratio_CN": 25.0,               # Ratio Carbone / Azote (optimal)
        "bmp": 210.0,                   # Potentiel Méthanogène (Nm3 CH4 / t MS)
        "ch4_pct_theorique": 60.0,       # Teneur en CH4 moyenne (%)
        "cout_tonne_cfa": 2500           # Coût moyen collecte FCFA/tonne
    },
    "dechets_manioc": {
        "nom": "Épluchures & Résidus de Manioc",
        "matiere_seche_pct": 28.0,
        "matiere_organique_pct": 92.0,
        "ratio_CN": 45.0,               # Fort en carbone
        "bmp": 340.0,
        "ch4_pct_theorique": 55.0,
        "cout_tonne_cfa": 3000
    },
    "effluents_huile_palme": {
        "nom": "POME (Effluents d'Huilerie de Palme)",
        "matiere_seche_pct": 8.0,
        "matiere_organique_pct": 85.0,
        "ratio_CN": 18.0,
        "bmp": 420.0,                   # Très haut potentiel énergétique
        "ch4_pct_theorique": 65.0,
        "cout_tonne_cfa": 1500
    },
    "dechets_marche_menagers": {
        "nom": "FFOM / Déchets de Marchés Municipaux",
        "matiere_seche_pct": 18.0,
        "matiere_organique_pct": 88.0,
        "ratio_CN": 16.0,               # Riche en azote
        "bmp": 380.0,
        "ch4_pct_theorique": 58.0,
        "cout_tonne_cfa": 4000
    },
    "fientes_volailles": {
        "nom": "Fientes Avicoles (Poules pondeuses)",
        "matiere_seche_pct": 30.0,
        "matiere_organique_pct": 75.0,
        "ratio_CN": 8.5,                # Risque d'inhibition ammoniacale
        "bmp": 280.0,
        "ch4_pct_theorique": 60.0,
        "cout_tonne_cfa": 5000
    },
    "residus_cacao": {
        "nom": "Cabosses & Déchets de Cacao",
        "matiere_seche_pct": 22.0,
        "matiere_organique_pct": 84.0,
        "ratio_CN": 32.0,
        "bmp": 260.0,
        "ch4_pct_theorique": 54.0,
        "cout_tonne_cfa": 2000
    }
}

SUBSTRATE_UI_METADATA = {
    "fumier_bovin": {"nomCourt": "Lisier Bovin", "icone": "🐄", "categorie": "Élevage"},
    "dechets_manioc": {"nomCourt": "Résidus Manioc", "icone": "🥔", "categorie": "Agroalimentaire"},
    "effluents_huile_palme": {"nomCourt": "Effluents POME", "icone": "🌴", "categorie": "Agro-Industrie"},
    "dechets_marche_menagers": {"nomCourt": "Déchets Marchés", "icone": "🥗", "categorie": "Urbain"},
    "fientes_volailles": {"nomCourt": "Fientes Avicoles", "icone": "🐔", "categorie": "Élevage"},
    "residus_cacao": {"nomCourt": "Cabosses Cacao", "icone": "🍫", "categorie": "Agro-Industrie"},
}

# ---------------------------------------------------------------------------
# MODÈLES PYDANTIC
# ---------------------------------------------------------------------------

class TelemetryData(BaseModel):
    ch4_percent: float = Field(..., description="Taux de méthane CH4 en % (50-70%)")
    h2s_ppm: float = Field(..., description="Teneur en sulfure d'hydrogène H2S en ppm (<500 ppm idéal)")
    temperature_celsius: float = Field(..., description="Température du digesteur en °C (37-40°C mésophile, 50-55°C thermophile)")
    pressure_mbar: float = Field(..., description="Pression dans le dôme en mbar (10-30 mbar)")
    ph: float = Field(default=7.2, description="pH du milieu anaérobie (6.8 - 7.6)")
    flow_rate_m3_h: float = Field(default=45.0, description="Débit de production actuel en m3/heure")
    vfa_tic_ratio: Optional[float] = Field(default=0.25, description="Ratio Acides Gras Volatils / Pouvoir Tampon (FOS/TAC)")

class WasteInputItem(BaseModel):
    substrate_type: str = Field(..., description="Clé du substrat (ex: fumier_bovin, dechets_manioc, etc.)")
    tonnage: float = Field(..., description="Quantité en tonnes/jour")

class OptimizationRequest(BaseModel):
    available_inputs: List[WasteInputItem]
    target_production_m3: Optional[float] = Field(default=500.0, description="Objectif de production de biogaz en m3/jour")
    temperature_mode: str = Field(default="mesophile", description="'mesophile' (38°C) ou 'thermophile' (52°C)")

class BatchBlockchainRecord(BaseModel):
    batch_id: str
    timestamp: int
    operator_id: str
    total_waste_tonnes: float
    substrates: List[str]
    biogas_produced_m3: float
    ch4_avg_percent: float
    carbon_credits_tco2e: float
    tx_hash: Optional[str] = None

class GeminiAnalysisRequest(BaseModel):
    type: str = Field(default="custom")
    question: Optional[str] = None
    telemetry: Optional[Dict] = None
    recipe: Optional[Dict] = None

# Stockage en mémoire pour le prototype hackathon
telemetry_history: List[Dict] = []
blockchain_ledger: List[Dict] = []

# ---------------------------------------------------------------------------
# FONCTIONS LOGIQUES & MOTEUR IA D'OPTIMISATION
# ---------------------------------------------------------------------------

def calculate_recipe_metrics(inputs: List[WasteInputItem]) -> Dict:
    """
    Moteur d'optimisation biochimique :
    1. Calcule la matière sèche totale (MS) et matière volatile (MV)
    2. Calcule le ratio Carbone / Azote (C/N) global pondéré
    3. Estime le Potentiel Méthanogène (BMP) et la production théorique de CH4
    4. Évalue la stabilité du bioprocédé (risque d'acidose ou d'inhibition)
    """
    total_tonnage = sum(item.tonnage for item in inputs)
    if total_tonnage <= 0:
        raise HTTPException(status_code=400, detail="Le tonnage total doit être supérieur à 0.")

    total_ms_tonnes = 0.0
    total_mv_tonnes = 0.0
    weighted_cn_numerator = 0.0
    total_bmp_methane_m3 = 0.0
    weighted_ch4_pct = 0.0
    estimated_cost_cfa = 0.0

    breakdown = []

    for item in inputs:
        sub_info = SUBSTRATES_DB.get(item.substrate_type)
        if not sub_info:
            continue

        ms_item = item.tonnage * (sub_info["matiere_seche_pct"] / 100.0)
        mv_item = ms_item * (sub_info["matiere_organique_pct"] / 100.0)
        
        total_ms_tonnes += ms_item
        total_mv_tonnes += mv_item
        
        # Contribution C/N pondérée par la matière volatile
        weighted_cn_numerator += sub_info["ratio_CN"] * mv_item
        
        # M3 de CH4 = MV (tonnes) * BMP (Nm3 CH4 / t MS)
        ch4_potential_item = ms_item * sub_info["bmp"]
        total_bmp_methane_m3 += ch4_potential_item
        
        weighted_ch4_pct += sub_info["ch4_pct_theorique"] * ch4_potential_item
        estimated_cost_cfa += item.tonnage * sub_info["cout_tonne_cfa"]

        breakdown.append({
            "type": item.substrate_type,
            "nom": sub_info["nom"],
            **SUBSTRATE_UI_METADATA[item.substrate_type],
            "tonnage": item.tonnage,
            "pct_du_total": round((item.tonnage / total_tonnage) * 100, 1),
            "matiere_seche_t": round(ms_item, 2),
            "bmp_ch4_m3": round(ch4_potential_item, 1),
            "ratio_CN_unitaire": sub_info["ratio_CN"]
        })

    # Calcul des métriques globales
    overall_cn_ratio = (weighted_cn_numerator / total_mv_tonnes) if total_mv_tonnes > 0 else 25.0
    avg_ch4_percent = (weighted_ch4_pct / total_bmp_methane_m3) if total_bmp_methane_m3 > 0 else 60.0
    
    # Biogaz total (CH4 + CO2 + traces)
    total_biogas_m3 = (total_bmp_methane_m3 / (avg_ch4_percent / 100.0)) if avg_ch4_percent > 0 else 0.0
    
    # Énergie équivalente : 1 m3 de CH4 pur = ~9.97 kWh PCI = ~0.0359 GJ
    energy_kwh = total_bmp_methane_m3 * 9.97
    energy_mwh = energy_kwh / 1000.0

    # Calcul Crédits Carbone évités (Méthodologie IPCC ACM0022 / UNFCCC)
    # Facteur d'évitement : ~0.0022 tonnes CO2e évitées par m3 de CH4 capté et valorisé vs décharge
    carbon_credits_tco2e = total_bmp_methane_m3 * 0.00215

    # Évaluation de la santé microbiologique & Recommandations
    status = "OPTIMAL"
    recommendations = []
    alert_level = "GREEN"

    if overall_cn_ratio < 18.0:
        status = "RISQUE_AMMONIAQUE"
        alert_level = "WARNING"
        recommendations.append("Le ratio C/N est trop bas (< 18). Risque d'accumulation d'ammoniaque toxique pour les bactéries méthanogènes.")
        recommendations.append("Action recommandée : Ajouter des résidus riches en carbone (Épluchures de manioc ou cabosses de cacao) à hauteur de +15-20%.")
    elif overall_cn_ratio > 35.0:
        status = "RISQUE_CARBONE_EXCES"
        alert_level = "WARNING"
        recommendations.append("Le ratio C/N est trop élevé (> 35). Les micro-organismes manquent d'azote pour leur croissance cellulaire.")
        recommendations.append("Action recommandée : Augmenter la part de fientes de volailles ou d'effluents POME pour abaisser le C/N.")
    else:
        recommendations.append("Le ratio C/N est dans la plage dorée de digestion (20:1 - 30:1). Excellente cinétique méthanogène !")
        recommendations.append("Synergie de co-digestion maximisée : Production de CH4 stable et enrichie.")

    return {
        "total_tonnage": round(total_tonnage, 2),
        "total_ms_tonnes": round(total_ms_tonnes, 2),
        "total_mv_tonnes": round(total_mv_tonnes, 2),
        "overall_cn_ratio": round(overall_cn_ratio, 1),
        "estimated_ch4_m3": round(total_bmp_methane_m3, 1),
        "estimated_biogas_m3": round(total_biogas_m3, 1),
        "avg_ch4_percent": round(avg_ch4_percent, 1),
        "energy_mwh": round(energy_mwh, 2),
        "carbon_credits_tco2e": round(carbon_credits_tco2e, 3),
        "estimated_cost_cfa": round(estimated_cost_cfa, 0),
        "status": status,
        "alert_level": alert_level,
        "recommendations": recommendations,
        "breakdown": breakdown
    }

def _store_telemetry_record(payload: Dict):
    """Enregistre une donnée capteur normalisée dans le flux de télémétrie global."""
    normalized = {
        "ch4_percent": float(payload.get("ch4_percent", 60.0)),
        "h2s_ppm": float(payload.get("h2s_ppm", 150.0)),
        "temperature_celsius": float(payload.get("temperature_celsius", 38.0)),
        "pressure_mbar": float(payload.get("pressure_mbar", 18.0)),
        "ph": float(payload.get("ph", 7.3)),
        "flow_rate_m3_h": float(payload.get("flow_rate_m3_h", 45.0)),
        "vfa_tic_ratio": float(payload.get("vfa_tic_ratio", 0.22)),
    }
    receive_iot_telemetry(TelemetryData(**normalized))


def _on_mqtt_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        if isinstance(payload, dict):
            _store_telemetry_record(payload)
            print(f"[MQTT] message reçu sur {msg.topic}: {payload}")
    except Exception as exc:  # pragma: no cover - debug/logging path
        print(f"[MQTT] message invalide: {exc}")


mqtt_client = None


def start_mqtt_listener():
    global mqtt_client
    if mqtt is None:
        print("[MQTT] paho-mqtt non installé; le broker est désactivé pour cette session.")
        return

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_message = _on_mqtt_message

    def on_connect(_client, _userdata, _flags, rc, _properties=None):
        print(f"[MQTT] connecté au broker {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT} (code {rc})")
        _client.subscribe(MQTT_TOPIC)

    client.on_connect = on_connect

    try:
        client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, 60)
        client.loop_start()
        mqtt_client = client
        print(f"[MQTT] écoute démarrée sur le topic {MQTT_TOPIC}")
    except Exception as exc:
        print(f"[MQTT] impossible de se connecter au broker: {exc}")


@app.on_event("startup")
async def startup_event():
    """Démarre le consommateur MQTT en arrière-plan afin d'ingérer les capteurs simulés."""
    start_mqtt_listener()

# ---------------------------------------------------------------------------
# ENDPOINTS API REST
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "projet": "BioGaz+ / SmartDigest",
        "hackathon": "SIREXE 2026",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/api/substrates")
def get_available_substrates():
    """Renvoie la liste des substrats disponibles et leurs caractéristiques physico-chimiques"""
    return SUBSTRATES_DB

@app.post("/api/iot/telemetry")
def receive_iot_telemetry(data: TelemetryData):
    """
    Endpoint de réception des données capteurs IoT en temps réel :
    - CH4 (%)
    - H2S (ppm)
    - Température (°C)
    - Pression (mbar)
    - pH
    """
    timestamp = int(time.time())
    
    # Évaluation de santé du bioréacteur
    alerts = []
    status = "NORMAL"

    if data.ch4_percent < 50.0:
        alerts.append("ALERTE: Taux de CH4 bas (<50%). Risque d'acidification ou lavage de biomasse.")
        status = "ALERTE"
    if data.h2s_ppm > 400.0:
        alerts.append("ALERTE: Concentration en H2S élevée (>400 ppm). Risque de corrosion des génératrices et inhibition.")
        status = "ALERTE"
    if data.temperature_celsius < 35.0 or data.temperature_celsius > 42.0:
        alerts.append(f"ALERTE: Température anormale ({data.temperature_celsius}°C) hors de la plage mésophile (37-40°C).")
        status = "ALERTE"
    if data.pressure_mbar > 28.0:
        alerts.append("DANGER: Surpression dans le dôme de stockage (>28 mbar). Soupape de sécurité requise.")
        status = "CRITIQUE"
    if data.ph < 6.7:
        alerts.append(f"CRITIQUE: pH acide ({data.ph}). Inhibition des archées méthanogènes.")
        status = "CRITIQUE"

    record = {
        "timestamp": timestamp,
        "data": data.dict(),
        "status": status,
        "alerts": alerts
    }

    telemetry_history.append(record)
    # Garder les 500 dernières mesures
    if len(telemetry_history) > 500:
        telemetry_history.pop(0)

    return {
        "success": True,
        "status": status,
        "alerts_count": len(alerts),
        "alerts": alerts,
        "timestamp": timestamp
    }

@app.get("/api/iot/latest")
def get_latest_telemetry():
    """Récupère la dernière lecture des capteurs IoT"""
    if not telemetry_history:
        # Valeur par défaut si aucun paquet n'a été envoyé
        return {
            "timestamp": int(time.time()),
            "data": {
                "ch4_percent": 62.5,
                "h2s_ppm": 145.0,
                "temperature_celsius": 38.2,
                "pressure_mbar": 18.5,
                "ph": 7.3,
                "flow_rate_m3_h": 52.0,
                "vfa_tic_ratio": 0.22
            },
            "status": "NORMAL",
            "alerts": []
        }
    return telemetry_history[-1]

@app.get("/api/iot/history")
def get_telemetry_history(limit: int = 30):
    """Récupère l'historique des télémétries récentes"""
    return telemetry_history[-limit:]

@app.post("/api/ai/optimize-recipe")
def optimize_waste_recipe(req: OptimizationRequest):
    """
    Endpoint IA : Analyse la composition des intrants et calcule la recette optimale
    pour maximiser la production de méthane et la rentabilité carbone.
    """
    try:
        results = calculate_recipe_metrics(req.available_inputs)
        return {
            "success": True,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/blockchain/record-batch")
def record_batch_on_blockchain(batch: BatchBlockchainRecord):
    """
    Simulateur de validation et d'enregistrement de lot sur la Blockchain :
    Génère une empreinte cryptographique SHA-256 et simule l'exécution du Smart Contract.
    """
    # Construction du bloc de données immuable
    payload = f"{batch.batch_id}-{batch.timestamp}-{batch.operator_id}-{batch.total_waste_tonnes}-{batch.biogas_produced_m3}-{batch.carbon_credits_tco2e}"
    tx_hash = "0x" + hashlib.sha256(payload.encode()).hexdigest()
    
    record = batch.dict()
    record["tx_hash"] = tx_hash
    record["block_number"] = 1042000 + len(blockchain_ledger) + 1
    record["status"] = "CONFIRMED"
    record["is_verified"] = True
    record["contract_address"] = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    
    blockchain_ledger.append(record)
    
    return {
        "success": True,
        "message": "Lot certifié et immuablement inscrit sur la Blockchain",
        "tx_hash": tx_hash,
        "block_number": record["block_number"],
        "carbon_credits_issued": batch.carbon_credits_tco2e
    }

@app.get("/api/blockchain/ledger")
def get_blockchain_ledger():
    """Consulte le grand livre de traçabilité des lots et crédits carbone"""
    return {
        "contract": "TraceBiogaz.sol",
        "total_batches": len(blockchain_ledger),
        "total_carbon_credits_tco2e": sum(item.get("carbon_credits_tco2e", 0) for item in blockchain_ledger),
        "batches": blockchain_ledger
    }

@app.post("/api/gemini/analyze")
def analyze_with_gemini(payload: GeminiAnalysisRequest):
    """Server-side Gemini proxy. The API key never reaches the browser."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured on the server.")

    telemetry = payload.telemetry or {}
    recipe = payload.recipe or {}
    if payload.type == "pitch":
        prompt = (
            "Rédige un pitch SIREXE de trois minutes pour BioGaz+ / SmartDigest, "
            "structuré autour de l'IoT, de l'optimisation C/N et de la traçabilité carbone blockchain."
        )
    elif payload.type == "diagnose":
        prompt = (
            "En tant qu'expert en méthanisation, analyse ces mesures en trois points : "
            "santé microbiologique, risques immédiats, puis deux actions opérationnelles. "
            f"Télémétrie : {telemetry}. Recette C/N : {recipe}."
        )
    else:
        prompt = (
            "Tu es l'assistant BioGaz+ / SmartDigest. Réponds de façon concise, "
            "pragmatique et adaptée aux intrants ivoiriens (manioc, POME, cacao, lisier). "
            f"Question : {payload.question or ''}"
        )

    model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    # Use a stable, standard GenerateContent model while diagnosing API availability.
    model = "gemini-2.5-flash"
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    request_body = {"contents": [{"parts": [{"text": prompt}]}]}
    retryable_statuses = {408, 429, 503}
    last_error: Exception | None = None

    for attempt, delay_seconds in enumerate((1, 2, 4), start=1):
        try:
            response = requests.post(
                endpoint,
                headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                json=request_body,
                timeout=60,
            )
            if response.status_code not in retryable_statuses:
                response.raise_for_status()
                text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
                return {"success": True, "text": text}

            print(f"Gemini retryable HTTP {response.status_code}: {response.text}")
            last_error = requests.HTTPError(
                f"Gemini returned HTTP {response.status_code}: {response.text}",
                response=response,
            )
        except requests.exceptions.HTTPError as error:
            response_text = error.response.text if error.response is not None else "<no response body>"
            print(f"Gemini HTTP error: {error}\nResponse body: {response_text}")
            raise HTTPException(
                status_code=502,
                detail="La requête Gemini a été refusée. Vérifiez la clé API, le modèle et la configuration du projet.",
            ) from error
        except requests.exceptions.RequestException as error:
            print(f"Gemini network or timeout error: {error}")
            last_error = error
        except (KeyError, IndexError, ValueError) as error:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned an invalid response format.",
            ) from error

        if attempt < 3:
            time.sleep(delay_seconds + random.uniform(0, 0.25))

    fallback_model = "gemini-3.5-flash-lite"
    fallback_endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{fallback_model}:generateContent"
    )
    try:
        print(f"Gemini primary model unavailable; trying fallback model {fallback_model}.")
        response = requests.post(
            fallback_endpoint,
            headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
            json=request_body,
            timeout=60,
        )
        if response.status_code in retryable_statuses:
            print(f"Gemini fallback HTTP {response.status_code}: {response.text}")
            last_error = requests.HTTPError(
                f"Gemini fallback returned HTTP {response.status_code}: {response.text}",
                response=response,
            )
        else:
            response.raise_for_status()
            text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            return {"success": True, "text": text, "model": fallback_model}
    except requests.exceptions.HTTPError as error:
        response_text = error.response.text if error.response is not None else "<no response body>"
        print(f"Gemini fallback HTTP error: {error}\nResponse body: {response_text}")
        last_error = error
    except requests.exceptions.RequestException as error:
        print(f"Gemini fallback network or timeout error: {error}")
        last_error = error
    except (KeyError, IndexError, ValueError) as error:
        print(f"Gemini fallback response parsing error: {error}")
        last_error = error

    print(f"Gemini failed after retries: {last_error}")
    raise HTTPException(
        status_code=503,
        detail=(
            "Le service Gemini est temporairement indisponible après 3 tentatives. "
            "Veuillez réessayer dans quelques instants."
        ),
    ) from last_error

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
