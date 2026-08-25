export interface SubstrateInfo {
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
}

export interface TelemetryData {
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

export interface SubstrateBreakdownItem {
  type: string;
  nom: string;
  nomCourt: string;
  icone: string;
  categorie: string;
  tonnage: number;
  pct_du_total: number;
  matiere_seche_t: number;
  bmp_ch4_m3: number;
  ratio_CN_unitaire: number;
}

export interface OptimizationResult {
  total_tonnage: number;
  total_ms_tonnes: number;
  total_mv_tonnes: number;
  overall_cn_ratio: number;
  estimated_ch4_m3: number;
  estimated_biogas_m3: number;
  avg_ch4_percent: number;
  energy_mwh: number;
  carbon_credits_tco2e: number;
  estimated_cost_cfa: number;
  status: "OPTIMAL" | "RISQUE_AMMONIAQUE" | "RISQUE_CARBONE_EXCES" | "DESEQUILIBRE";
  alert_level: "GREEN" | "WARNING" | "CRITICAL";
  recommendations: string[];
  breakdown: SubstrateBreakdownItem[];
}

export interface BlockchainBatch {
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

export interface HackathonCodeFile {
  filename: string;
  language: "python" | "solidity" | "bash" | "markdown" | "json";
  title: string;
  description: string;
  code: string;
  path: string;
}
