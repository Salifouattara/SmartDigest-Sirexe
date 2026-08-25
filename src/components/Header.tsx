import React from "react";
import { Sparkles, Activity, ShieldCheck, Flame, Cpu, FileCode2, Award } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus: "NORMAL" | "WARNING" | "ALERTE" | "CRITIQUE";
  liveCh4: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  systemStatus,
  liveCh4,
}) => {
  const getStatusBadge = () => {
    switch (systemStatus) {
      case "CRITIQUE":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse">● Alerte Critique (pH/Pression)</span>;
      case "ALERTE":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">● Attention Paramètres</span>;
      case "WARNING":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">● H2S / C/N À Surveiller</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>Digesteur Optimal ({liveCh4}% CH₄)</span>;
    }
  };

  return (
    <header className="border-b border-emerald-900/10 bg-white/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with Hackathon Identity */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3 border-b border-emerald-950/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  BioGaz<span className="text-emerald-600">+</span> <span className="text-slate-400 font-normal text-sm">/ SmartDigest</span>
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  SIREXE 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Ministère des Mines, du Pétrole et de l'Énergie • Prix Thématique : Valorisation des Déchets en Biogaz
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {getStatusBadge()}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Équipe : <strong>BioGaz+ CI (3 Devs)</strong></span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 text-sm font-medium scrollbar-none">
          <button
            id="tab-cockpit"
            onClick={() => setActiveTab("cockpit")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "cockpit"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Cockpit & Digesteur Live</span>
          </button>

          <button
            id="tab-iot"
            onClick={() => setActiveTab("iot")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "iot"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Simulateur IoT (CH₄/H₂S)</span>
          </button>

          <button
            id="tab-ai"
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "ai"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Optimiseur IA Intrants (C/N)</span>
          </button>

          <button
            id="tab-blockchain"
            onClick={() => setActiveTab("blockchain")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "blockchain"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Blockchain & Crédits Carbone</span>
          </button>

          <button
            id="tab-code"
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ml-auto ${
              activeTab === "code"
                ? "bg-slate-900 text-white shadow-sm font-semibold"
                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Code & Livrables Hackathon</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
