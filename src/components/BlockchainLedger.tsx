import React, { useState } from "react";
import { BlockchainBatch } from "../types";
import { ShieldCheck, Blocks, CheckCircle2, Lock, ExternalLink, Sparkles, FileText, Download, Award } from "lucide-react";
import confetti from "canvas-confetti";

interface BlockchainLedgerProps {
  batches: BlockchainBatch[];
  onMintBatch: () => Promise<void>;
}

export const BlockchainLedger: React.FC<BlockchainLedgerProps> = ({
  batches,
  onMintBatch,
}) => {
  const [isMinting, setIsMinting] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BlockchainBatch | null>(batches[0] || null);

  const handleMint = async () => {
    setIsMinting(true);
    try {
      await onMintBatch();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } finally {
      setIsMinting(false);
    }
  };

  const totalCarbonCredits = batches.reduce((acc, b) => acc + (b.carbon_credits_tco2e || 0), 0);
  const totalBiogas = batches.reduce((acc, b) => acc + (b.biogas_produced_m3 || 0), 0);
  const totalWaste = batches.reduce((acc, b) => acc + (b.total_waste_tonnes || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Couche 3 : Registre Immuable & Smart Contract (TraceBiogaz.sol)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Certification MRV décentralisée, horodatage cryptographique SHA-256 et monétisation des crédits carbone
          </p>
        </div>

        <button
          id="btn-mint-new-batch"
          onClick={handleMint}
          disabled={isMinting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-bold text-xs shadow-md hover:from-indigo-700 hover:to-emerald-700 transition-all cursor-pointer disabled:opacity-50"
        >
          <Blocks className="w-4 h-4" />
          <span>{isMinting ? "Minage du Bloc..." : "Enregistrer Nouveau Lot (On-Chain)"}</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Total Lots Traités & Certifiés</span>
          <div className="text-3xl font-extrabold text-slate-900">{batches.length}</div>
          <span className="text-[11px] text-indigo-600 font-medium mt-1 block">
            ● Smart Contract Déployé (EVM)
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Biogaz Sécurisé (CH₄)</span>
          <div className="text-3xl font-extrabold text-emerald-700">{totalBiogas.toLocaleString()} m³</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Issu de {totalWaste.toFixed(1)} tonnes de déchets
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Crédits Carbone Émis</span>
          <div className="text-3xl font-extrabold text-amber-700">{totalCarbonCredits.toFixed(3)} tCO₂e</div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            ● Norme Gold Standard / ACM0022
          </span>
        </div>
      </div>

      {/* Ledger Table & Batch Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ledger Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Blocks className="w-4 h-4 text-indigo-600" />
              Grand Livre Décentralisé (Blocs Récents)
            </h3>
            <span className="text-xs font-mono text-slate-500">Contrat: 0x742d...f44e</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-2">
                  <th className="pb-2 font-semibold">Lot & Bloc</th>
                  <th className="pb-2 font-semibold">Déchets</th>
                  <th className="pb-2 font-semibold">Biogaz (m³)</th>
                  <th className="pb-2 font-semibold">Crédits (tCO₂e)</th>
                  <th className="pb-2 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((batch) => (
                  <tr
                    key={batch.batch_id}
                    onClick={() => setSelectedBatch(batch)}
                    className={`cursor-pointer transition-all hover:bg-slate-50 ${
                      selectedBatch?.batch_id === batch.batch_id ? "bg-indigo-50/70" : ""
                    }`}
                  >
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{batch.batch_id}</div>
                      <div className="font-mono text-[10px] text-slate-400">Bloc #{batch.block_number}</div>
                    </td>
                    <td className="py-3 text-slate-700">
                      <div>{batch.total_waste_tonnes} t</div>
                      <div className="text-[10px] text-slate-400">{batch.substrates.join(", ")}</div>
                    </td>
                    <td className="py-3 font-semibold text-emerald-700">
                      {batch.biogas_produced_m3.toLocaleString()} m³
                    </td>
                    <td className="py-3 font-bold text-amber-700">
                      {batch.carbon_credits_tco2e.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Certifié
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Certificate Explorer & Proof of Methane (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Certificat Vert & Preuve Cryptographique
            </h3>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              MRV Validé
            </span>
          </div>

          {selectedBatch ? (
            <div className="space-y-4">
              {/* Visual Green Certificate Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                  <span className="text-xs text-emerald-300 font-semibold tracking-wider uppercase">
                    Certificat de Crédit Carbone #SIREXE-{selectedBatch.block_number}
                  </span>
                  <span className="text-xs font-mono text-amber-400">GOLD STANDARD</span>
                </div>

                <div>
                  <span className="text-[11px] text-emerald-200">Volume de CO₂ Évité :</span>
                  <div className="text-2xl font-black text-white">
                    {selectedBatch.carbon_credits_tco2e.toFixed(3)} Tonnes CO₂e
                  </div>
                  <p className="text-[10px] text-emerald-300/80">
                    Captage & Valorisation de {selectedBatch.biogas_produced_m3} m³ de biométhane à {selectedBatch.ch4_avg_percent}% CH₄
                  </p>
                </div>

                <div className="pt-2 border-t border-emerald-500/20 text-[10px] font-mono text-emerald-200/90 break-all">
                  <span className="text-slate-400 block mb-0.5">Hash de Transaction Blockchain :</span>
                  {selectedBatch.tx_hash}
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-slate-50">
                  <span className="text-slate-500">Identifiant du Lot :</span>
                  <span className="font-bold text-slate-800">{selectedBatch.batch_id}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-50">
                  <span className="text-slate-500">Opérateur Exploitant :</span>
                  <span className="font-mono text-slate-700">{selectedBatch.operator_id.slice(0, 10)}...{selectedBatch.operator_id.slice(-6)}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-50">
                  <span className="text-slate-500">Audit Tiers Indépendant :</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Conforme UNFCCC ACM0022
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Sélectionnez un lot dans le grand livre pour inspecter son certificat.</p>
          )}
        </div>
      </div>
    </div>
  );
};
