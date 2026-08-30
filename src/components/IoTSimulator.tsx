import React, { useState, useEffect, useMemo } from "react";
import { TelemetryData } from "../types";
import { Flame, Droplets, Thermometer, Gauge, Activity, Play, Pause, RefreshCw, Send, CheckCircle2, ShieldAlert } from "lucide-react";

interface IoTSimulatorProps {
  currentTelemetry: TelemetryData;
  telemetryHistory: TelemetryData[];
  onUpdateTelemetry: (data: Partial<TelemetryData>) => Promise<void>;
  onRefresh: () => void;
}

export const IoTSimulator: React.FC<IoTSimulatorProps> = ({
  currentTelemetry,
  telemetryHistory,
  onUpdateTelemetry,
  onRefresh,
}) => {
  const [isAutoStreaming, setIsAutoStreaming] = useState(true);
  const [ch4, setCh4] = useState(currentTelemetry.ch4_percent);
  const [h2s, setH2s] = useState(currentTelemetry.h2s_ppm);
  const [temp, setTemp] = useState(currentTelemetry.temperature_celsius);
  const [press, setPress] = useState(currentTelemetry.pressure_mbar);
  const [ph, setPh] = useState(currentTelemetry.ph);
  const [flow, setFlow] = useState(currentTelemetry.flow_rate_m3_h);
  const [isSending, setIsSending] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    setCh4(currentTelemetry.ch4_percent);
    setH2s(currentTelemetry.h2s_ppm);
    setTemp(currentTelemetry.temperature_celsius);
    setPress(currentTelemetry.pressure_mbar);
    setPh(currentTelemetry.ph);
    setFlow(currentTelemetry.flow_rate_m3_h);
  }, [currentTelemetry]);

  useEffect(() => {
    if (!isAutoStreaming) return;
    const interval = setInterval(() => {
      const noise = (Math.random() - 0.5) * 0.4;
      const newCh4 = Number(Math.max(48, Math.min(74, ch4 + noise)).toFixed(2));
      const newH2s = Number(Math.max(80, Math.min(450, h2s + (Math.random() - 0.5) * 5)).toFixed(1));
      const newTemp = Number((38.2 + (Math.random() - 0.5) * 0.3).toFixed(2));
      const newPress = Number((18.5 + (Math.random() - 0.5) * 0.8).toFixed(2));
      const newFlow = Number((48 + (newCh4 - 58) * 1.1).toFixed(1));

      onUpdateTelemetry({
        ch4_percent: newCh4,
        h2s_ppm: newH2s,
        temperature_celsius: newTemp,
        pressure_mbar: newPress,
        ph,
        flow_rate_m3_h: newFlow,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoStreaming, ch4, h2s, temp, press, ph, onUpdateTelemetry]);

  const handleManualSend = async () => {
    setIsSending(true);
    setFeedbackMsg("");
    try {
      await onUpdateTelemetry({
        ch4_percent: Number(ch4),
        h2s_ppm: Number(h2s),
        temperature_celsius: Number(temp),
        pressure_mbar: Number(press),
        ph: Number(ph),
        flow_rate_m3_h: Number(flow),
      });
      setFeedbackMsg("Paquet de télémétrie IoT transmis avec succès !");
      setTimeout(() => setFeedbackMsg(""), 4000);
    } catch {
      setFeedbackMsg("Erreur lors de la transmission IoT.");
    } finally {
      setIsSending(false);
    }
  };

  const serialLog = useMemo(
    () => [
      `[${new Date(currentTelemetry.timestamp).toLocaleTimeString("fr-FR")}][UART] CH4=${currentTelemetry.ch4_percent.toFixed(1)}%`,
      `[${new Date(currentTelemetry.timestamp).toLocaleTimeString("fr-FR")}][MQTT] H2S=${currentTelemetry.h2s_ppm.toFixed(0)} ppm`,
      `[${new Date(currentTelemetry.timestamp).toLocaleTimeString("fr-FR")}][TEMP] ${currentTelemetry.temperature_celsius.toFixed(1)}°C`,
      `[${new Date(currentTelemetry.timestamp).toLocaleTimeString("fr-FR")}][PRESS] ${currentTelemetry.pressure_mbar.toFixed(1)} mbar`,
    ],
    [currentTelemetry]
  );

  const embeddedCards = [
    { label: "Gaz produit (CH4)", value: `${currentTelemetry.ch4_percent.toFixed(1)}%`, accent: "emerald" },
    { label: "Épuration H2S", value: `${currentTelemetry.h2s_ppm.toFixed(0)} ppm`, accent: "amber" },
    { label: "Cuve - température", value: `${currentTelemetry.temperature_celsius.toFixed(1)}°C`, accent: "rose" },
    { label: "Dôme - pression", value: `${currentTelemetry.pressure_mbar.toFixed(1)} mbar`, accent: "sky" },
  ];

  const installationState = [
    { name: "Digesteur D-01", status: "En digestion", color: "bg-emerald-500" },
    { name: "Station gaz G-02", status: "En épuration", color: "bg-teal-500" },
    { name: "MQTT Broker", status: "Active", color: "bg-sky-500" },
    { name: "FastAPI", status: "Ready", color: "bg-violet-500" },
    { name: "Poste de contrôle", status: "Streaming", color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <h2 className="text-lg font-bold text-slate-900">Jumeau opérationnel : unité de méthanisation</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synoptique de procédé relié aux sondes CH4, H2S, température, pression et au flux de télémétrie MQTT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoStreaming(!isAutoStreaming)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              isAutoStreaming
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
            }`}
          >
            {isAutoStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5 text-emerald-700" />
                <span>Flux Automatique Actif (3s)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-slate-700" />
                <span>Démarrer Flux Continu</span>
              </>
            )}
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {currentTelemetry.alerts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Alertes de Biorégulation Actives ({currentTelemetry.alerts.length}) :</span>
          </div>
          <ul className="text-xs space-y-0.5 pl-6 list-disc text-amber-800">
            {currentTelemetry.alerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Panneau de Contrôle des Capteurs (Injection Manuelle)
            </h3>
            <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              POST /api/iot/telemetry
            </span>
          </div>

          <div className="grid gap-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 shadow-inner">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Procédé en exploitation
                </div>
                <span className="font-mono text-[10px] text-slate-400">SITE CI-01 / D-01</span>
              </div>

              <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 p-3">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.35) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                <svg viewBox="0 0 760 390" className="relative z-10 h-full w-full" role="img" aria-label="Synoptique de l'installation de méthanisation">
                  <defs>
                    <linearGradient id="digestate" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#3d8d62" />
                      <stop offset="100%" stopColor="#163d35" />
                    </linearGradient>
                    <linearGradient id="gasPipe" x1="0" x2="1">
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="50%" stopColor="#6ee7b7" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="steel" x1="0" x2="1">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="28%" stopColor="#cbd5e1" />
                      <stop offset="48%" stopColor="#64748b" />
                      <stop offset="75%" stopColor="#e2e8f0" />
                      <stop offset="100%" stopColor="#334155" />
                    </linearGradient>
                    <linearGradient id="tankWall" x1="0" x2="1">
                      <stop offset="0%" stopColor="#0f5d50" />
                      <stop offset="45%" stopColor="#287965" />
                      <stop offset="70%" stopColor="#1b554b" />
                      <stop offset="100%" stopColor="#0c3935" />
                    </linearGradient>
                    <linearGradient id="concrete" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>
                    <linearGradient id="siteSky" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#0c4a6e" />
                      <stop offset="58%" stopColor="#164e63" />
                      <stop offset="59%" stopColor="#173f3a" />
                      <stop offset="100%" stopColor="#092f2d" />
                    </linearGradient>
                    <pattern id="groundGrid" width="30" height="18" patternUnits="userSpaceOnUse" patternTransform="skewX(-25)">
                      <path d="M 0 0 H 30 V 18 H 0 Z" fill="none" stroke="#5eead4" strokeWidth=".7" opacity=".2" />
                    </pattern>
                    <filter id="equipmentShadow" x="-30%" y="-30%" width="180%" height="190%">
                      <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#020617" floodOpacity=".65" />
                    </filter>
                    <radialGradient id="domeGlow">
                      <stop offset="0%" stopColor="#86efac" stopOpacity=".7" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </radialGradient>
                    <filter id="sensorGlow" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <marker id="gasArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#34d399" />
                    </marker>
                    <marker id="slurryArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#60a5fa" />
                    </marker>
                  </defs>

                  <rect width="760" height="390" fill="url(#siteSky)" />
                  <path d="M0 252 L760 222 V390 H0 Z" fill="#0b3735" />
                  <path d="M0 252 L760 222 V390 H0 Z" fill="url(#groundGrid)" />
                  <path d="M0 255 L760 225" stroke="#67e8f9" strokeWidth="1" opacity=".25" />
                  <path id="input-flow" d="M92 285 H180" stroke="#60a5fa" strokeWidth="10" fill="none" markerEnd="url(#slurryArrow)" />
                  <path id="gas-flow-main" d="M386 117 H485 V95 H556" stroke="url(#gasPipe)" strokeWidth="10" fill="none" markerEnd="url(#gasArrow)" />
                  <path id="gas-flow-clean" d="M632 135 H708" stroke="url(#gasPipe)" strokeWidth="10" fill="none" markerEnd="url(#gasArrow)" />
                  <path id="digestate-flow" d="M282 326 V360 H440" stroke="#60a5fa" strokeWidth="9" fill="none" markerEnd="url(#slurryArrow)" />
                  <path id="telemetry-flow" d="M367 178 C416 178 408 262 446 262 H564" stroke="#818cf8" strokeWidth="2" fill="none" strokeDasharray="5 6" opacity=".8" />
                  <path id="telemetry-uplink" d="M554 262 C578 262 581 305 594 305" stroke="#22d3ee" strokeWidth="2" fill="none" strokeDasharray="5 6" opacity=".8" />

                  <g opacity=".95">
                    <circle r="5" fill="#bfdbfe"><animateMotion dur="2.4s" repeatCount="indefinite" path="M92 285 H180" /></circle>
                    <circle r="4" fill="#93c5fd"><animateMotion dur="2.4s" begin="-1.2s" repeatCount="indefinite" path="M92 285 H180" /></circle>
                    <circle r="5" fill="#a7f3d0"><animateMotion dur="3.1s" repeatCount="indefinite" path="M386 117 H485 V95 H556" /></circle>
                    <circle r="4" fill="#6ee7b7"><animateMotion dur="3.1s" begin="-1.55s" repeatCount="indefinite" path="M386 117 H485 V95 H556" /></circle>
                    <circle r="5" fill="#a7f3d0"><animateMotion dur="1.8s" repeatCount="indefinite" path="M632 135 H708" /></circle>
                    <circle r="4" fill="#bfdbfe"><animateMotion dur="3.3s" repeatCount="indefinite" path="M282 326 V360 H440" /></circle>
                    <rect width="8" height="8" rx="2" fill="#a5b4fc"><animateMotion dur="2.6s" repeatCount="indefinite" path="M367 178 C416 178 408 262 446 262 H564" /></rect>
                    <rect width="8" height="8" rx="2" fill="#67e8f9"><animateMotion dur="1.4s" repeatCount="indefinite" path="M554 262 C578 262 581 305 594 305" /></rect>
                  </g>

                  <path d="M16 366 H744" stroke="#334155" strokeWidth="2" />
                  <path d="M16 369 H744" stroke="#0f172a" strokeWidth="11" opacity=".7" />
                  <path d="M16 374 H744" stroke="#64748b" strokeWidth="1" opacity=".4" strokeDasharray="3 8" />

                  <g filter="url(#equipmentShadow)">
                  <rect x="18" y="311" width="82" height="10" rx="2" fill="url(#concrete)" />
                  <rect x="24" y="205" width="70" height="104" rx="5" fill="#1e3a4a" stroke="#60a5fa" strokeWidth="3" />
                  <path d="M34 230 H84 M34 252 H84 M34 274 H84" stroke="#7dd3fc" strokeWidth="3" opacity=".8" />
                  <path d="M30 212 H88" stroke="#bae6fd" strokeWidth="2" opacity=".55" />
                  <circle cx="32" cy="217" r="2" fill="#94a3b8" /><circle cx="86" cy="217" r="2" fill="#94a3b8" />
                  <text x="59" y="330" textAnchor="middle" fill="#dbeafe" fontSize="13" fontWeight="700">INTRANTS</text>
                  <text x="59" y="348" textAnchor="middle" fill="#94a3b8" fontSize="11">fosse F-01</text>

                  <rect x="169" y="327" width="48" height="8" rx="2" fill="url(#concrete)" />
                  <rect x="175" y="242" width="36" height="85" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="3" />
                  <circle cx="193" cy="283" r="15" fill="#172554" stroke="#60a5fa" strokeWidth="2" />
                  <path d="M193 268 V298 M178 283 H208" stroke="#bfdbfe" strokeWidth="3" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 193 283" to="360 193 283" dur="1.2s" repeatCount="indefinite" />
                  </path>
                  <text x="193" y="350" textAnchor="middle" fill="#cbd5e1" fontSize="11">P-01</text>
                  </g>

                  <ellipse cx="308" cy="152" rx="92" ry="57" fill="url(#domeGlow)" opacity=".35">
                    <animate attributeName="opacity" values=".18;.5;.18" dur="2.8s" repeatCount="indefinite" />
                  </ellipse>
                  <g filter="url(#equipmentShadow)">
                  <ellipse cx="308" cy="326" rx="93" ry="12" fill="url(#concrete)" />
                  <path d="M230 290 V162 A78 78 0 0 1 386 162 V290 Z" fill="url(#tankWall)" stroke="#86efac" strokeWidth="4" />
                  <path d="M237 161 A71 71 0 0 1 379 161" fill="none" stroke="url(#steel)" strokeWidth="11" />
                  <path d="M230 162 A78 78 0 0 1 386 162" fill="none" stroke="#34d399" strokeWidth="4" />
                  <path d="M238 254 H378" stroke="#9ae6b4" strokeWidth="2" strokeDasharray="7 6" opacity=".8" />
                  <path d="M244 196 H372 M238 222 H378" stroke="#bbf7d0" strokeWidth="1" opacity=".17" />
                  <rect x="289" y="145" width="38" height="13" rx="3" fill="url(#steel)" stroke="#e2e8f0" strokeWidth="1" />
                  <circle cx="308" cy="151" r="4" fill="#0f172a" stroke="#e2e8f0" strokeWidth="1" />
                  <g transform="translate(308 266)" opacity=".85">
                    <path d="M0 -31 V28 M-30 0 H30" stroke="#d1fae5" strokeWidth="4" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.4s" repeatCount="indefinite" />
                    </path>
                    <circle r="6" fill="#d1fae5" />
                  </g>
                  <path d="M250 290 V322 H366 V290" fill="#1e293b" stroke="#94a3b8" strokeWidth="3" />
                  <path d="M240 185 H250 V272 H240 M366 185 H376 V272 H366" fill="none" stroke="#cbd5e1" strokeWidth="2" opacity=".7" />
                  <path d="M240 196 H250 M240 209 H250 M240 222 H250 M240 235 H250 M240 248 H250 M240 261 H250" stroke="#cbd5e1" strokeWidth="2" opacity=".7" />
                  <text x="308" y="212" textAnchor="middle" fill="white" fontSize="17" fontWeight="700">DIGESTEUR D-01</text>
                  <text x="308" y="233" textAnchor="middle" fill="#bbf7d0" fontSize="12">digestion anaérobie</text>
                  <text x="308" y="310" textAnchor="middle" fill="#cbd5e1" fontSize="11">chauffage + agitation</text>
                  </g>

                  <circle cx="258" cy="176" r="17" fill="#0f172a" stroke="#fb7185" strokeWidth="3" filter="url(#sensorGlow)">
                    <animate attributeName="r" values="15;18;15" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <text x="258" y="180" textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="700">T</text>
                  <text x="220" y="151" fill="#fda4af" fontSize="11">TT-101</text>
                  <circle cx="350" cy="142" r="17" fill="#0f172a" stroke="#7dd3fc" strokeWidth="3" filter="url(#sensorGlow)">
                    <animate attributeName="r" values="15;18;15" dur="2.1s" repeatCount="indefinite" />
                  </circle>
                  <text x="350" y="146" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontWeight="700">P</text>
                  <text x="360" y="125" fill="#7dd3fc" fontSize="11">PT-102</text>

                  <g filter="url(#equipmentShadow)">
                  <ellipse cx="595" cy="211" rx="48" ry="9" fill="url(#concrete)" />
                  <rect x="555" y="65" width="80" height="142" rx="38" fill="url(#steel)" stroke="#fbbf24" strokeWidth="4" />
                  <rect x="563" y="73" width="16" height="126" rx="8" fill="#e2e8f0" opacity=".28" />
                  <path d="M565 128 H625" stroke="#fbbf24" strokeWidth="2" strokeDasharray="5 5" />
                  <path d="M575 85 V188 M595 78 V196 M615 85 V188" stroke="#fbbf24" strokeWidth="2" opacity=".35" />
                  <text x="595" y="116" textAnchor="middle" fill="#fef3c7" fontSize="13" fontWeight="700">G-02</text>
                  <text x="595" y="136" textAnchor="middle" fill="#fde68a" fontSize="11">désulfuration</text>
                  <circle cx="644" cy="115" r="17" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" filter="url(#sensorGlow)">
                    <animate attributeName="r" values="15;18;15" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                  <text x="644" y="119" textAnchor="middle" fill="#fcd34d" fontSize="10" fontWeight="700">S</text>
                  <text x="650" y="98" fill="#fcd34d" fontSize="11">H2S</text>
                  </g>

                  <g filter="url(#equipmentShadow)">
                  <ellipse cx="723" cy="191" rx="21" ry="6" fill="url(#concrete)" />
                  <rect x="708" y="83" width="30" height="104" rx="12" fill="url(#steel)" stroke="#34d399" strokeWidth="3" />
                  <path d="M714 104 H732 M714 122 H732 M714 140 H732 M714 158 H732" stroke="#6ee7b7" strokeWidth="2" />
                  <text x="723" y="211" textAnchor="middle" fill="#d1fae5" fontSize="11">gazomètre</text>
                  </g>

                  <rect x="444" y="336" width="130" height="39" rx="5" fill="#25394a" stroke="#60a5fa" strokeWidth="3" />
                  <text x="509" y="360" textAnchor="middle" fill="#dbeafe" fontSize="12" fontWeight="700">DIGESTAT / ÉPANDAGE</text>

                  <g transform="translate(275 62)">
                    <rect width="95" height="34" rx="5" fill="#0f766e" stroke="#5eead4" strokeWidth="2">
                      <animate attributeName="stroke-opacity" values=".45;1;.45" dur="1.5s" repeatCount="indefinite" />
                    </rect>
                    <text x="47" y="15" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">CH4 ANALYSER</text>
                    <text x="47" y="27" textAnchor="middle" fill="#ccfbf1" fontSize="10">{currentTelemetry.ch4_percent.toFixed(1)} %</text>
                  </g>
                  <path d="M322 96 V119" stroke="#5eead4" strokeWidth="2" strokeDasharray="4 4" />

                  <g transform="translate(414 232)">
                    <rect x="-7" y="-21" width="150" height="111" rx="7" fill="#020617" stroke="#475569" strokeWidth="1" opacity=".92" />
                    <text x="5" y="-7" fill="#cbd5e1" fontSize="10" fontWeight="700" letterSpacing="1">PASSERELLE TERRAIN</text>
                    <text x="5" y="103" fill="#818cf8" fontSize="10">ESP32-01 / Wi-Fi MQTT</text>

                    <rect width="130" height="76" rx="4" fill="#164e45" stroke="#5eead4" strokeWidth="2" />
                    <path d="M23 17 H42 V8 H58 M73 12 H95 V25 H114 M37 65 H58 V51 H77 M99 66 V49 H117" fill="none" stroke="#2dd4bf" strokeWidth="1.5" opacity=".7" />
                    <path d="M11 11 H119 M11 65 H119" stroke="#0f766e" strokeWidth="1" opacity=".8" />

                    <rect x="34" y="8" width="61" height="35" rx="2" fill="#64748b" stroke="#cbd5e1" strokeWidth="1.5" />
                    <rect x="39" y="12" width="51" height="18" fill="#94a3b8" />
                    <path d="M42 35 H87" stroke="#cbd5e1" strokeWidth="2" />
                    <text x="64" y="24" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="700">ESPRESSIF</text>
                    <text x="64" y="39" textAnchor="middle" fill="#e2e8f0" fontSize="7">ESP32-WROOM-32</text>

                    <rect x="51" y="47" width="28" height="16" rx="3" fill="#111827" stroke="#94a3b8" strokeWidth="1.5" />
                    <path d="M57 51 H73 M57 55 H73 M57 59 H73" stroke="#64748b" strokeWidth="1" />
                    <text x="65" y="73" textAnchor="middle" fill="#bbf7d0" fontSize="7">USB</text>

                    <circle cx="20" cy="52" r="6" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
                    <text x="20" y="54" textAnchor="middle" fill="#cbd5e1" fontSize="5" fontWeight="700">EN</text>
                    <circle cx="108" cy="52" r="6" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
                    <text x="108" y="54" textAnchor="middle" fill="#cbd5e1" fontSize="5" fontWeight="700">BOOT</text>
                    <circle cx="28" cy="20" r="3" fill="#34d399"><animate attributeName="opacity" values="1;.2;1" dur="1s" repeatCount="indefinite" /></circle>
                    <text x="28" y="29" textAnchor="middle" fill="#a7f3d0" fontSize="5">PWR</text>

                    <g fill="#fbbf24">
                      <rect x="-4" y="7" width="7" height="5" /><rect x="-4" y="17" width="7" height="5" /><rect x="-4" y="27" width="7" height="5" /><rect x="-4" y="37" width="7" height="5" /><rect x="-4" y="47" width="7" height="5" /><rect x="-4" y="57" width="7" height="5" />
                      <rect x="127" y="7" width="7" height="5" /><rect x="127" y="17" width="7" height="5" /><rect x="127" y="27" width="7" height="5" /><rect x="127" y="37" width="7" height="5" /><rect x="127" y="47" width="7" height="5" /><rect x="127" y="57" width="7" height="5" />
                    </g>
                    <text x="7" y="16" fill="#fef3c7" fontSize="5">3V3</text>
                    <text x="7" y="36" fill="#fef3c7" fontSize="5">GND</text>
                    <text x="7" y="56" fill="#fef3c7" fontSize="5">GPIO</text>
                    <text x="100" y="16" fill="#fef3c7" fontSize="5">VIN</text>
                    <text x="97" y="36" fill="#fef3c7" fontSize="5">RX/TX</text>
                    <text x="99" y="56" fill="#fef3c7" fontSize="5">GPIO</text>
                  </g>
                  <g transform="translate(580 309)">
                    <rect width="145" height="47" rx="6" fill="#083344" stroke="#22d3ee" strokeWidth="2" />
                    <circle cx="17" cy="17" r="5" fill="#22d3ee"><animate attributeName="r" values="3;6;3" dur="1.3s" repeatCount="indefinite" /></circle>
                    <text x="30" y="20" fill="#ecfeff" fontSize="11" fontWeight="700">MQTT / TÉLÉMÉTRIE</text>
                    <text x="12" y="36" fill="#a5f3fc" fontSize="10">paquet reçu · 3 s</text>
                  </g>
                  <g transform="translate(584 244)">
                    <rect width="145" height="52" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                    <text x="12" y="18" fill="#94a3b8" fontSize="10">DÉBIT BIOGAZ</text>
                    <text x="12" y="40" fill="#6ee7b7" fontSize="18" fontWeight="700">{currentTelemetry.flow_rate_m3_h.toFixed(1)} m3/h</text>
                  </g>

                  <text x="26" y="30" fill="#cbd5e1" fontSize="13" fontWeight="700" letterSpacing="1.5">UNITÉ DE MÉTHANISATION CI-01</text>
                  <text x="26" y="49" fill="#94a3b8" fontSize="11">Flux matière, biogaz et télémétrie en direct</text>
                </svg>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {embeddedCards.map((card) => (
                  <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500">{card.label}</div>
                    <div className={`mt-1 text-lg font-bold ${
                      card.accent === "emerald" ? "text-emerald-700" :
                      card.accent === "amber" ? "text-amber-700" :
                      card.accent === "rose" ? "text-rose-700" : "text-sky-700"
                    }`}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Status</div>
                <div className="mt-2 text-lg font-bold text-slate-900">{currentTelemetry.status}</div>
                <div className="mt-2 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500"
                    style={{ width: `${Math.min(100, ((currentTelemetry.ch4_percent - 40) / 35) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Serial console</div>
                <div className="mt-2 space-y-1 font-mono text-[10px] text-slate-600">
                  {serialLog.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Installation virtuelle</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {installationState.map((node) => (
                    <div key={node.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${node.color}`}></span>
                        <span className="font-medium text-slate-700">{node.name}</span>
                      </div>
                      <span className="text-slate-500">{node.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Réseau</div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-700">
                  <span>Wi‑Fi</span>
                  <span className="font-bold text-emerald-700">Linked / 802.11n</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-700">
                  <span>MQTT</span>
                  <span className="font-bold text-emerald-700">Stream OK</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Flame className="w-4 h-4 text-emerald-600" /> Taux de Méthane (CH₄)
                </span>
                <span className="font-mono text-emerald-700 font-bold text-sm">{ch4}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="75"
                step="0.5"
                value={ch4}
                onChange={(e) => setCh4(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>40% (Critique)</span>
                <span className="text-emerald-600 font-semibold">55-70% (Plage Idéale)</span>
                <span>75% (Maximum)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Sulfure d'Hydrogène (H₂S)
                </span>
                <span className="font-mono text-amber-700 font-bold text-sm">{h2s} ppm</span>
              </div>
              <input
                type="range"
                min="50"
                max="600"
                step="10"
                value={h2s}
                onChange={(e) => setH2s(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span className="text-emerald-600">&lt; 200 ppm (Sain)</span>
                <span className="text-amber-600">300-400 ppm (Alerte)</span>
                <span className="text-rose-600">&gt; 500 ppm (Danger corrosion)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Thermometer className="w-4 h-4 text-rose-500" /> Température Digesteur
                </span>
                <span className="font-mono text-slate-900 font-bold text-sm">{temp} °C</span>
              </div>
              <input
                type="range"
                min="25"
                max="60"
                step="0.5"
                value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>30°C (Psychrophile)</span>
                <span className="text-emerald-600 font-semibold">37-40°C (Mésophile)</span>
                <span>50-55°C (Thermophile)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Gauge className="w-3.5 h-3.5 text-teal-600" /> Pression Dôme
                  </span>
                  <span className="font-mono font-bold text-teal-700">{press} mbar</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="0.5"
                  value={press}
                  onChange={(e) => setPress(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Droplets className="w-3.5 h-3.5 text-blue-600" /> pH Milieu Anaérobie
                  </span>
                  <span className="font-mono font-bold text-blue-700">{ph}</span>
                </div>
                <input
                  type="range"
                  min="6.0"
                  max="8.5"
                  step="0.05"
                  value={ph}
                  onChange={(e) => setPh(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {feedbackMsg && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {feedbackMsg}
              </span>
            )}
            <button
              onClick={handleManualSend}
              disabled={isSending}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Envoi en cours..." : "Transmettre Télémétrie"}</span>
            </button>
          </div>
        </div>

        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Historique des 15 Dernières Télémétries</h3>
            <p className="text-xs text-slate-500">Fluctuations de CH4 (%) et débit (m³/h)</p>

            <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> CH₄ (%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span> Débit (m³/h)
                </span>
              </div>

              <div className="h-32 flex items-end gap-1 pt-4 pb-1">
                {telemetryHistory.slice(-15).map((record, idx) => {
                  const ch4Height = Math.max(10, Math.min(100, (record.ch4_percent - 40) * 2.8));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t transition-all hover:brightness-125"
                        style={{ height: `${ch4Height}%` }}
                      ></div>
                      <span className="text-[9px] font-mono text-slate-500 hidden sm:block">
                        {record.ch4_percent.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block">État des Équipements de Mesure :</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600">Sonde NDIR CH₄ :</span>
                <span className="text-emerald-700 font-semibold">Calibré (0.1%)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600">Sonde H₂S EC :</span>
                <span className="text-emerald-700 font-semibold">Opérationnel</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600">Pt100 Thermique :</span>
                <span className="text-emerald-700 font-semibold">±0.2°C Précis</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600">Débitmètre Vortex :</span>
                <span className="text-emerald-700 font-semibold">Actif (48 m³/h)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
