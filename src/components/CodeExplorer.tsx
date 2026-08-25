import React, { useState } from "react";
import { HACKATHON_FILES } from "../data/hackathonFiles";
import { Copy, Check, Download, Terminal, FileCode2, ExternalLink, Sparkles, BookOpen, Layers } from "lucide-react";

export const CodeExplorer: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = HACKATHON_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Architecture & Code Source Complet (Livrables SIREXE 2026)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Code Python (FastAPI + Streamlit), Smart Contract Solidity et script de simulation prêts pour le déploiement en local.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copié !" : "Copier le Code"}</span>
          </button>

          <button
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger ({currentFile.filename})</span>
          </button>
        </div>
      </div>

      {/* 5-Min Quickstart Card */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            🚀 Démarrage Rapide en Local en Moins de 5 Minutes
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">1. Backend FastAPI</span>
            <code className="text-slate-300 font-mono text-[11px] block bg-black/40 p-1.5 rounded">
              uvicorn backend.main:app --reload --port 8000
            </code>
            <span className="text-[10px] text-slate-400 mt-1 block">API & Moteur IA C/N</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-teal-400 block mb-1">2. Dashboard Streamlit</span>
            <code className="text-slate-300 font-mono text-[11px] block bg-black/40 p-1.5 rounded">
              streamlit run frontend/app.py
            </code>
            <span className="text-[10px] text-slate-400 mt-1 block">Interface Web Réactive</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-indigo-400 block mb-1">3. Simulation IoT</span>
            <code className="text-slate-300 font-mono text-[11px] block bg-black/40 p-1.5 rounded">
              python scripts/simulate_iot.py
            </code>
            <span className="text-[10px] text-slate-400 mt-1 block">Flux de Capteurs en Direct</span>
          </div>
        </div>
      </div>

      {/* File Navigation & Syntax Viewer */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Tab Selector */}
        <div className="flex items-center gap-1 overflow-x-auto p-2 bg-slate-100 border-b border-slate-200 scrollbar-none">
          {HACKATHON_FILES.map((file, idx) => (
            <button
              key={file.filename}
              onClick={() => setSelectedFileIndex(idx)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFileIndex === idx
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{file.filename}</span>
            </button>
          ))}
        </div>

        {/* File Info Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-slate-800 text-sm block">{currentFile.title}</span>
            <p className="text-slate-500 text-xs mt-0.5">{currentFile.description}</p>
          </div>
          <span className="font-mono text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
            {currentFile.path}
          </span>
        </div>

        {/* Code Content */}
        <div className="relative">
          <pre className="p-5 text-xs font-mono bg-slate-950 text-slate-200 overflow-x-auto max-h-[550px] leading-relaxed select-text">
            <code>{currentFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
