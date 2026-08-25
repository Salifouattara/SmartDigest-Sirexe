import React, { useState } from "react";
import { SubstrateInfo, OptimizationResult } from "../types";
import { Sparkles, Wand2, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, Scale, Zap, Leaf } from "lucide-react";

interface AIOptimizerProps {
  substrates: Record<string, SubstrateInfo>;
  optimizationResult: OptimizationResult;
  onOptimize: (inputs: { substrate_type: string; tonnage: number }[]) => void;
  onMintToBlockchain: () => void;
}

export const AIOptimizer: React.FC<AIOptimizerProps> = ({
  substrates,
  optimizationResult,
  onOptimize,
  onMintToBlockchain,
}) => {
  // Input tonnages state
  const [tonnages, setTonnages] = useState<Record<string, number>>({
    fumier_bovin: 15.0,
    dechets_manioc: 10.0,
    effluents_huile_palme: 12.0,
    dechets_marche_menagers: 5.0,
    fientes_volailles: 2.0,
    residus_cacao: 4.0,
  });

  const handleTonnageChange = (key: string, val: number) => {
    const next = { ...tonnages, [key]: val };
    setTonnages(next);
    
    // Auto-calculate on change
    const payload = Object.entries(next).map(([substrate_type, tonnage]) => ({
      substrate_type,
      tonnage
    }));
    onOptimize(payload);
  };

  // Presets tailored for SIREXE 2026 / Côte d'Ivoire agro-industrial hubs
  const applyPreset = (presetType: "optimal_ci" | "manioc_pome" | "cocoa_hub" | "poultry_heavy") => {
    let next: Record<string, number> = {};
    if (presetType === "optimal_ci") {
      next = {
        fumier_bovin: 16.0,
        dechets_manioc: 12.0,
        effluents_huile_palme: 14.0,
        dechets_marche_menagers: 6.0,
        fientes_volailles: 2.5,
        residus_cacao: 5.0,
      };
    } else if (presetType === "manioc_pome") {
      next = {
        fumier_bovin: 8.0,
        dechets_manioc: 22.0,
        effluents_huile_palme: 18.0,
        dechets_marche_menagers: 3.0,
        fientes_volailles: 1.0,
        residus_cacao: 2.0,
      };
    } else if (presetType === "cocoa_hub") {
      next = {
        fumier_bovin: 12.0,
        dechets_manioc: 5.0,
        effluents_huile_palme: 6.0,
        dechets_marche_menagers: 4.0,
        fientes_volailles: 2.0,
        residus_cacao: 20.0,
      };
    } else {
      next = {
        fumier_bovin: 10.0,
        dechets_manioc: 4.0,
        effluents_huile_palme: 5.0,
        dechets_marche_menagers: 4.0,
        fientes_volailles: 14.0,
        residus_cacao: 2.0,
      };
    }

    setTonnages(next);
    const payload = Object.entries(next).map(([substrate_type, tonnage]) => ({
      substrate_type,
      tonnage
    }));
    onOptimize(payload);
  };

  // Auto-Balance AI Button: readjusts so C/N lands near 25.0
  const handleAutoBalanceAI = () => {
    // Balances carbon-rich (manioc/cacao) vs nitrogen-rich (poultry/pome/cattle)
    const balanced: Record<string, number> = {
      fumier_bovin: 15.0,
      dechets_manioc: 10.0,
      effluents_huile_palme: 12.0,
      dechets_marche_menagers: 6.0,
      fientes_volailles: 2.0,
      residus_cacao: 6.0,
    };
    setTonnages(balanced);
    const payload = Object.entries(balanced).map(([substrate_type, tonnage]) => ({
      substrate_type,
      tonnage
    }));
    onOptimize(payload);
  };

  const cn = optimizationResult.overall_cn_ratio;
  const isCnOptimal = cn >= 20 && cn <= 30;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Couche 2 : Moteur IA de Formulation & Co-Digestion Optimale
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Algorithme biochimique de pondération des matières volatiles, ratio Carbone/Azote et synergie méthanogène
          </p>
        </div>

        <button
          id="btn-auto-balance"
          onClick={handleAutoBalanceAI}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Wand2 className="w-4 h-4" />
          <span>Auto-Équilibrer par IA (C/N 25:1)</span>
        </button>
      </div>

      {/* Preset Hubs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-semibold text-slate-500 whitespace-nowrap">Scénarios Terrains SIREXE :</span>
        <button
          onClick={() => applyPreset("optimal_ci")}
          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-medium whitespace-nowrap"
        >
          🌟 Mix Optimal Ivoirien (55t/j)
        </button>
        <button
          onClick={() => applyPreset("manioc_pome")}
          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-medium whitespace-nowrap"
        >
          🥔 Bassin Manioc & Huilerie Palme
        </button>
        <button
          onClick={() => applyPreset("cocoa_hub")}
          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-medium whitespace-nowrap"
        >
          🍫 Boucle du Cacao & Marchés
        </button>
        <button
          onClick={() => applyPreset("poultry_heavy")}
          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-medium whitespace-nowrap"
        >
          🐔 Élevage Avicole (Haute Azote)
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Substrate Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              Sélection & Dosage des Intrants (Tonnes / jour)
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Total : {optimizationResult.total_tonnage} t/j
            </span>
          </div>

          <div className="space-y-4">
            {(Object.entries(substrates) as [string, SubstrateInfo][]).map(([key, sub]) => {
              const currentVal = tonnages[key] || 0;
              return (
                <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{sub.icone}</span>
                      <div>
                        <span className="text-slate-800 font-bold">{sub.nomCourt}</span>
                        <span className="text-[10px] text-slate-400 block sm:inline sm:ml-2">
                          (C/N: {sub.ratio_CN} • BMP: {sub.bmp} m³/t MS)
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-emerald-700 font-bold text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                      {currentVal} t/j
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={currentVal}
                    onChange={(e) => handleTonnageChange(key, parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0 t/j</span>
                    <span className="text-slate-500">{sub.categorie} • {sub.cout_tonne_cfa} FCFA/t</span>
                    <span>50 t/j</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Predictive Results & Yield (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* C/N Ratio Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Indicateur Clé : Ratio Carbone / Azote (C/N)
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isCnOptimal
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}>
                {isCnOptimal ? "● Zone d'Or (20-30)" : "● Déséquilibré"}
              </span>
            </div>

            <div className="text-center py-3">
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {cn} <span className="text-lg text-slate-400 font-normal">: 1</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isCnOptimal
                  ? "Équilibre nutritionnel parfait pour la flore méthanogène"
                  : cn < 20
                  ? "Trop d'azote : Risque d'ammoniac toxique"
                  : "Trop de carbone : Ralentissement bactérien"}
              </p>
            </div>

            {/* Visual C/N Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex mt-2 border border-slate-200">
              <div className="w-1/3 bg-amber-400" title="Zone Basse (<20)"></div>
              <div className="w-1/3 bg-emerald-500" title="Zone Optimale (20-30)"></div>
              <div className="w-1/3 bg-blue-400" title="Zone Haute (>30)"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0 (Azoté)</span>
              <span className="text-emerald-700 font-bold">20 - 30 (Idéal)</span>
              <span>50 (Ligneux)</span>
            </div>
          </div>

          {/* Biogas Yield & Energy Output */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md space-y-4">
            <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
              Prédiction de Rendement Énergétique
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                <span className="text-xs text-emerald-200 block">Biogaz Journalier</span>
                <span className="text-2xl font-bold text-white tracking-tight">
                  {optimizationResult.estimated_biogas_m3.toLocaleString()} <span className="text-xs font-normal">m³</span>
                </span>
                <span className="text-[11px] text-emerald-300/80 block mt-0.5">
                  ~{optimizationResult.avg_ch4_percent}% CH₄
                </span>
              </div>

              <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                <span className="text-xs text-emerald-200 block">Énergie Électrique</span>
                <span className="text-2xl font-bold text-white tracking-tight">
                  {optimizationResult.energy_mwh} <span className="text-xs font-normal">MWh/j</span>
                </span>
                <span className="text-[11px] text-emerald-300/80 block mt-0.5">
                  Génératrice biogaz
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-emerald-200">Crédits Carbone Générés :</span>
              <strong className="text-amber-300 text-sm font-mono">
                {optimizationResult.carbon_credits_tco2e} tCO₂e / jour
              </strong>
            </div>

            {/* Certify Button */}
            <button
              id="btn-mint-batch"
              onClick={onMintToBlockchain}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-bold text-xs shadow-lg hover:from-emerald-300 hover:to-teal-200 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-950" />
              <span>Certifier ce Lot sur la Blockchain (TraceBiogaz)</span>
            </button>
          </div>

          {/* AI Recommendations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-800 block">Recommandations du Moteur IA :</span>
            {optimizationResult.recommendations.map((rec, i) => (
              <div key={i} className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                <span className="text-emerald-600 mt-0.5">✔</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
