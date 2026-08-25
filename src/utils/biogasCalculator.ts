import { SubstrateInfo, OptimizationResult, SubstrateBreakdownItem } from "../types";

export const SUBSTRATES_DB: Record<string, SubstrateInfo> = {
  fumier_bovin: {
    id: "fumier_bovin",
    nom: "Fumier / Lisier Bovin & Élevage",
    nomCourt: "Lisier Bovin",
    matiere_seche_pct: 12.0,
    matiere_organique_pct: 80.0,
    ratio_CN: 25.0,
    bmp: 210.0, // Nm3 CH4 / t MS
    ch4_pct_theorique: 60.0,
    cout_tonne_cfa: 2500,
    description: "Inoculum de base riche en bactéries méthanogènes et tampon d'alcalinité.",
    categorie: "Élevage",
    icone: "🐄",
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
    icone: "🥔",
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
    icone: "🌴",
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
    icone: "🥗",
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
    icone: "🐔",
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
    icone: "🍫",
  },
};

export function optimizeRecipe(
  inputs: { substrate_type: string; tonnage: number }[]
): OptimizationResult {
  let totalTonnage = 0;
  let totalMsTonnes = 0;
  let totalMvTonnes = 0;
  let weightedCNNumerator = 0;
  let totalCH4M3 = 0;
  let weightedCh4PercentNumerator = 0;
  let totalCostCfa = 0;

  const rawBreakdown: SubstrateBreakdownItem[] = [];

  for (const item of inputs) {
    const sub = SUBSTRATES_DB[item.substrate_type];
    if (!sub || item.tonnage <= 0) continue;

    totalTonnage += item.tonnage;
    const ms = item.tonnage * (sub.matiere_seche_pct / 100.0);
    const mv = ms * (sub.matiere_organique_pct / 100.0);
    const ch4 = mv * sub.bmp;
    const cost = item.tonnage * sub.cout_tonne_cfa;

    totalMsTonnes += ms;
    totalMvTonnes += mv;
    totalCH4M3 += ch4;
    weightedCNNumerator += item.tonnage * sub.ratio_CN;
    weightedCh4PercentNumerator += ch4 * sub.ch4_pct_theorique;
    totalCostCfa += cost;

    rawBreakdown.push({
      type: item.substrate_type,
      nom: sub.nom,
      nomCourt: sub.nomCourt,
      icone: sub.icone,
      categorie: sub.categorie,
      tonnage: item.tonnage,
      pct_du_total: 0,
      matiere_seche_t: Number(ms.toFixed(2)),
      bmp_ch4_m3: Math.round(ch4),
      ratio_CN_unitaire: sub.ratio_CN,
    });
  }

  const overallCN = totalTonnage > 0 ? Number((weightedCNNumerator / totalTonnage).toFixed(1)) : 25.0;
  const avgCh4Percent = totalCH4M3 > 0 ? Number((weightedCh4PercentNumerator / totalCH4M3).toFixed(1)) : 60.0;

  // Calcul du volume total de biogaz
  const estimatedBiogasM3 = avgCh4Percent > 0 ? Math.round(totalCH4M3 / (avgCh4Percent / 100.0)) : 0;

  // Pouvoir Calorifique Inférieur (PCI) du méthane : ~9.97 kWh/m³ CH4
  const energyKwh = totalCH4M3 * 9.97;
  const energyMwh = Number((energyKwh / 1000.0).toFixed(2));

  // Crédits Carbone évités (Méthodologie UNFCCC ACM0022)
  const carbonCredits = Number(((totalCH4M3 * 0.717 * 28) / 1000.0).toFixed(3));

  // Statut & Recommandations
  let status: OptimizationResult["status"] = "OPTIMAL";
  let alertLevel: OptimizationResult["alert_level"] = "GREEN";
  const recommendations: string[] = [];

  if (overallCN < 18) {
    status = "RISQUE_AMMONIAQUE";
    alertLevel = "WARNING";
    recommendations.push(
      "⚠️ Ratio C/N trop bas (< 18). Risque d'inhibition par accumulation d'ammoniac libre (NH3). Réduire les fientes avicoles ou ajouter des déchets riches en carbone (épluchures de manioc, cabosses de cacao)."
    );
  } else if (overallCN > 32) {
    status = "RISQUE_CARBONE_EXCES";
    alertLevel = "WARNING";
    recommendations.push(
      "⚠️ Ratio C/N trop haut (> 32). Carence en azote limitant la multiplication bactérienne. Risque d'acidification (baisse du pH). Ajouter du lisier bovin ou des fientes."
    );
  } else {
    status = "OPTIMAL";
    alertLevel = "GREEN";
    recommendations.push(
      "🌟 Ratio C/N optimal (20-30:1). Digestion anaérobie équilibrée, cinétique méthanogène maximale et synergie biologique activée (+12% de rendement)."
    );
  }

  // Calcul des pourcentages de répartition
  const breakdown: SubstrateBreakdownItem[] = rawBreakdown.map((item) => ({
    ...item,
    pct_du_total: totalTonnage > 0 ? Number(((item.tonnage / totalTonnage) * 100).toFixed(1)) : 0,
  }));

  return {
    total_tonnage: Number(totalTonnage.toFixed(1)),
    total_ms_tonnes: Number(totalMsTonnes.toFixed(2)),
    total_mv_tonnes: Number(totalMvTonnes.toFixed(2)),
    overall_cn_ratio: overallCN,
    estimated_ch4_m3: Math.round(totalCH4M3),
    estimated_biogas_m3: estimatedBiogasM3,
    avg_ch4_percent: avgCh4Percent,
    energy_mwh: energyMwh,
    carbon_credits_tco2e: carbonCredits,
    estimated_cost_cfa: Math.round(totalCostCfa),
    status,
    alert_level: alertLevel,
    recommendations,
    breakdown,
  };
}
