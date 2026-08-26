import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { CockpitOverview } from "./components/CockpitOverview";
import { IoTSimulator } from "./components/IoTSimulator";
import { AIOptimizer } from "./components/AIOptimizer";
import { BlockchainLedger } from "./components/BlockchainLedger";
import { CodeExplorer } from "./components/CodeExplorer";
import { GeminiCopilot } from "./components/GeminiCopilot";
import { TelemetryData, SubstrateInfo, OptimizationResult, BlockchainBatch } from "./types";
import { SUBSTRATES_DB, optimizeRecipe } from "./utils/biogasCalculator";

type FastApiTelemetryRecord = {
  timestamp: number;
  data: Omit<TelemetryData, "timestamp" | "status" | "alerts">;
  status: TelemetryData["status"];
  alerts: string[];
};

const fromFastApiTelemetry = (record: FastApiTelemetryRecord): TelemetryData => ({
  timestamp: record.timestamp * 1000,
  ...record.data,
  status: record.status,
  alerts: record.alerts,
});

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("cockpit");
  const [substrates] = useState<Record<string, SubstrateInfo>>(SUBSTRATES_DB);

  // Live Telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    timestamp: Date.now(),
    ch4_percent: 63.8,
    h2s_ppm: 135.0,
    temperature_celsius: 38.4,
    pressure_mbar: 19.2,
    ph: 7.35,
    flow_rate_m3_h: 49.5,
    vfa_tic_ratio: 0.22,
    status: "NORMAL",
    alerts: [],
  });

  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);

  // Optimization Result state
  const [optimization, setOptimization] = useState<OptimizationResult>(() => {
    return optimizeRecipe([
      { substrate_type: "fumier_bovin", tonnage: 15.0 },
      { substrate_type: "dechets_manioc", tonnage: 10.0 },
      { substrate_type: "effluents_huile_palme", tonnage: 12.0 },
      { substrate_type: "dechets_marche_menagers", tonnage: 5.0 },
      { substrate_type: "fientes_volailles", tonnage: 2.0 },
      { substrate_type: "residus_cacao", tonnage: 4.0 },
    ]);
  });

  // Blockchain Ledger state
  const [batches, setBatches] = useState<BlockchainBatch[]>([
    {
      batch_id: "BATCH-2026-08-01",
      timestamp: Math.floor((Date.now() - 86400000 * 2) / 1000),
      block_number: 1042001,
      operator_id: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      total_waste_tonnes: 45.0,
      substrates: ["Lisier Bovin", "Manioc", "POME"],
      biogas_produced_m3: 3120.0,
      ch4_avg_percent: 63.8,
      carbon_credits_tco2e: 6.708,
      tx_hash: "0x3f7a91bc8d02e4567a1234bc567890def1234567890abcdef1234567890abcde",
      is_verified: true,
      status: "CONFIRMED",
    },
    {
      batch_id: "BATCH-2026-08-02",
      timestamp: Math.floor((Date.now() - 86400000) / 1000),
      block_number: 1042002,
      operator_id: "0x892a43Db8734C0912925a3b844Bc454e4438f88a",
      total_waste_tonnes: 38.5,
      substrates: ["Manioc", "Marchés", "Cabosses Cacao"],
      biogas_produced_m3: 2640.0,
      ch4_avg_percent: 61.5,
      carbon_credits_tco2e: 5.676,
      tx_hash: "0x9c4e23ba61f890123456789abcdef0123456789abcdef0123456789abcdef012",
      is_verified: true,
      status: "CONFIRMED",
    },
  ]);

  // Fetch latest telemetry and batches from server
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch("/api/iot/latest");
      if (res.ok) {
        const data: FastApiTelemetryRecord = await res.json();
        if (data.data) {
          setTelemetry(fromFastApiTelemetry(data));
        }
      }
      const histRes = await fetch("/api/iot/history?limit=20");
      if (histRes.ok) {
        const history: FastApiTelemetryRecord[] = await histRes.json();
        setTelemetryHistory(history.map(fromFastApiTelemetry));
      }
    } catch {
      // Fallback in-memory
    }
  }, []);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/blockchain/ledger");
      if (res.ok) {
        const data = await res.json();
        if (data?.batches) {
          setBatches(data.batches.map((batch: BlockchainBatch) => ({
            ...batch,
            is_verified: batch.is_verified ?? batch.status === "CONFIRMED",
          })));
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    fetchBatches();
  }, [fetchTelemetry, fetchBatches]);

  // Update telemetry handler
  const handleUpdateTelemetry = async (data: Partial<TelemetryData>) => {
    const next: TelemetryData = {
      ...telemetry,
      ...data,
      timestamp: Date.now(),
    };

    setTelemetry(next);
    setTelemetryHistory((prev) => [...prev.slice(-25), next]);

    try {
      const res = await fetch("/api/iot/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("FastAPI rejected the telemetry payload");

      const receipt = await res.json();
      const confirmed: TelemetryData = {
        ...next,
        timestamp: receipt.timestamp * 1000,
        status: receipt.status,
        alerts: receipt.alerts,
      };
      setTelemetry(confirmed);
      setTelemetryHistory((prev) => [...prev.slice(0, -1), confirmed]);
    } catch {
      // Offline fallback
    }
  };

  // Incident Simulator
  const handleSimulateIncident = (type: "normal" | "acidosis" | "high_h2s" | "overpressure") => {
    if (type === "normal") {
      handleUpdateTelemetry({
        ch4_percent: 64.2,
        h2s_ppm: 120.0,
        temperature_celsius: 38.2,
        pressure_mbar: 18.5,
        ph: 7.35,
        flow_rate_m3_h: 52.0,
        status: "NORMAL",
        alerts: [],
      });
    } else if (type === "acidosis") {
      handleUpdateTelemetry({
        ch4_percent: 46.5,
        h2s_ppm: 210.0,
        temperature_celsius: 37.8,
        pressure_mbar: 14.0,
        ph: 6.42,
        flow_rate_m3_h: 28.0,
        status: "CRITIQUE",
        alerts: [
          "Acidose sévère (pH 6.42). Arrêt de la méthanogenèse.",
          "Action requise : Stopper les intrants sucrés (Manioc) et recirculer le digestat alcalin.",
        ],
      });
    } else if (type === "high_h2s") {
      handleUpdateTelemetry({
        ch4_percent: 58.0,
        h2s_ppm: 480.0,
        temperature_celsius: 38.5,
        pressure_mbar: 19.0,
        ph: 7.2,
        flow_rate_m3_h: 44.0,
        status: "ALERTE",
        alerts: [
          "Pic de sulfure d'hydrogène (480 ppm) détecté !",
          "Risque d'empoisonnement catalytique et corrosion du groupe électrogène.",
        ],
      });
    } else if (type === "overpressure") {
      handleUpdateTelemetry({
        ch4_percent: 63.0,
        h2s_ppm: 140.0,
        temperature_celsius: 39.0,
        pressure_mbar: 29.5,
        ph: 7.3,
        flow_rate_m3_h: 68.0,
        status: "CRITIQUE",
        alerts: [
          "Surpression dôme (29.5 mbar > seuil 25 mbar).",
          "Ouverture automatique de la torchère ou soupape de sécurité requise.",
        ],
      });
    }
  };

  // Recipe optimize handler
  const handleOptimizeRecipe = async (inputs: { substrate_type: string; tonnage: number }[]) => {
    try {
      const res = await fetch("/api/ai/optimize-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available_inputs: inputs }),
      });
      if (!res.ok) throw new Error("FastAPI recipe optimization failed");
      const data = await res.json();
      setOptimization(data.results);
    } catch {
      // Keep previous
    }
  };

  // Mint batch handler
  const handleMintBatch = async () => {
    const payload = {
      batch_id: `BATCH-${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000),
      operator_id: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      total_waste_tonnes: optimization.total_tonnage,
      substrates: optimization.breakdown.map((b) => b.nomCourt),
      biogas_produced_m3: optimization.estimated_biogas_m3,
      ch4_avg_percent: optimization.avg_ch4_percent,
      carbon_credits_tco2e: optimization.carbon_credits_tco2e,
    };

    try {
      const res = await fetch("/api/blockchain/record-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("FastAPI batch certification failed");
      await fetchBatches();
    } catch {
      // Local fallback
      const mockBatch: BlockchainBatch = {
        batch_id: `BATCH-${Date.now()}`,
        timestamp: Math.floor(Date.now() / 1000),
        block_number: 1042000 + batches.length + 1,
        operator_id: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        total_waste_tonnes: optimization.total_tonnage,
        substrates: optimization.breakdown.map((b) => b.nomCourt),
        biogas_produced_m3: optimization.estimated_biogas_m3,
        ch4_avg_percent: optimization.avg_ch4_percent,
        carbon_credits_tco2e: optimization.carbon_credits_tco2e,
        tx_hash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        is_verified: true,
        status: "CONFIRMED",
      };
      setBatches((prev) => [mockBatch, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={telemetry.status}
        liveCh4={telemetry.ch4_percent}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === "cockpit" && (
          <CockpitOverview
            telemetry={telemetry}
            optimization={optimization}
            batches={batches}
            onRefreshTelemetry={fetchTelemetry}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSimulateIncident={handleSimulateIncident}
          />
        )}

        {activeTab === "iot" && (
          <IoTSimulator
            currentTelemetry={telemetry}
            telemetryHistory={telemetryHistory}
            onUpdateTelemetry={handleUpdateTelemetry}
            onRefresh={fetchTelemetry}
          />
        )}

        {activeTab === "ai" && (
          <AIOptimizer
            substrates={substrates}
            optimizationResult={optimization}
            onOptimize={handleOptimizeRecipe}
            onMintToBlockchain={handleMintBatch}
          />
        )}

        {activeTab === "blockchain" && (
          <BlockchainLedger
            batches={batches}
            onMintBatch={handleMintBatch}
          />
        )}

        {activeTab === "code" && <CodeExplorer />}

        {/* Global Copilot Banner on all functional views */}
        {activeTab !== "code" && (
          <GeminiCopilot telemetry={telemetry} optimization={optimization} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>BioGaz+ / SmartDigest</strong> • Candidature SIREXE Hackathon 2026 (Ministère des Mines, du Pétrole et de l'Énergie)
          </span>
          <span className="text-emerald-700 font-medium">
            3 Couches : Capteurs IoT • Moteur IA C/N • Smart Contract TraceBiogaz.sol
          </span>
        </div>
      </footer>
    </div>
  );
}
