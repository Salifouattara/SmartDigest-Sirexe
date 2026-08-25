import React, { useState, useEffect } from "react";
import { TelemetryData } from "../types";
import { Flame, Droplets, Thermometer, Gauge, Activity, AlertTriangle, Play, Pause, RefreshCw, Send, CheckCircle2, ShieldAlert } from "lucide-react";

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

  // Sync state when external telemetry changes
  useEffect(() => {
    setCh4(currentTelemetry.ch4_percent);
    setH2s(currentTelemetry.h2s_ppm);
    setTemp(currentTelemetry.temperature_celsius);
    setPress(currentTelemetry.pressure_mbar);
    setPh(currentTelemetry.ph);
    setFlow(currentTelemetry.flow_rate_m3_h);
  }, [currentTelemetry]);

  // Automated realistic IoT fluctuation loop
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
        flow_rate_m3_h: Number(flow)
      });
      setFeedbackMsg("Paquet de télémétrie IoT transmis avec succès !");
      setTimeout(() => setFeedbackMsg(""), 4000);
    } catch {
      setFeedbackMsg("Erreur lors de la transmission IoT.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <h2 className="text-lg font-bold text-slate-900">Couche 1 : Réception & Simulation IoT Temps Réel</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Surveillance continue des capteurs physiques (Optique NDIR, Électrochimique, Pt100, Transducteur piézo)
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

      {/* Safety Alerts banner if any */}
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

      {/* Sensor Tuning Dashboard & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Hardware Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Panneau de Contrôle des Capteurs (Injection Manuelle)
            </h3>
            <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              POST /api/iot/telemetry
            </span>
          </div>

          <div className="space-y-4">
            {/* Slider CH4 */}
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

            {/* Slider H2S */}
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

            {/* Slider Température */}
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

            {/* Slider Pression & pH */}
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

        {/* Right Column: Historical Graph & Sensor Health (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Historique des 15 Dernières Télémétries</h3>
            <p className="text-xs text-slate-500">Fluctuations de CH4 (%) et débit (m³/h)</p>

            {/* Custom SVG sparkline graph */}
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

          {/* Sensor Diagnostics Status Table */}
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
