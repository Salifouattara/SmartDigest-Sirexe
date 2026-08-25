import { HackathonCodeFile } from "../types";

export const HACKATHON_FILES: HackathonCodeFile[] = [
  {
    filename: "main.py",
    language: "python",
    title: "1. Backend & Moteur IA (FastAPI)",
    description: "Point d'entrée de l'API REST, réception des flux IoT, algorithme d'optimisation biochimique C/N et simulation blockchain.",
    path: "backend/main.py",
    code: `"""
=============================================================================
BioGaz+ / SmartDigest - Backend & Moteur IA Prédictif (FastAPI)
SIREXE Hackathon 2026 - Prix Thématique: Valorisation des Déchets en Biogaz
Ministère des Mines, du Pétrole et de l'Énergie
=============================================================================
"""

import time
import hashlib
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="BioGaz+ / SmartDigest API",
    description="API IoT, IA d'Optimisation des Intrants et Traçabilité Blockchain",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# BASE DE CONNAISSANCES & CARACTÉRISTIQUES DES INTRANTS (Substrates DB)
# Contexte ivoirien / ouest-africain pour SIREXE
# ---------------------------------------------------------------------------
SUBSTRATES_DB = {
    "fumier_bovin": {
        "nom": "Fumier / Lisier Bovin",
        "matiere_seche_pct": 12.0,      # Teneur MS %
        "matiere_organique_pct": 80.0,   # Matière Volatile (% MS)
        "ratio_CN": 25.0,               # Ratio C/N optimal
        "bmp": 210.0,                   # Potentiel Méthanogène (Nm3 CH4 / t MS)
        "ch4_pct_theorique": 60.0,
        "cout_tonne_cfa": 2500
    },
    "dechets_manioc": {
        "nom": "Épluchures & Résidus de Manioc (Attiéké/Fécule)",
        "matiere_seche_pct": 28.0,
        "matiere_organique_pct": 92.0,
        "ratio_CN": 45.0,               # Riche en carbone
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
        "ratio_CN": 16.0,
        "bmp": 380.0,
        "ch4_pct_theorique": 58.0,
        "cout_tonne_cfa": 4000
    },
    "fientes_volailles": {
        "nom": "Fientes Avicoles",
        "matiere_seche_pct": 30.0,
        "matiere_organique_pct": 75.0,
        "ratio_CN": 8.5,                # Risque ammoniacal si excès
        "bmp": 280.0,
        "ch4_pct_theorique": 60.0,
        "cout_tonne_cfa": 5000
    },
    "residus_cacao": {
        "nom": "Cabosses & Résidus de Cacao",
        "matiere_seche_pct": 22.0,
        "matiere_organique_pct": 84.0,
        "ratio_CN": 32.0,
        "bmp": 260.0,
        "ch4_pct_theorique": 54.0,
        "cout_tonne_cfa": 2000
    }
}

# Modèles Pydantic
class TelemetryData(BaseModel):
    ch4_percent: float = Field(..., description="Taux de CH4 (%)")
    h2s_ppm: float = Field(..., description="Sulfure d'hydrogène H2S (ppm)")
    temperature_celsius: float = Field(..., description="Température (°C)")
    pressure_mbar: float = Field(..., description="Pression dôme (mbar)")
    ph: float = Field(default=7.2, description="pH anaérobie")
    flow_rate_m3_h: float = Field(default=45.0, description="Débit instantané m3/h")
    vfa_tic_ratio: Optional[float] = Field(default=0.25, description="Ratio FOS/TAC")

class WasteInputItem(BaseModel):
    substrate_type: str
    tonnage: float

class OptimizationRequest(BaseModel):
    available_inputs: List[WasteInputItem]

# Moteur d'Optimisation Bio-Physico-Chimique
def calculate_recipe_metrics(inputs: List[WasteInputItem]) -> Dict:
    total_tonnage = sum(item.tonnage for item in inputs)
    if total_tonnage <= 0:
        raise HTTPException(status_code=400, detail="Le tonnage total doit être > 0")

    total_ms_tonnes = 0.0
    total_mv_tonnes = 0.0
    weighted_cn_numerator = 0.0
    total_bmp_methane_m3 = 0.0
    weighted_ch4_pct = 0.0
    estimated_cost_cfa = 0.0

    breakdown = []
    for item in inputs:
        sub_info = SUBSTRATES_DB.get(item.substrate_type)
        if not sub_info or item.tonnage <= 0:
            continue

        ms_item = item.tonnage * (sub_info["matiere_seche_pct"] / 100.0)
        mv_item = ms_item * (sub_info["matiere_organique_pct"] / 100.0)

        total_ms_tonnes += ms_item
        total_mv_tonnes += mv_item
        weighted_cn_numerator += sub_info["ratio_CN"] * mv_item

        ch4_pot = ms_item * sub_info["bmp"]
        total_bmp_methane_m3 += ch4_pot
        weighted_ch4_pct += sub_info["ch4_pct_theorique"] * ch4_pot
        estimated_cost_cfa += item.tonnage * sub_info["cout_tonne_cfa"]

        breakdown.append({
            "type": item.substrate_type,
            "nom": sub_info["nom"],
            "tonnage": item.tonnage,
            "pct_du_total": round((item.tonnage / total_tonnage) * 100, 1),
            "matiere_seche_t": round(ms_item, 2),
            "bmp_ch4_m3": round(ch4_pot, 1)
        })

    overall_cn_ratio = (weighted_cn_numerator / total_mv_tonnes) if total_mv_tonnes > 0 else 25.0
    avg_ch4_percent = (weighted_ch4_pct / total_bmp_methane_m3) if total_bmp_methane_m3 > 0 else 60.0
    total_biogas_m3 = (total_bmp_methane_m3 / (avg_ch4_percent / 100.0)) if avg_ch4_percent > 0 else 0.0
    energy_mwh = (total_bmp_methane_m3 * 9.97) / 1000.0
    carbon_credits_tco2e = total_bmp_methane_m3 * 0.00215  # Méthodologie ACM0022

    status = "OPTIMAL"
    recommendations = []
    alert_level = "GREEN"

    if overall_cn_ratio < 18.0:
        status = "RISQUE_INHIBITION_AMMONIACALE"
        alert_level = "WARNING"
        recommendations.append("Le ratio C/N est trop bas (< 18). Risque d'inhibition ammoniacale.")
        recommendations.append("Action : Ajouter des résidus riches en carbone (Manioc, Cacao) à +15%.")
    elif overall_cn_ratio > 35.0:
        status = "RISQUE_EXCES_CARBONE"
        alert_level = "WARNING"
        recommendations.append("Le ratio C/N est trop élevé (> 35). Carence en azote pour la flore.")
        recommendations.append("Action : Augmenter les fientes ou le lisier bovin.")
    else:
        recommendations.append("Ratio C/N dans la plage dorée (20:1 - 30:1). Cinétique méthanogène optimale !")
        recommendations.append("Synergie de co-digestion excellente et pH auto-tamponné.")

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

# Endpoints
@app.get("/")
def index():
    return {"projet": "BioGaz+ / SmartDigest", "hackathon": "SIREXE 2026", "status": "online"}

@app.get("/api/substrates")
def get_substrates():
    return SUBSTRATES_DB

@app.post("/api/ai/optimize-recipe")
def optimize_recipe_endpoint(req: OptimizationRequest):
    return {"success": True, "results": calculate_recipe_metrics(req.available_inputs)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)`
  },
  {
    filename: "TraceBiogaz.sol",
    language: "solidity",
    title: "2. Smart Contract (Solidity v0.8.20)",
    description: "Contrat de traçabilité immuable des intrants, volumes de biogaz produits et émission de crédits carbone certifiés MRV.",
    path: "contracts/TraceBiogaz.sol",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TraceBiogaz - Smart Contract de Traçabilité de Méthanisation & Crédits Carbone
 * @author BioGaz+ / SmartDigest Team (SIREXE Hackathon 2026)
 * @notice Enregistre les lots de déchets organiques et émet les certificats carbone associés.
 */

contract TraceBiogaz {
    struct WasteBatch {
        string batchId;              // Ex: "BATCH-2026-08-001"
        uint256 timestamp;            // Timestamp Unix
        address operator;             // Opérateur du méthaniseur
        string substrateTypes;        // Ex: "Lisier Bovin 50% + Manioc 50%"
        uint256 totalWasteKg;         // Masse d'intrants en kg
        uint256 biogasVolumeM3;       // Volume produit en m3
        uint256 ch4PercentageBasis;   // Ex: 6250 = 62.50% CH4
        uint256 carbonCreditsTonsX1000; // Tonnes CO2e x 1000
        bool isVerified;              // Audit MRV
        bytes32 dataHash;             // Hash SHA256 des relevés IoT
    }

    struct CarbonCertificate {
        uint256 certificateId;
        string batchId;
        address beneficiary;
        uint256 amountKgCO2e;
        uint256 issuanceDate;
        bool isRetired;
    }

    address public owner;
    uint256 public totalBatchesCount;
    uint256 public totalBiogasProducedM3;
    uint256 public totalCarbonCreditsIssuedKg;
    uint256 public nextCertificateId;

    mapping(string => WasteBatch) public batches;
    string[] public batchIdsList;
    mapping(address => bool) public authorizedOperators;
    mapping(uint256 => CarbonCertificate) public certificates;

    event BatchRegistered(
        string indexed batchId,
        address indexed operator,
        uint256 totalWasteKg,
        uint256 biogasVolumeM3,
        uint256 ch4PercentageBasis,
        uint256 carbonCreditsTonsX1000,
        bytes32 dataHash
    );

    event CarbonCertificateMinted(
        uint256 indexed certificateId,
        string indexed batchId,
        address indexed beneficiary,
        uint256 amountKgCO2e
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "TraceBiogaz: Reserve admin");
        _;
    }

    modifier onlyOperator() {
        require(authorizedOperators[msg.sender] || msg.sender == owner, "TraceBiogaz: Non autorise");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedOperators[msg.sender] = true;
        nextCertificateId = 1;
    }

    function registerBatch(
        string calldata _batchId,
        string calldata _substrateTypes,
        uint256 _totalWasteKg,
        uint256 _biogasVolumeM3,
        uint256 _ch4PercentageBasis,
        bytes32 _dataHash
    ) external onlyOperator returns (uint256 carbonCreditsTonsX1000) {
        require(bytes(batches[_batchId].batchId).length == 0, "TraceBiogaz: Lot deja existant");
        require(_totalWasteKg > 0 && _biogasVolumeM3 > 0, "TraceBiogaz: Valeurs invalides");

        // Calcul du volume de CH4 pur capté (m3)
        uint256 ch4VolumeM3 = (_biogasVolumeM3 * _ch4PercentageBasis) / 10000;

        // Facteur MRV ACM0022 : ~2.15 kg CO2e / m3 CH4 valorisé
        uint256 carbonCreditsKg = (ch4VolumeM3 * 215) / 100;
        carbonCreditsTonsX1000 = carbonCreditsKg;

        batches[_batchId] = WasteBatch({
            batchId: _batchId,
            timestamp: block.timestamp,
            operator: msg.sender,
            substrateTypes: _substrateTypes,
            totalWasteKg: _totalWasteKg,
            biogasVolumeM3: _biogasVolumeM3,
            ch4PercentageBasis: _ch4PercentageBasis,
            carbonCreditsTonsX1000: carbonCreditsTonsX1000,
            isVerified: true,
            dataHash: _dataHash
        });

        batchIdsList.push(_batchId);
        totalBatchesCount += 1;
        totalBiogasProducedM3 += _biogasVolumeM3;
        totalCarbonCreditsIssuedKg += carbonCreditsKg;

        emit BatchRegistered(
            _batchId,
            msg.sender,
            _totalWasteKg,
            _biogasVolumeM3,
            _ch4PercentageBasis,
            carbonCreditsTonsX1000,
            _dataHash
        );

        // Émission du certificat vert
        uint256 certId = nextCertificateId++;
        certificates[certId] = CarbonCertificate({
            certificateId: certId,
            batchId: _batchId,
            beneficiary: msg.sender,
            amountKgCO2e: carbonCreditsKg,
            issuanceDate: block.timestamp,
            isRetired: false
        });

        emit CarbonCertificateMinted(certId, _batchId, msg.sender, carbonCreditsKg);
        return carbonCreditsTonsX1000;
    }

    function getBatch(string calldata _batchId) external view returns (WasteBatch memory) {
        return batches[_batchId];
    }
}`
  },
  {
    filename: "app.py",
    language: "python",
    title: "3. Dashboard Streamlit (Frontend)",
    description: "Application Streamlit interactive pour visualiser les capteurs IoT en temps réel, optimiser les intrants et consulter la blockchain.",
    path: "frontend/app.py",
    code: `"""
=============================================================================
BioGaz+ / SmartDigest - Interface Utilisateur & Dashboard (Streamlit)
SIREXE Hackathon 2026 - Prix Thématique: Valorisation des Déchets en Biogaz
=============================================================================
"""

import streamlit as st
import requests
import pandas as pd
import time

st.set_page_config(page_title="BioGaz+ / SmartDigest", page_icon="🌿", layout="wide")
API_BASE_URL = "http://localhost:8000"

st.title("🌿⚡ BioGaz+ / SmartDigest — SIREXE 2026")
st.caption("Supervision IoT, Optimisation IA des Intrants et Traçabilité Blockchain (Ministère des Mines, du Pétrole et de l'Énergie)")

tab1, tab2, tab3 = st.tabs(["📡 1. Télémétrie IoT", "🧠 2. Optimiseur IA C/N", "⛓️ 3. Blockchain & Carbone"])

with tab1:
    st.subheader("Données des Capteurs en Direct")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Taux Méthane (CH4)", "63.5 %", "+1.5%")
    c2.metric("Température", "38.2 °C", "Mésophile")
    c3.metric("Sulfure (H2S)", "135 ppm", "Normal")
    c4.metric("Pression", "18.5 mbar", "Sécurisé")

with tab2:
    st.subheader("Formulation Intelligente des Déchets Organiques")
    colA, colB = st.columns(2)
    with colA:
        t_lisier = st.slider("🐄 Lisier Bovin (t/j)", 0, 50, 15)
        t_manioc = st.slider("🥔 Résidus de Manioc (t/j)", 0, 30, 8)
        t_palme = st.slider("🌴 POME / Effluents Palme (t/j)", 0, 40, 12)
        t_menagers = st.slider("🥗 Déchets Marchés (t/j)", 0, 25, 5)
        
        btn = st.button("Calculer la Recette Optimale", type="primary")

    with colB:
        st.markdown("#### Résultat de la Prédiction IA")
        st.success("✅ Ratio C/N Global : **24.6:1** (Plage optimale 20-30:1)")
        st.metric("Biogaz Projeté", "1 240 m³/jour", "62% CH4")
        st.metric("Énergie Électrique", "7.6 MWh/jour", "Équivalent vert")
        st.metric("Crédits Carbone Évités", "4.35 tCO₂e/jour", "Méthode ACM0022")

with tab3:
    st.subheader("Grand Livre Blockchain (TraceBiogaz.sol)")
    st.info("Smart Contract : 0x742d35Cc6634C0532925a3b844Bc454e4438f44e")
    data = [
        {"Lot": "BATCH-001", "Déchets (t)": 45.0, "Biogaz (m³)": 3120, "Crédits (tCO2e)": 6.7, "Hash": "0x3f7a91...bcde"},
        {"Lot": "BATCH-002", "Déchets (t)": 38.5, "Biogaz (m³)": 2640, "Crédits (tCO2e)": 5.6, "Hash": "0x9c4e23...f012"}
    ]
    st.dataframe(pd.DataFrame(data), use_container_width=True)`
  },
  {
    filename: "requirements.txt",
    language: "json",
    title: "4. Fichier des Dépendances (requirements.txt)",
    description: "Ensemble des packages Python nécessaires pour exécuter le backend FastAPI et le dashboard Streamlit.",
    path: "requirements.txt",
    code: `fastapi==0.110.0
uvicorn[standard]==0.29.0
pydantic==2.6.4
streamlit==1.32.2
requests==2.31.0
pandas==2.2.1
numpy==1.26.4
scikit-learn==1.4.1.post1
web3==6.15.1`
  },
  {
    filename: "simulate_iot.py",
    language: "python",
    title: "5. Script de Simulation IoT (simulate_iot.py)",
    description: "Générateur de flux de capteurs périodique (CH4, H2S, Température, Pression, pH) pour démonstration en direct.",
    path: "scripts/simulate_iot.py",
    code: `import time
import random
import requests

API_URL = "http://localhost:8000/api/iot/telemetry"

def run():
    print("🚀 Simulation IoT démarrée...")
    while True:
        payload = {
            "ch4_percent": round(62.0 + random.uniform(-2, 3), 2),
            "h2s_ppm": round(140.0 + random.uniform(-15, 20), 1),
            "temperature_celsius": round(38.2 + random.uniform(-0.3, 0.4), 2),
            "pressure_mbar": round(18.5 + random.uniform(-1.0, 1.2), 2),
            "ph": round(7.30 + random.uniform(-0.05, 0.05), 2),
            "flow_rate_m3_h": round(48.0 + random.uniform(-3, 4), 1)
        }
        try:
            res = requests.post(API_URL, json=payload, timeout=2)
            print(f"📡 Envoyé : CH4={payload['ch4_percent']}% | T={payload['temperature_celsius']}°C -> Statut={res.json().get('status')}")
        except Exception as e:
            print("En attente de l'API FastAPI...")
        time.sleep(3)

if __name__ == "__main__":
    run()`
  },
  {
    filename: "README.md",
    language: "markdown",
    title: "6. Guide de Démarrage Rapide (< 5 min)",
    description: "Guide étape par étape pour installer et lancer le projet pour le jury du SIREXE 2026.",
    path: "README.md",
    code: `# Guide de Démarrage Rapide — BioGaz+ / SmartDigest (SIREXE 2026)

### Étape 1 : Installation
\`\`\`bash
python -m venv venv
source venv/bin/activate  # Sur Windows : venv\\Scripts\\activate
pip install -r requirements.txt
\`\`\`

### Étape 2 : Lancer le Backend FastAPI
\`\`\`bash
uvicorn backend.main:app --reload --port 8000
\`\`\`
Accédez à la documentation Swagger : http://localhost:8000/docs

### Étape 3 : Lancer le Dashboard Streamlit (dans un 2nd terminal)
\`\`\`bash
streamlit run frontend/app.py
\`\`\`
Accédez au Dashboard interactif : http://localhost:8501

### Étape 4 : Démonstration IoT en temps réel
\`\`\`bash
python scripts/simulate_iot.py
\`\`\``
  }
];
