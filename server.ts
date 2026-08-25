import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";

dotenv.config();

// Substrates Knowledge Base (SIREXE 2026 / West Africa context)
export const SUBSTRATES_DB: Record<string, {
  id: string;
  nom: string;
  nomCourt: string;
  matiere_seche_pct: number;
  matiere_organique_pct: number;
  ratio_CN: number;
  bmp: number; // Nm3 CH4 / t MS
  ch4_pct_theorique: number;
  cout_tonne_cfa: number;
  description: string;
  categorie: string;
  icone: string;
}> = {
  fumier_bovin: {
    id: "fumier_bovin",
    nom: "Fumier / Lisier Bovin & Élevage",
    nomCourt: "Lisier Bovin",
    matiere_seche_pct: 12.0,
    matiere_organique_pct: 80.0,
    ratio_CN: 25.0,
    bmp: 210.0,
    ch4_pct_theorique: 60.0,
    cout_tonne_cfa: 2500,
    description: "Inoculum de base riche en bactéries méthanogènes et tampon d'alcalinité.",
    categorie: "Élevage",
    icone: "🐄"
  },
  dechets_manioc: {
    id: "dechets_manioc",
    nom: "Épluchures & Résidus de Manioc (Attiéké/Fécule)",
    nomCourt: "Résidus Manioc",
    matiere_seche_pct: 28.0,
    matiere_organique_pct: 92.0,
    ratio_CN: 45.0,
    bmp: 340.0,
    ch4_pct_theorique: 55.0,
    cout_tonne_cfa: 3000,
    description: "Gisement majeur en Côte d'Ivoire. Très riche en carbone et sucres fermentescibles.",
    categorie: "Agroalimentaire",
    icone: "🥔"
  },
  effluents_huile_palme: {
    id: "effluents_huile_palme",
    nom: "POME (Effluents d'Huileries de Palme)",
    nomCourt: "Effluents POME",
    matiere_seche_pct: 8.0,
    matiere_organique_pct: 85.0,
    ratio_CN: 18.0,
    bmp: 420.0,
    ch4_pct_theorique: 65.0,
    cout_tonne_cfa: 1500,
    description: "Charge organique très dense et lipides à très haut potentiel méthanogène.",
    categorie: "Agro-Industrie",
    icone: "🌴"
  },
  dechets_marche_menagers: {
    id: "dechets_marche_menagers",
    nom: "Déchets Organiques de Marchés Municipaux (FFOM)",
    nomCourt: "Déchets Marchés",
    matiere_seche_pct: 18.0,
    matiere_organique_pct: 88.0,
    ratio_CN: 16.0,
    bmp: 380.0,
    ch4_pct_theorique: 58.0,
    cout_tonne_cfa: 4000,
    description: "Déchets maraîchers urbains d'Abidjan et Bouaké, forte humidité et fermentation rapide.",
    categorie: "Urbain",
    icone: "🥗"
  },
  fientes_volailles: {
    id: "fientes_volailles",
    nom: "Fientes Avicoles (Élevages avicoles)",
    nomCourt: "Fientes Avicoles",
    matiere_seche_pct: 30.0,
    matiere_organique_pct: 75.0,
    ratio_CN: 8.5,
    bmp: 280.0,
    ch4_pct_theorique: 60.0,
    cout_tonne_cfa: 5000,
    description: "Apport massif d'azote. À doser avec modération pour éviter l'inhibition ammoniacale.",
    categorie: "Élevage",
    icone: "🐔"
  },
  residus_cacao: {
    id: "residus_cacao",
    nom: "Cabosses & Résidus de Cacao",
    nomCourt: "Cabosses Cacao",
    matiere_seche_pct: 22.0,
    matiere_organique_pct: 84.0,
    ratio_CN: 32.0,
    bmp: 260.0,
    ch4_pct_theorique: 54.0,
    cout_tonne_cfa: 2000,
    description: "Biomasse ligneuse abondante dans la boucle du cacao, structure fibreuse stabilisatrice.",
    categorie: "Agro-Industrie",
    icone: "🍫"
  }
};

// In-Memory Storage for Demo & Simulation
interface TelemetryRecord {
  timestamp: number;
  ch4_percent: number;
  h2s_ppm: number;
  temperature_celsius: number;
  pressure_mbar: number;
  ph: number;
  flow_rate_m3_h: number;
  vfa_tic_ratio: number;
  status: "NORMAL" | "WARNING" | "ALERTE" | "CRITIQUE";
  alerts: string[];
}

interface BlockchainBatch {
  batch_id: string;
  timestamp: number;
  block_number: number;
  operator_id: string;
  total_waste_tonnes: number;
  substrates: string[];
  biogas_produced_m3: number;
  ch4_avg_percent: number;
  carbon_credits_tco2e: number;
  tx_hash: string;
  is_verified: boolean;
  status: "CONFIRMED" | "PENDING";
}

let currentTelemetry: TelemetryRecord = {
  timestamp: Date.now(),
  ch4_percent: 63.5,
  h2s_ppm: 135.0,
  temperature_celsius: 38.3,
  pressure_mbar: 19.1,
  ph: 7.32,
  flow_rate_m3_h: 49.2,
  vfa_tic_ratio: 0.22,
  status: "NORMAL",
  alerts: []
};

const telemetryHistory: TelemetryRecord[] = [];

// Seed initial history
const now = Date.now();
for (let i = 20; i >= 0; i--) {
  const t = now - i * 60 * 1000;
  const ch4 = 62.0 + Math.sin(i * 0.4) * 2.2 + (Math.random() - 0.5) * 0.8;
  const h2s = 130 + Math.cos(i * 0.3) * 25 + (Math.random() - 0.5) * 10;
  const temp = 38.0 + (Math.random() - 0.5) * 0.4;
  const press = 18.5 + (Math.random() - 0.5) * 1.5;
  const flow = 48.0 + (ch4 - 55) * 1.2;
  telemetryHistory.push({
    timestamp: t,
    ch4_percent: Number(ch4.toFixed(2)),
    h2s_ppm: Number(h2s.toFixed(1)),
    temperature_celsius: Number(temp.toFixed(2)),
    pressure_mbar: Number(press.toFixed(2)),
    ph: Number((7.3 + (Math.random() - 0.5) * 0.1).toFixed(2)),
    flow_rate_m3_h: Number(flow.toFixed(1)),
    vfa_tic_ratio: Number((0.21 + (Math.random() - 0.5) * 0.03).toFixed(3)),
    status: "NORMAL",
    alerts: []
  });
}

const blockchainLedger: BlockchainBatch[] = [
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
    status: "CONFIRMED"
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
    status: "CONFIRMED"
  }
];

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Biochemical Optimization Function
export function optimizeRecipe(inputs: { substrate_type: string; tonnage: number }[]) {
  const totalTonnage = inputs.reduce((sum, item) => sum + (Number(item.tonnage) || 0), 0);
  if (totalTonnage <= 0) {
    throw new Error("Le tonnage total doit être supérieur à 0.");
  }

  let totalMsTonnes = 0;
  let totalMvTonnes = 0;
  let weightedCnNumerator = 0;
  let totalBmpMethaneM3 = 0;
  let weightedCh4Pct = 0;
  let estimatedCostCfa = 0;

  const breakdown = [];

  for (const item of inputs) {
    const sub = SUBSTRATES_DB[item.substrate_type];
    if (!sub || item.tonnage <= 0) continue;

    const msItem = item.tonnage * (sub.matiere_seche_pct / 100.0);
    const mvItem = msItem * (sub.matiere_organique_pct / 100.0);

    totalMsTonnes += msItem;
    totalMvTonnes += mvItem;

    weightedCnNumerator += sub.ratio_CN * mvItem;

    const ch4PotentialItem = msItem * sub.bmp;
    totalBmpMethaneM3 += ch4PotentialItem;

    weightedCh4Pct += sub.ch4_pct_theorique * ch4PotentialItem;
    estimatedCostCfa += item.tonnage * sub.cout_tonne_cfa;

    breakdown.push({
      type: item.substrate_type,
      nom: sub.nom,
      nomCourt: sub.nomCourt,
      icone: sub.icone,
      categorie: sub.categorie,
      tonnage: item.tonnage,
      pct_du_total: Number(((item.tonnage / totalTonnage) * 100).toFixed(1)),
      matiere_seche_t: Number(msItem.toFixed(2)),
      bmp_ch4_m3: Number(ch4PotentialItem.toFixed(1)),
      ratio_CN_unitaire: sub.ratio_CN
    });
  }

  const overallCnRatio = totalMvTonnes > 0 ? weightedCnNumerator / totalMvTonnes : 25.0;
  const avgCh4Percent = totalBmpMethaneM3 > 0 ? weightedCh4Pct / totalBmpMethaneM3 : 60.0;
  const totalBiogasM3 = avgCh4Percent > 0 ? totalBmpMethaneM3 / (avgCh4Percent / 100.0) : 0;
  
  // 1 m3 CH4 = 9.97 kWh = 0.00997 MWh
  const energyMwh = (totalBmpMethaneM3 * 9.97) / 1000.0;
  // MRV avoidance: ~2.15 kg CO2e / m3 CH4 valorisé
  const carbonCreditsTco2e = totalBmpMethaneM3 * 0.00215;

  let status: "OPTIMAL" | "RISQUE_AMMONIAQUE" | "RISQUE_CARBONE_EXCES" | "DESEQUILIBRE" = "OPTIMAL";
  let alertLevel: "GREEN" | "WARNING" | "CRITICAL" = "GREEN";
  const recommendations: string[] = [];

  if (overallCnRatio < 18.0) {
    status = "RISQUE_AMMONIAQUE";
    alertLevel = "WARNING";
    recommendations.push("Ratio C/N trop faible (< 18). Risque d'accumulation d'azote ammoniacal (NH4+/NH3) toxique pour les archées méthanogènes.");
    recommendations.push("💡 Action recommandée : Augmenter l'apport en résidus de manioc ou cabosses de cacao (+15 à 20%) pour équilibrer en carbone.");
  } else if (overallCnRatio > 35.0) {
    status = "RISQUE_CARBONE_EXCES";
    alertLevel = "WARNING";
    recommendations.push("Ratio C/N trop élevé (> 35). Carence en azote limitant la multiplication cellulaire de la flore bactérienne.");
    recommendations.push("💡 Action recommandée : Ajouter des fientes avicoles ou du lisier bovin riche en azote.");
  } else {
    status = "OPTIMAL";
    alertLevel = "GREEN";
    recommendations.push("Plage optimale C/N atteinte (20:1 - 30:1). Cinétique de méthanisation et production de biogaz maximales.");
    recommendations.push("✨ Synergie de co-digestion excellente : stabilité biologique garantie et pH naturellement tamponné.");
  }

  return {
    total_tonnage: Number(totalTonnage.toFixed(2)),
    total_ms_tonnes: Number(totalMsTonnes.toFixed(2)),
    total_mv_tonnes: Number(totalMvTonnes.toFixed(2)),
    overall_cn_ratio: Number(overallCnRatio.toFixed(1)),
    estimated_ch4_m3: Number(totalBmpMethaneM3.toFixed(1)),
    estimated_biogas_m3: Number(totalBiogasM3.toFixed(1)),
    avg_ch4_percent: Number(avgCh4Percent.toFixed(1)),
    energy_mwh: Number(energyMwh.toFixed(2)),
    carbon_credits_tco2e: Number(carbonCreditsTco2e.toFixed(3)),
    estimated_cost_cfa: Math.round(estimatedCostCfa),
    status,
    alert_level: alertLevel,
    recommendations,
    breakdown
  };
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT ?? 3000);
  // Loopback is the safest default for a local dashboard. Set HOST=0.0.0.0
  // only when the application must be reachable from another machine.
  const host = process.env.HOST ?? "127.0.0.1";

  app.use(express.json());

  // -------------------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------------------
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      project: "BioGaz+ / SmartDigest",
      event: "SIREXE Hackathon 2026",
      uptime: process.uptime()
    });
  });

  // Substrates definition
  app.get("/api/substrates", (req, res) => {
    res.json(SUBSTRATES_DB);
  });

  // Latest Telemetry & History
  app.get("/api/iot/latest", (req, res) => {
    res.json({
      data: currentTelemetry,
      historyCount: telemetryHistory.length
    });
  });

  app.get("/api/iot/history", (req, res) => {
    const limit = Number(req.query.limit) || 30;
    res.json(telemetryHistory.slice(-limit));
  });

  // Ingest or update telemetry
  app.post("/api/iot/telemetry", (req, res) => {
    const {
      ch4_percent = 63.0,
      h2s_ppm = 140.0,
      temperature_celsius = 38.2,
      pressure_mbar = 18.5,
      ph = 7.3,
      flow_rate_m3_h = 48.0,
      vfa_tic_ratio = 0.22
    } = req.body;

    const alerts: string[] = [];
    let status: "NORMAL" | "WARNING" | "ALERTE" | "CRITIQUE" = "NORMAL";

    if (ch4_percent < 50.0) {
      alerts.push("Taux de CH4 bas (<50%). Risque d'acidification ou lavage de biomasse.");
      status = "ALERTE";
    }
    if (h2s_ppm > 350.0) {
      alerts.push("Concentration H2S critique (>350 ppm). Risque de corrosion des génératrices.");
      status = "WARNING";
    }
    if (temperature_celsius < 35.0 || temperature_celsius > 43.0) {
      alerts.push(`Température anormale (${temperature_celsius}°C) hors plage mésophile (37-40°C).`);
      status = "ALERTE";
    }
    if (pressure_mbar > 27.0) {
      alerts.push("Surpression dans le dôme (>27 mbar). Évacuation de sécurité requise.");
      status = "CRITIQUE";
    }
    if (ph < 6.8) {
      alerts.push(`Acidose détectée (pH=${ph}). Arrêter les intrants acides et tamponner.`);
      status = "CRITIQUE";
    }

    currentTelemetry = {
      timestamp: Date.now(),
      ch4_percent: Number(Number(ch4_percent).toFixed(2)),
      h2s_ppm: Number(Number(h2s_ppm).toFixed(1)),
      temperature_celsius: Number(Number(temperature_celsius).toFixed(2)),
      pressure_mbar: Number(Number(pressure_mbar).toFixed(2)),
      ph: Number(Number(ph).toFixed(2)),
      flow_rate_m3_h: Number(Number(flow_rate_m3_h).toFixed(1)),
      vfa_tic_ratio: Number(Number(vfa_tic_ratio).toFixed(3)),
      status,
      alerts
    };

    telemetryHistory.push(currentTelemetry);
    if (telemetryHistory.length > 500) {
      telemetryHistory.shift();
    }

    res.json({
      success: true,
      data: currentTelemetry
    });
  });

  // AI Recipe Optimization
  app.post("/api/ai/optimize", (req, res) => {
    try {
      const inputs = req.body.available_inputs || [];
      const results = optimizeRecipe(inputs);
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Blockchain Ledger
  app.get("/api/blockchain/batches", (req, res) => {
    const totalCredits = blockchainLedger.reduce((acc, b) => acc + (b.carbon_credits_tco2e || 0), 0);
    const totalBiogas = blockchainLedger.reduce((acc, b) => acc + (b.biogas_produced_m3 || 0), 0);
    res.json({
      contract_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      contract_name: "TraceBiogaz.sol",
      standard: "MRV Gold Standard / UNFCCC ACM0022",
      total_batches: blockchainLedger.length,
      total_biogas_m3: totalBiogas,
      total_carbon_credits_tco2e: totalCredits,
      batches: blockchainLedger
    });
  });

  // Record batch on blockchain simulator
  app.post("/api/blockchain/record", (req, res) => {
    const {
      operator_id = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      total_waste_tonnes = 40.0,
      substrates = ["Lisier", "Manioc", "POME"],
      biogas_produced_m3 = 2800.0,
      ch4_avg_percent = 62.5,
      carbon_credits_tco2e = 6.02
    } = req.body;

    const batch_id = `BATCH-${Date.now()}`;
    const payload = `${batch_id}-${Date.now()}-${operator_id}-${total_waste_tonnes}-${biogas_produced_m3}-${carbon_credits_tco2e}`;
    const tx_hash = "0x" + crypto.createHash("sha256").update(payload).digest("hex");
    const block_number = 1042000 + blockchainLedger.length + 1;

    const newBatch: BlockchainBatch = {
      batch_id,
      timestamp: Math.floor(Date.now() / 1000),
      block_number,
      operator_id,
      total_waste_tonnes,
      substrates,
      biogas_produced_m3,
      ch4_avg_percent,
      carbon_credits_tco2e,
      tx_hash,
      is_verified: true,
      status: "CONFIRMED"
    };

    blockchainLedger.unshift(newBatch);

    res.json({
      success: true,
      message: "Lot immuablement certifié sur TraceBiogaz.sol",
      batch: newBatch
    });
  });

  // Gemini AI Analysis for Bioreactor & SIREXE Pitch Copilot
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { telemetry, recipe, question, type } = req.body;
      const ai = getGemini();

      let prompt = "";
      if (type === "pitch") {
        prompt = `Tu es l'architecte en chef et porte-parole de l'équipe 'BioGaz+ / SmartDigest' au hackathon SIREXE 2026 devant le jury du Ministère des Mines, du Pétrole et de l'Énergie de Côte d'Ivoire.
Formule un pitch percutant de 3 minutes structuré en 4 parties :
1. Le problème critique en Côte d'Ivoire (gisement de déchets inexploité, coupures énergétiques, décharges sauvages).
2. Notre solution en 3 couches (IoT temps réel + Moteur IA C/N sur mesure Manioc/Palme/Cacao + Blockchain TraceBiogaz pour crédits carbone).
3. Impact chiffré (m3 de biométhane, MWh réinjectés, tonnes CO2 évitées).
4. Pourquoi nous devons remporter le Prix Thématique du Ministère.
Ton de champion de hackathon, précis, axé business, impact national et excellence technique.`;
      } else if (type === "diagnose") {
        prompt = `En tant qu'expert biochimiste et ingénieur méthanisation de classe mondiale pour BioGaz+ :
Analyse les paramètres actuels du digesteur :
- Taux de Méthane (CH4) : ${telemetry?.ch4_percent}%
- Sulfure d'hydrogène (H2S) : ${telemetry?.h2s_ppm} ppm
- Température : ${telemetry?.temperature_celsius} °C
- Pression dôme : ${telemetry?.pressure_mbar} mbar
- pH du milieu : ${telemetry?.ph}
- Débit : ${telemetry?.flow_rate_m3_h} m3/h
- Ratio C/N actuel : ${recipe?.overall_cn_ratio || 24.5}

Donne un diagnostic en 3 points concis :
1. État de santé microbiologique (hydrolyse, acidogenèse, méthanogenèse).
2. Risques immédiats ou anomalies potentielles.
3. 2 actions opérationnelles précises à appliquer par l'exploitant dans l'heure qui suit.`;
      } else {
        prompt = `Tu es l'assistant IA de la plateforme BioGaz+ / SmartDigest (SIREXE 2026).
Réponds à la question suivante de l'opérateur ou du jury : "${question}"
Prends en compte les intrants locaux ivoiriens (Manioc, Huile de Palme/POME, Cacao, Lisier bovin, FFOM). Reste concis, pragmatique et expert.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      res.json({
        success: true,
        text: response.text
      });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Erreur lors de l'analyse Gemini",
        fallback: "Le système BioGaz+ garantit une valorisation optimale des gisements agro-industriels ivoiriens grâce à une régulation intelligente du C/N (20-30:1) et une certification infalsifiable des crédits carbone sur la blockchain."
      });
    }
  });

  // Vite middleware for development & static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(port, host, () => {
    console.log(`[BioGaz+ / SmartDigest] Server running on http://${host}:${port}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Stop the existing server or run with PORT=3001.`);
    } else {
      console.error("Unable to start the BioGaz+ server:", error);
    }
    process.exitCode = 1;
  });
}

startServer();
