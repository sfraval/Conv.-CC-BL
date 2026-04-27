// Génération PDF style LA HUNE — Cabinet d'expertise maritime indépendant
// Utilise jsPDF + jsPDF-autotable

import { jsPDF } from "jspdf";
import "jspdf-autotable";

const NAVY = [28, 46, 92];
const CORAL = [232, 91, 58];
const SAND = [250, 247, 242];
const INK = [15, 27, 51];
const GRAY = [110, 117, 130];

function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
const fmtEur = (n) => fmt(n) + " €";

function header(doc, title) {
  // Bandeau navy
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 32, "F");
  // Trait coral
  doc.setFillColor(...CORAL);
  doc.rect(0, 32, 210, 1.5, "F");

  // LA HUNE.
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("LA HUNE.", 15, 17);

  // Sous-titre
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("Cabinet d'expertise maritime indépendant", 15, 23);
  doc.text("Landéda, Finistère", 15, 27);

  // Titre du rapport (à droite)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, 210 - 15 - titleWidth, 17);

  // Date
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const dateWidth = doc.getTextWidth(dateStr);
  doc.text(dateStr, 210 - 15 - dateWidth, 27);
}

function footer(doc, page, total) {
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(
    "LA HUNE — Cabinet d'expertise maritime indépendant · Landéda, Finistère",
    15,
    288
  );
  doc.text(`${page} / ${total}`, 210 - 15, 288, { align: "right" });
  doc.setDrawColor(...CORAL);
  doc.setLineWidth(0.3);
  doc.line(15, 283, 195, 283);
}

function sectionTitle(doc, y, text) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(text.toUpperCase(), 15, y);
  doc.setDrawColor(...CORAL);
  doc.setLineWidth(0.5);
  doc.line(15, y + 1.5, 60, y + 1.5);
  return y + 8;
}

function metaBlock(doc, y, meta) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  for (const [k, v] of meta) {
    doc.setFont("helvetica", "bold");
    doc.text(k + " :", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), 60, y);
    y += 5;
  }
  return y + 3;
}

function resultBox(doc, y, label, value) {
  doc.setFillColor(...NAVY);
  doc.roundedRect(15, y, 180, 16, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(label.toUpperCase(), 20, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...CORAL);
  doc.text(value, 195, y + 11, { align: "right" });
  return y + 22;
}

// ─── Boulogne PDF ───
export function pdfBoulogne(d, calc, title = "Calcul d'indemnité — Convention de Boulogne") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Convention de Boulogne");
  let y = 45;

  y = sectionTitle(doc, y, "Référence du dossier");
  y = metaBlock(doc, y, [
    ["Dossier", d.title || "—"],
    ["Convention", "Boulogne (puissance > 700 CV)"],
    ["Coefficient Kb", d.kb],
  ]);

  y = sectionTitle(doc, y, "Données factuelles");
  doc.autoTable({
    startY: y,
    head: [["Paramètre", "Valeur", "Source"]],
    body: [
      ["W — Puissance assistant", `${d.W} CV`, "Conditions particulières police Corps"],
      ["V — Ventes de référence", fmtEur(d.V), "Bulletins de criée — 3 marées encadrantes"],
      ["H — Heures sur lieux de pêche", `${d.H} h`, "Carnet de pêche"],
      ["A — Heures d'interruption", `${d.A} h`, "Rapports de mer"],
      ["R — Trajet direct théorique", `${d.R} h`, "Calcul cartographique"],
      ["p — Rapport durée marée", d.p, "Article 4 convention"],
      ["dr — Durée remorquage", `${calc.drReel} h${calc.drForcee ? " (min. fictif 12 h appliqué)" : ""}`, "Rapports de mer"],
      ["m — Coefficient météo", d.m, "Météo France"],
      ["Avaries assistant", fmtEur(d.avaries), "Constat contradictoire"],
      ["Immobilisation", fmtEur(d.immo), "Justificatifs exploitation"],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK },
    styles: { cellPadding: 2 },
    margin: { left: 15, right: 15 },
  });
  y = doc.lastAutoTable.finalY + 6;

  y = sectionTitle(doc, y, "Calcul détaillé");
  doc.autoTable({
    startY: y,
    head: [["Étape", "Formule", "Résultat"]],
    body: [
      ["Q — Produit horaire moyen", `V / H = ${d.V} / ${d.H}`, fmtEur(calc.Q) + "/h"],
      ["T — Temps perdu", `A + R − 2 × p × R = ${d.A} + ${d.R} − 2 × ${Math.min(d.p, 1)} × ${d.R}`, calc.T + " h"],
      ["X — Perte de pêche", "Q × T", fmtEur(calc.X)],
      ["I — Indemnité horaire", "(W/100)×[(8,5W+16475)/(W+350)]×Kb×(1/6,55957)", fmtEur(calc.I) + "/h"],
      ["Y — Service rendu", `I × dr × m = ${fmt(calc.I)} × ${calc.dr} × ${d.m}`, fmtEur(calc.Y)],
      ["Détérioration remorque (25 % de Y)", "0,25 × Y", fmtEur(calc.remorque)],
      ["Z — Dommages assistant", "Avaries + remorque + immobilisation", fmtEur(calc.Z)],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK },
    styles: { cellPadding: 2 },
    margin: { left: 15, right: 15 },
    columnStyles: { 2: { halign: "right", fontStyle: "bold" } },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = resultBox(doc, y, "Indemnité d'assistance (X + Y + Z)", fmtEur(calc.total));
  y = resultBox(doc, y, "Remboursement assureur Corps (10/10)", fmtEur(calc.total));

  y += 4;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("L'indemnité ne peut excéder la valeur des choses sauvées (article L. 5132-6 Code des transports).", 15, y);

  footer(doc, 1, 1);
  return doc;
}

// ─── Concarneau PDF ───
export function pdfConcarneau(d, calc, title = "Calcul d'indemnité — Convention de Concarneau") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Convention de Concarneau");
  let y = 45;

  y = sectionTitle(doc, y, "Référence du dossier");
  y = metaBlock(doc, y, [
    ["Dossier", d.title || "—"],
    ["Convention", "Concarneau (puissance < 900 CV)"],
    ["Coefficient Kc", d.kc],
  ]);

  y = sectionTitle(doc, y, "Données factuelles");
  doc.autoTable({
    startY: y,
    head: [["Paramètre", "Valeur"]],
    body: [
      ["W — Puissance assistant", `${d.W} CV → coeff E = ${calc.E.coeff} (${calc.E.label})`],
      ["W — Puissance assisté", `${d.Wassiste} CV`],
      ["N1 — Milles déroutement", `${d.N1} milles`],
      ["Nrem — Milles à la remorque", `${d.Nrem} milles`],
      ["A4 — Coeff météo", d.a4],
      ["Jours depuis début marée", `${d.jours} j (équiv. ${calc.joursEquiv} j)`],
      ["Durée moyenne marée", `${d.dureeMaree} j`],
      ["Distance port refuge", `${d.dRefuge} milles`],
      ["Port étranger au Quartier", d.portEtranger ? "Oui" : "Non"],
      ["Marée ≤ 4 j (B et C = 1)", d.maree4j ? "Oui" : "Non"],
      ["Avaries assistant", fmtEur(d.avaries)],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK },
    styles: { cellPadding: 2 },
    margin: { left: 15, right: 15 },
  });
  y = doc.lastAutoTable.finalY + 6;

  y = sectionTitle(doc, y, "Indemnité de base A");
  doc.autoTable({
    startY: y,
    head: [["Tranche", "Détail", "Montant"]],
    body: [
      ["A1", `Déroutement : ${d.N1} × 0,91 €`, fmtEur(calc.A1)],
      ["A2", `${calc.milles_A2} milles × 4,57 €`, fmtEur(calc.A2)],
      ["A3a", `${calc.milles_A3a} milles × 1,22 €`, fmtEur(calc.A3a)],
      ["A3b", `${calc.milles_A3b} milles × 0,91 €`, fmtEur(calc.A3b)],
      ["A3c", `${calc.milles_A3c} milles × 0,61 €`, fmtEur(calc.A3c)],
      ["A3d", `${calc.milles_A3d} milles × 0,30 €`, fmtEur(calc.A3d)],
      ["A4 météo", `(A2+A3) × ${d.a4}`, fmtEur(calc.A23meteo)],
      ["A retenu", "A1 + (A2+A3) × A4", fmtEur(calc.A_total)],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK },
    styles: { cellPadding: 2 },
    margin: { left: 15, right: 15 },
    columnStyles: { 2: { halign: "right", fontStyle: "bold" } },
  });
  y = doc.lastAutoTable.finalY + 6;

  if (y > 230) { doc.addPage(); y = 20; }

  y = sectionTitle(doc, y, "Séquence article III");
  doc.autoTable({
    startY: y,
    head: [["Étape", "Calcul", "Résultat"]],
    body: [
      [`× B = ${calc.B}`, "A × B", fmtEur(calc.A_total * calc.B)],
      [`+ C`, `0,61 × ${d.dRefuge} × ${calc.C_coeff}`, fmtEur(calc.C_val)],
      ["+ D attente en mer", "—", fmtEur(calc.D_avant)],
      [`× E`, `× ${calc.E.coeff}`, fmtEur(calc.apres_E)],
      [`× Kc`, `× ${d.kc}`, fmtEur(calc.apres_Kc)],
      [`× 1,20`, "Usure câbles", fmtEur(calc.apres_cables)],
      ["+ Avaries assistant", "—", fmtEur(d.avaries)],
      ["+ D immobilisation port", "Da + Db", fmtEur(calc.D_apres)],
      ["+ Immo > 7 j", "—", fmtEur(d.immoLong)],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK },
    styles: { cellPadding: 2 },
    margin: { left: 15, right: 15 },
    columnStyles: { 2: { halign: "right", fontStyle: "bold" } },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = resultBox(doc, y, "Indemnité d'assistance", fmtEur(calc.indemnite_assistant));

  if (calc.isPetit) {
    y = resultBox(doc, y, "Part assureur (9/10 + plafond)", fmtEur(calc.part_assureur));
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`Part assuré (1/10 plafonné à 850 × Kc = ${fmtEur(calc.plafond_un_dixieme)}) : ${fmtEur(calc.part_assure)}`, 15, y);
  } else {
    y = resultBox(doc, y, "Part assureur (10/10)", fmtEur(calc.part_assureur));
  }

  footer(doc, 1, 1);
  return doc;
}

// ─── Pertes de pêche PDF ───
export function pdfPertesPeche(d, calc, title = "Évaluation perte de pêche") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Évaluation — Perte de pêche");
  let y = 45;

  y = sectionTitle(doc, y, "Référence du dossier");
  y = metaBlock(doc, y, [
    ["Dossier", d.title || "—"],
    ["Navire sinistré", d.navireSinistre || "—"],
    ["Période", d.periode || "—"],
    ["Jours d'arrêt", `${d.joursArret} j`],
  ]);

  y = sectionTitle(doc, y, "Étape 1 — Coefficient pondérateur");
  const refRows = d.references.map((r, i) => [
    `Réf. ${String.fromCharCode(65 + i)}`,
    r.nom || "",
    fmtEur(r.totalCA),
    `${r.totalJours} j`,
    fmtEur(r.caJournalier),
  ]);
  doc.autoTable({
    startY: y,
    head: [["", "Navire", "CA total", "Jours", "CA / jour"]],
    body: [
      ...refRows,
      ["", "Moyenne 3 navires", "", "", fmtEur(calc.caJournalierRefMoy)],
      ["X", d.navireSinistre || "Sinistré", fmtEur(calc.sinistreTotalCA), `${calc.sinistreTotalJours} j`, fmtEur(calc.caJournalierSinistre)],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK },
    styles: { cellPadding: 2 },
    margin: { left: 15, right: 15 },
    columnStyles: { 4: { halign: "right" } },
  });
  y = doc.lastAutoTable.finalY + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(`Coefficient pondérateur = CA/j sinistré ÷ CA/j référence = ${calc.coeffPond.toFixed(4)}`, 15, y);
  y += 8;

  y = sectionTitle(doc, y, "Étape 2 — CA brut perdu");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`CA total 3 ans : ${fmtEur(calc.caHistTotal)}    Jours totaux : ${calc.joursHistTotal}`, 15, y); y += 5;
  doc.text(`CA moyen journalier historique : ${fmtEur(calc.caJourHist)}`, 15, y); y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`CA brut perdu = ${calc.joursArret} × ${fmt(calc.caJourHist)} × ${calc.coeffPond.toFixed(4)} = ${fmtEur(calc.caBrutPerdu)}`, 15, y);
  y += 8;

  y = sectionTitle(doc, y, "Étape 3 — Charges à déduire");
  doc.autoTable({
    startY: y,
    head: [["Poste", "Coût retenu"]],
    body: d.charges.filter((c) => c.label).map((c) => [c.label, fmtEur(c.montant)]),
    foot: [
      ["Total charges retenues", fmtEur(calc.totalCharges)],
      [`Charge journalière (sur ${d.joursCharges} j)`, fmtEur(calc.chargeJour)],
      [`Charges à déduire (× ${d.joursArret} j)`, fmtEur(calc.chargesDeduire)],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK },
    footStyles: { fillColor: SAND, textColor: NAVY, fontStyle: "bold", fontSize: 9 },
    styles: { cellPadding: 2 },
    margin: { left: 15, right: 15 },
    columnStyles: { 1: { halign: "right" } },
  });
  y = doc.lastAutoTable.finalY + 8;

  if (y > 250) { doc.addPage(); y = 20; }

  y = sectionTitle(doc, y, "Étape 4 — Perte de pêche retenue");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.text(`CA brut perdu : ${fmtEur(calc.caBrutPerdu)}`, 15, y); y += 5;
  doc.text(`− Charges à déduire : ${fmtEur(calc.chargesDeduire)}`, 15, y); y += 8;

  y = resultBox(doc, y, "Perte de pêche retenue", fmtEur(calc.perteRetenue));

  footer(doc, 1, 1);
  return doc;
}

// ─── Abordage PDF ───
export function pdfAbordage(d, calc, title = "Partage de responsabilité — Abordage") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Abordage — Partage de responsabilité");
  let y = 45;

  y = sectionTitle(doc, y, "Référence du dossier");
  y = metaBlock(doc, y, [
    ["Dossier", d.title || "—"],
    ["Navire A", d.navireA || "—"],
    ["Navire B", d.navireB || "—"],
    ["Date / Lieu", d.dateLieu || "—"],
  ]);

  y = sectionTitle(doc, y, "Préjudices déclarés");
  doc.autoTable({
    startY: y,
    head: [["Poste", "Navire A", "Navire B"]],
    body: [
      ["Dommages matériels", fmtEur(d.matA), fmtEur(d.matB)],
      ["Perte d'exploitation", fmtEur(d.exploitA), fmtEur(d.exploitB)],
      ["Autres préjudices", fmtEur(d.autresA), fmtEur(d.autresB)],
      ["Total préjudices", fmtEur(calc.totalA), fmtEur(calc.totalB)],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK },
    styles: { cellPadding: 2 },
    margin: { left: 15, right: 15 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });
  y = doc.lastAutoTable.finalY + 6;

  y = sectionTitle(doc, y, "Manquements RIPAM retenus");
  doc.autoTable({
    startY: y,
    head: [["Règle", "Intitulé", "Points A", "Points B"]],
    body: d.regles.filter((r) => r.actif).map((r) => [
      r.code,
      r.label,
      r.pointsA || 0,
      r.pointsB || 0,
    ]),
    foot: [["", "Total points", calc.pointsA, calc.pointsB]],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK },
    footStyles: { fillColor: SAND, textColor: NAVY, fontStyle: "bold", fontSize: 9 },
    styles: { cellPadding: 2 },
    margin: { left: 15, right: 15 },
    columnStyles: { 2: { halign: "center" }, 3: { halign: "center" } },
  });
  y = doc.lastAutoTable.finalY + 8;

  y = sectionTitle(doc, y, "Partage de responsabilité");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.text(`Quote-part de responsabilité A : ${calc.partA.toFixed(2)} %    B : ${calc.partB.toFixed(2)} %`, 15, y);
  y += 8;

  y = sectionTitle(doc, y, "Calcul des soldes");
  doc.autoTable({
    startY: y,
    head: [["Poste", "Calcul", "Montant"]],
    body: [
      [`A doit à B (${calc.partA.toFixed(1)} % × préjudice B)`, `${calc.partA.toFixed(2)} % × ${fmtEur(calc.totalB)}`, fmtEur(calc.aDoitB)],
      [`B doit à A (${calc.partB.toFixed(1)} % × préjudice A)`, `${calc.partB.toFixed(2)} % × ${fmtEur(calc.totalA)}`, fmtEur(calc.bDoitA)],
      ["Solde net", calc.solde > 0 ? "A doit à B" : calc.solde < 0 ? "B doit à A" : "Compensation parfaite", fmtEur(Math.abs(calc.solde))],
    ],
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: INK },
    styles: { cellPadding: 2 },
    margin: { left: 15, right: 15 },
    columnStyles: { 2: { halign: "right", fontStyle: "bold" } },
  });
  y = doc.lastAutoTable.finalY + 8;

  if (y > 250) { doc.addPage(); y = 20; }

  const soldeLabel = calc.solde > 0
    ? `Solde net : A doit à B`
    : calc.solde < 0
    ? `Solde net : B doit à A`
    : `Compensation parfaite`;
  y = resultBox(doc, y, soldeLabel, fmtEur(Math.abs(calc.solde)));

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  const note = "Le partage de responsabilité résulte de l'analyse des manquements aux règles du RIPAM (COLREG 1972). Cette pondération constitue une aide à la décision : la décision finale appartient aux parties, à leurs assureurs ou à la juridiction compétente.";
  const lines = doc.splitTextToSize(note, 180);
  doc.text(lines, 15, y);

  footer(doc, 1, 1);
  return doc;
}

export function downloadPDF(doc, filename) {
  doc.save(filename);
}
