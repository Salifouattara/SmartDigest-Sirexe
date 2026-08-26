import React, { useState } from "react";
import { Sparkles, MessageSquare, Send, Award, RefreshCw, HelpCircle, CheckCircle2 } from "lucide-react";
import { TelemetryData, OptimizationResult } from "../types";
import { apiUrl } from "../api";

interface GeminiCopilotProps {
  telemetry: TelemetryData;
  optimization: OptimizationResult;
}

export const GeminiCopilot: React.FC<GeminiCopilotProps> = ({
  telemetry,
  optimization,
}) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleAskQuestion = async (customPrompt?: string, type: "custom" | "pitch" | "diagnose" = "custom") => {
    const q = customPrompt || question;
    if (!q && type === "custom") return;

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/gemini/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          question: q,
          telemetry,
          recipe: optimization
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Gemini analysis failed");
      setResponse(data.text || data.fallback || "Analyse complétée.");
    } catch (error) {
      setResponse(error instanceof Error ? error.message : "Le service Gemini est indisponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Copilot IA & Assistant SIREXE (Gemini 3.7 Flash)</h3>
            <p className="text-xs text-slate-500">Expertise biochimique, diagnostic du digesteur & argumentation jury</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAskQuestion(undefined, "pitch")}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Générer le Pitch Jury SIREXE</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => {
            setQuestion("Comment traiter l'acidité et l'eau des épluchures de manioc dans le digesteur ?");
            handleAskQuestion("Comment traiter l'acidité et l'eau des épluchures de manioc dans le digesteur ?");
          }}
          className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all text-[11px]"
        >
          🥔 Gisement Manioc & Acidose
        </button>
        <button
          onClick={() => {
            setQuestion("Quelle est la formule MRV exacte utilisée pour calculer les crédits carbone ?");
            handleAskQuestion("Quelle est la formule MRV exacte utilisée pour calculer les crédits carbone ?");
          }}
          className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all text-[11px]"
        >
          🌱 Méthodologie Carbone ACM0022
        </button>
        <button
          onClick={() => {
            setQuestion("Comment le smart contract TraceBiogaz garantit-il l'inviolabilité des mesures IoT ?");
            handleAskQuestion("Comment le smart contract TraceBiogaz garantit-il l'inviolabilité des mesures IoT ?");
          }}
          className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all text-[11px]"
        >
          ⛓️ Sécurité IoT & Blockchain
        </button>
      </div>

      {/* Interactive Input Form */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Posez une question technique ou stratégique sur BioGaz+..."
          className="flex-1 px-3.5 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAskQuestion();
          }}
        />
        <button
          onClick={() => handleAskQuestion()}
          disabled={loading || !question.trim()}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>{loading ? "Génération..." : "Analyser"}</span>
        </button>
      </div>

      {/* Response Box */}
      {response && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line shadow-inner">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Réponse de l'IA BioGaz+ :</span>
          </div>
          {response}
        </div>
      )}
    </div>
  );
};
