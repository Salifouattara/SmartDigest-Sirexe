import React, { useState } from "react";
import { TelemetryData, OptimizationResult, BlockchainBatch } from "../types";
import { apiUrl } from "../api";
import { Flame, Droplets, Thermometer, Gauge, ShieldAlert, Sparkles, ArrowRight, RefreshCw, Zap, TrendingUp, CheckCircle2 } from "lucide-react";

interface CockpitOverviewProps {
  telemetry: TelemetryData;
  optimization: OptimizationResult;
  batches: BlockchainBatch[];
  onRefreshTelemetry: () => void;
  onNavigateTab: (tab: string) => void;
  onSimulateIncident: (type: "normal" | "acidosis" | "high_h2s" | "overpressure") => void;
}

export const CockpitOverview: React.FC<CockpitOverviewProps> = ({
  telemetry,
  optimization,
  batches,
  onRefreshTelemetry,
  onNavigateTab,
  onSimulateIncident,
}) => {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotText, setCopilotText] = useState("");

  const handleRunCopilotDiagnosis = async () => {
    setCopilotLoading(true);
    setIsCopilotOpen(true);
    try {
      const res = await fetch(apiUrl("/api/gemini/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "diagnose",
          telemetry,
          recipe: optimization
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Gemini diagnosis failed");
      setCopilotText(data.text || data.fallback || "Analyse complétée.");
    } catch (error) {
      setCopilotText(error instanceof Error ? error.message : "Le service Gemini est indisponible.");
    } finally {
      setCopilotLoading(false);
    }
  };

  const totalCarbonCredits = batches.reduce((acc, b) => acc + (b.carbon_credits_tco2e || 0), 0);
  const totalBiogasProduced = batches.reduce((acc, b) => acc + (b.biogas_produced_m3 || 0), 0);

  return (
    <div className="space-y-6">
      {/* SIREXE Hackathon Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Solution 3-en-1 : IoT • IA • Blockchain
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Valorisation Intelligente des Déchets en Biogaz & Traçabilité Carbone
            </h2>
            <p className="mt-2 text-emerald-100/80 text-sm sm:text-base leading-relaxed">
              Plateforme cyber-physique conçue pour le contexte agro-industriel ivoirien (Manioc, Palme, Cacao, Élevage). 
              Maximise le rendement en biométhane par IA biochimique et certifie les crédits carbone émis selon la norme ACM0022.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-copilot-diag"
              onClick={handleRunCopilotDiagnosis}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg hover:from-emerald-400 hover:to-teal-300 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-950" />
              <span>Diagnostic IA (Gemini)</span>
            </button>

            <button
              id="btn-view-code"
              onClick={() => onNavigateTab("code")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 font-medium text-sm border border-white/15 transition-all"
            >
              <span>Voir le Code (FastAPI / Solidity)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gemini Diagnostic Modal / Drawer if Open */}
      {isCopilotOpen && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Diagnostic IA en Direct (Gemini 3.7 Flash & Bio-Expert)</span>
            </div>
            <button
              onClick={() => setIsCopilotOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Fermer
            </button>
          </div>

          {copilotLoading ? (
            <div className="flex items-center gap-3 text-slate-600 text-sm py-4">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Analyse des équilibres cinétiques (acidogenèse, ratio C/N, H2S, méthanogenèse)...</span>
            </div>
          ) : (
            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-white p-4 rounded-lg border border-emerald-100 shadow-sm">
              {copilotText}
            </div>
          )}
        </div>
      )}

      {/* Grid: Bioreactor Digital Twin + Realtime Telemetry KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Interactive Digester Twin (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Flame className="w-5 h-5 text-emerald-600" />
                Jumeau Numérique du Bioréacteur
              </h3>
              <p className="text-xs text-slate-500">Unité pilote anaérobie continue (CSTR 500 m³)</p>
            </div>
            <button
              onClick={onRefreshTelemetry}
              title="Rafraîchir les capteurs"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Visual Digester Graphic */}
          <div className="relative w-full h-64 rounded-xl bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950 overflow-hidden flex flex-col items-center justify-center p-4 border border-slate-700">
            {/* Gas Dome (Top) */}
            <div className="absolute top-2 w-36 h-12 rounded-t-full bg-emerald-500/20 border-t-2 border-emerald-400 flex items-center justify-center">
              <span className="text-[11px] font-mono text-emerald-300 font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 animate-bounce" /> Dôme Gaz : {telemetry.pressure_mbar} mbar
              </span>
            </div>

            {/* Rising Gas Bubbles animation */}
            <div className="w-full h-28 relative overflow-hidden flex justify-around items-end">
              <div className="w-3 h-3 rounded-full bg-emerald-400/80 animate-ping" style={{ animationDuration: "2s" }}></div>
              <div className="w-2.5 h-2.5 rounded-full bg-teal-300/70 animate-bounce" style={{ animationDuration: "1.5s" }}></div>
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-300/60 animate-pulse" style={{ animationDuration: "1.8s" }}></div>
              <div className="w-2 h-2 rounded-full bg-emerald-200/90 animate-ping" style={{ animationDuration: "2.4s" }}></div>
            </div>

            {/* Liquid Biomass Layer */}
            <div className="w-full h-20 rounded-b-xl bg-gradient-to-t from-amber-950/80 via-emerald-900/60 to-emerald-800/40 border-t border-emerald-500/30 flex items-center justify-between px-4">
              <div className="text-[11px] text-amber-200">
                <span>Intrants : <strong>{optimization.total_tonnage} t/j</strong></span>
              </div>
              <div className="text-[11px] text-emerald-200">
                <span>C/N Actuel : <strong>{optimization.overall_cn_ratio}:1</strong></span>
              </div>
              <div className="text-[11px] text-teal-200">
                <span>pH : <strong>{telemetry.ph}</strong></span>
              </div>
            </div>

            {/* Agitator rotation indicator */}
            <div className="absolute inset-y-1/2 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-emerald-300 animate-spin flex items-center justify-center text-[10px] text-emerald-200 font-mono">
                50rpm
              </div>
            </div>
          </div>

          {/* Quick Simulation Incident Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block mb-2">Simuler un scénario IoT pour le jury :</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                id="btn-sim-normal"
                onClick={() => onSimulateIncident("normal")}
                className="text-xs px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-center border border-emerald-200"
              >
                🟢 Normal (64%)
              </button>
              <button
                id="btn-sim-acidosis"
                onClick={() => onSimulateIncident("acidosis")}
                className="text-xs px-2 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium text-center border border-rose-200"
              >
                🔴 Acidose (pH 6.4)
              </button>
              <button
                id="btn-sim-h2s"
                onClick={() => onSimulateIncident("high_h2s")}
                className="text-xs px-2 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium text-center border border-amber-200"
              >
                ⚠️ Pic H2S (480ppm)
              </button>
              <button
                id="btn-sim-overpress"
                onClick={() => onSimulateIncident("overpressure")}
                className="text-xs px-2 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium text-center border border-purple-200"
              >
                ⚡ Surpression
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Live Metrics & Dashboard Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 4 Sensor Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* CH4 % */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Taux de Méthane</span>
                <Flame className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {telemetry.ch4_percent}%
              </div>
              <span className={`text-[11px] font-medium flex items-center gap-1 mt-1 ${
                telemetry.ch4_percent >= 60 ? "text-emerald-600" : "text-amber-600"
              }`}>
                {telemetry.ch4_percent >= 60 ? "● Excellent (55-70% visé)" : "● Taux bas à optimiser"}
              </span>
            </div>

            {/* H2S ppm */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Sulfure (H₂S)</span>
                <ShieldAlert className={`w-4 h-4 ${telemetry.h2s_ppm > 300 ? "text-rose-500" : "text-slate-400"}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {telemetry.h2s_ppm} <span className="text-xs font-normal text-slate-500">ppm</span>
              </div>
              <span className={`text-[11px] font-medium mt-1 block ${
                telemetry.h2s_ppm > 350 ? "text-rose-600" : "text-slate-500"
              }`}>
                {telemetry.h2s_ppm > 350 ? "● Risque corrosion" : "● Plage tolérée"}
              </span>
            </div>

            {/* Température */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Température</span>
                <Thermometer className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {telemetry.temperature_celsius} <span className="text-xs font-normal text-slate-500">°C</span>
              </div>
              <span className="text-[11px] font-medium text-emerald-600 mt-1 block">
                ● Régime Mésophile (38°C)
              </span>
            </div>

            {/* Pression */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Pression Dôme</span>
                <Gauge className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {telemetry.pressure_mbar} <span className="text-xs font-normal text-slate-500">mbar</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-1 block">
                ● Sécurisé (10-25 mbar)
              </span>
            </div>
          </div>

          {/* AI Yield & Carbon Impact summary card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-100 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Prédiction IA du Mélange d'Intrants Actuel
                </span>
                <h4 className="text-lg font-bold text-slate-900">
                  {optimization.estimated_biogas_m3.toLocaleString()} m³ de Biogaz / jour
                </h4>
              </div>

              <button
                id="btn-goto-optimizer"
                onClick={() => onNavigateTab("ai")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all self-start sm:self-auto"
              >
                <span>Ajuster la Recette IA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 text-center">
              <div>
                <span className="text-xs text-slate-500 block">Ratio C/N Global</span>
                <span className="text-lg font-bold text-emerald-700">{optimization.overall_cn_ratio}:1</span>
                <span className="text-[10px] text-slate-500 block">Optimal : 20-30:1</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Énergie Produite</span>
                <span className="text-lg font-bold text-teal-700">{optimization.energy_mwh} MWh/j</span>
                <span className="text-[10px] text-slate-500 block">Équivalent électrique</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Crédits Carbone</span>
                <span className="text-lg font-bold text-amber-700">{optimization.carbon_credits_tco2e} tCO₂e/j</span>
                <span className="text-[10px] text-slate-500 block">Évités vs Décharge</span>
              </div>
            </div>
          </div>

          {/* Blockchain & MRV Traçabilité Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-mono font-bold text-xs">
                  EVM
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Traçabilité On-Chain (TraceBiogaz.sol)</h4>
                  <p className="text-xs text-slate-500">Smart Contract déployé • Registre immuable</p>
                </div>
              </div>

              <button
                id="btn-goto-blockchain"
                onClick={() => onNavigateTab("blockchain")}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Grand Livre ({batches.length} Lots)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div>
                <span className="text-slate-500">Total Biogaz Certifié : </span>
                <strong className="text-slate-800">{totalBiogasProduced.toLocaleString()} m³</strong>
              </div>
              <div>
                <span className="text-slate-500">Total Crédits Émis : </span>
                <strong className="text-emerald-700">{totalCarbonCredits.toFixed(2)} tCO₂e</strong>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Audité MRV</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
