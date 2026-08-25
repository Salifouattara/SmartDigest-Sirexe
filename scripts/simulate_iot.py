"""
=============================================================================
BioGaz+ / SmartDigest - Script de Simulation IoT (Capteurs en Direct)
SIREXE Hackathon 2026
=============================================================================
Simule l'envoi continu de données de capteurs (CH4, H2S, Température, Pression, pH)
vers l'API FastAPI à intervalles réguliers.
"""

import time
import random
import requests

API_URL = "http://localhost:8000/api/iot/telemetry"

def generate_telemetry_reading(step_index=0):
    # Dynamique biologique avec petites fluctuations réalistes
    noise = random.uniform(-0.5, 0.5)
    
    # Cycles de digestion
    ch4_base = 62.0 + 2.5 * (1 if (step_index % 10 < 5) else -1) + noise
    ch4_base = max(45.0, min(75.0, ch4_base))

    h2s_base = 140.0 + random.uniform(-15.0, 20.0)
    temp_base = 38.2 + random.uniform(-0.2, 0.3)
    pressure_base = 18.5 + random.uniform(-1.0, 1.2)
    ph_base = 7.30 + random.uniform(-0.08, 0.08)
    flow_base = 48.0 + random.uniform(-3.0, 4.0)

    return {
        "ch4_percent": round(ch4_base, 2),
        "h2s_ppm": round(h2s_base, 1),
        "temperature_celsius": round(temp_base, 2),
        "pressure_mbar": round(pressure_base, 2),
        "ph": round(ph_base, 2),
        "flow_rate_m3_h": round(flow_base, 1),
        "vfa_tic_ratio": round(0.22 + random.uniform(-0.02, 0.03), 3)
    }

def run_simulation(interval_seconds=3, max_iterations=100):
    print("🚀 [BioGaz+ IoT] Démarrage du flux de télémétrie vers", API_URL)
    print("Appuyez sur Ctrl+C pour arrêter.")
    
    for i in range(max_iterations):
        payload = generate_telemetry_reading(i)
        try:
            res = requests.post(API_URL, json=payload, timeout=3)
            if res.status_code == 200:
                data = res.json()
                print(f"[{i+1}/{max_iterations}] 📡 Télémétrie envoyée: CH4={payload['ch4_percent']}% | H2S={payload['h2s_ppm']}ppm | T={payload['temperature_celsius']}°C | Statut: {data.get('status')}")
            else:
                print(f"⚠️ Erreur API ({res.status_code}): {res.text}")
        except requests.exceptions.ConnectionError:
            print("❌ Impossible de contacter l'API (FastAPI n'est pas encore lancé sur le port 8000).")
        except Exception as e:
            print(f"❌ Erreur: {e}")
        
        time.sleep(interval_seconds)

if __name__ == "__main__":
    run_simulation()
