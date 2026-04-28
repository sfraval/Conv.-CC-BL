// Génération Word (.docx) style LA HUNE — Cabinet d'expertise maritime indépendant
// Utilise la lib `docx` (Microsoft) — encodage UTF-8 natif, parfait pour le français

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, ImageRun, TabStopType, TabStopPosition,
  convertInchesToTwip, LineRuleType, HeightRule
} from "docx";

// Couleurs LA HUNE en hex sans # (format docx)
const NAVY = "1C2E5C";
const CORAL = "E85B3A";
const SAND = "FAF7F2";
const GRAY = "6E7582";
const INK = "0F1B33";
const LIGHT_BORDER = "E5E1D8";

const BORDER_NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const BORDER_THIN = { style: BorderStyle.SINGLE, size: 4, color: LIGHT_BORDER };
const BORDER_NAVY = { style: BorderStyle.SINGLE, size: 6, color: NAVY };
const BORDER_CORAL = { style: BorderStyle.SINGLE, size: 12, color: CORAL };

// ─── Helpers de formatage ───
function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
const fmtEur = (n) => fmt(n) + " €";

// ─── Composants atomiques ───

function txt(text, opts = {}) {
  return new TextRun({
    text: String(text ?? ""),
    font: "Helvetica",
    size: opts.size ?? 20, // 10pt par défaut (size = demi-points)
    color: opts.color ?? INK,
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    ...(opts.highlight ? { highlight: opts.highlight } : {}),
  });
}

function p(content, opts = {}) {
  const children = Array.isArray(content) ? content : [content];
  return new Paragraph({
    children: children.map(c => typeof c === "string" ? txt(c, opts) : c),
    alignment: opts.alignment ?? AlignmentType.LEFT,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 100, line: 280, lineRule: LineRuleType.AUTO },
    ...(opts.indent ? { indent: opts.indent } : {}),
  });
}

function h1(text) {
  return new Paragraph({
    children: [txt(text.toUpperCase(), { bold: true, size: 22, color: NAVY })],
    spacing: { before: 320, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: CORAL, space: 4 },
    },
  });
}

function h2(text) {
  return new Paragraph({
    children: [txt(text, { bold: true, size: 20, color: NAVY })],
    spacing: { before: 240, after: 100 },
  });
}

function spacer(size = 100) {
  return new Paragraph({ children: [txt("")], spacing: { before: 0, after: size } });
}

function metaRow(label, value) {
  return new Paragraph({
    children: [
      txt(label.toUpperCase(), { bold: true, size: 16, color: NAVY }),
      txt("    "),
      txt(value, { size: 18 }),
    ],
    spacing: { before: 0, after: 60 },
  });
}

// ─── Cellule de tableau ───
function cell(text, opts = {}) {
  const isHeader = opts.header ?? false;
  const align = opts.align ?? AlignmentType.LEFT;
  const shading = opts.shading
    ? { type: ShadingType.SOLID, color: opts.shading, fill: opts.shading }
    : (isHeader ? { type: ShadingType.SOLID, color: NAVY, fill: NAVY } : undefined);

  return new TableCell({
    children: [new Paragraph({
      children: [txt(text ?? "", {
        bold: isHeader || opts.bold,
        color: isHeader ? "FFFFFF" : (opts.color ?? INK),
        size: isHeader ? 16 : 18,
      })],
      alignment: align,
      spacing: { before: 40, after: 40 },
    })],
    shading,
    borders: {
      top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN,
    },
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

// Construit un tableau à partir d'un array de [header, ...rows]
function table(rows, opts = {}) {
  const aligns = opts.aligns ?? [];
  const widths = opts.widths ?? [];

  const tableRows = rows.map((row, rowIdx) => {
    const isHeader = rowIdx === 0;
    const cells = row.map((c, colIdx) => {
      // c peut être string ou {text, opts}
      const value = typeof c === "object" && c !== null ? c.text : c;
      const cellOpts = typeof c === "object" && c !== null ? (c.opts ?? {}) : {};
      return cell(value, {
        header: isHeader,
        align: cellOpts.align ?? aligns[colIdx] ?? AlignmentType.LEFT,
        width: widths[colIdx],
        bold: cellOpts.bold,
        shading: cellOpts.shading,
        color: cellOpts.color,
      });
    });
    return new TableRow({ children: cells });
  });

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
}

// ─── Boîte de résultat ───
function resultBox(label, value) {
  return new Table({
    rows: [new TableRow({
      children: [new TableCell({
        children: [
          new Paragraph({
            children: [txt(label.toUpperCase(), { color: "FFFFFF", size: 16 })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 80, after: 0 },
          }),
          new Paragraph({
            children: [txt(value, { color: CORAL, bold: true, size: 36 })],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 40, after: 80 },
          }),
        ],
        shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
        borders: {
          top: BORDER_NONE, bottom: BORDER_NONE, left: BORDER_NONE, right: BORDER_NONE,
        },
        margins: { top: 100, bottom: 100, left: 200, right: 200 },
      })],
    })],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ─── Bloc Conclusions et observations ───
function conclusionsBlock(prefilled = "") {
  const lines = [
    h1("Conclusions et observations"),
    p("Le présent calcul est fourni à titre d'aide à la décision dans le cadre du dossier visé en référence.", { italics: true, color: GRAY, size: 16 }),
    spacer(120),
  ];
  // 8 lignes vides matérialisées par un soulignement
  if (prefilled) {
    lines.push(p(prefilled));
  } else {
    for (let i = 0; i < 8; i++) {
      lines.push(new Paragraph({
        children: [txt(" ".repeat(120))],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_BORDER, space: 1 } },
        spacing: { before: 180, after: 40 },
      }));
    }
  }
  lines.push(spacer(200));
  lines.push(p("Fait à Landéda, le " + new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }), { italics: true, color: GRAY, size: 16 }));
  lines.push(p("L'expert maritime", { italics: true, color: GRAY, size: 16 }));
  return lines;
}

// ─── Header et footer ───
function buildHeader(missionRef, title) {
  return new Header({
    children: [
      new Paragraph({
        children: [
          txt("LA HUNE.", { bold: true, color: NAVY, size: 24 }),
          new TextRun({ children: [new TextRun({ text: "\t" })], font: "Helvetica" }),
          txt(missionRef || "", { color: GRAY, size: 16 }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { after: 40 },
      }),
      new Paragraph({
        children: [
          txt("Cabinet d'expertise maritime indépendant — Landéda, Finistère", { color: GRAY, size: 14 }),
          new TextRun({ children: [new TextRun({ text: "\t" })], font: "Helvetica" }),
          txt(title, { color: NAVY, size: 16, bold: true }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 12, color: CORAL, space: 6 },
        },
        spacing: { after: 200 },
      }),
    ],
  });
}

function buildFooter() {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          txt("LA HUNE — Cabinet d'expertise maritime indépendant · Landéda, Finistère", { color: GRAY, size: 14 }),
          new TextRun({ children: [new TextRun({ text: "\t" })], font: "Helvetica" }),
          txt("Page ", { color: GRAY, size: 14 }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Helvetica", size: 14, color: GRAY }),
          txt(" / ", { color: GRAY, size: 14 }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Helvetica", size: 14, color: GRAY }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_BORDER, space: 6 },
        },
      }),
    ],
  });
}

// ─── Construction du Document ───
function buildDoc({ title, headerTitle, missionRef, content, includeConclusions = true, prefilledConclusions = "" }) {
  const allContent = [...content];
  if (includeConclusions) {
    allContent.push(...conclusionsBlock(prefilledConclusions));
  }

  return new Document({
    creator: "LA HUNE",
    title: title,
    description: "Rapport d'expertise — LA HUNE",
    styles: {
      default: {
        document: {
          run: { font: "Helvetica", size: 20 },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(0.85),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(0.85),
          },
        },
      },
      headers: { default: buildHeader(missionRef, headerTitle) },
      footers: { default: buildFooter() },
      children: allContent,
    }],
  });
}

// ─── Export du Doc en .docx ───
export async function downloadDocx(doc, filename) {
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE BOULOGNE — RAPPORT WORD
// ═══════════════════════════════════════════════════════════════════════════

export function docxBoulogne(d, calc, options = {}) {
  const { template = "assistance", missionRef = "", includeConclusions = true } = options;

  const content = [
    // Référence
    h1("Référence du dossier"),
    metaRow("Dossier", d.title || "—"),
    metaRow("Convention", "Boulogne (puissance > 700 CV)"),
    metaRow("Coefficient Kb", String(d.kb)),
    metaRow("Date du rapport", new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })),
    spacer(),

    // Données factuelles
    h1("Données factuelles retenues"),
    table([
      ["Paramètre", "Valeur", "Source"],
      ["Puissance W de l'assistant", `${d.W} CV`, "Conditions particulières police Corps"],
      ["V — Ventes de référence", fmtEur(d.V), "Bulletins de criée — 3 marées encadrantes"],
      ["H — Heures sur lieux de pêche", `${d.H} h`, "Carnet de pêche / journal de bord"],
      ["A — Heures d'interruption", `${d.A} h`, "Rapports de mer"],
      ["R — Trajet direct théorique", `${d.R} h`, "Calcul cartographique"],
      ["p — Rapport durée marée", String(d.p), "Article 4 de la convention"],
      ["dr — Durée du remorquage", `${calc.drReel} h${calc.drForcee ? " (minimum fictif 12 h appliqué)" : ""}`, "Rapports de mer"],
      ["m — Coefficient météo", String(d.m), "Bulletin Météo France"],
      ["Avaries de l'assistant", fmtEur(d.avaries), "Constat contradictoire"],
      ["Indemnité d'immobilisation", fmtEur(d.immo), "Justificatifs d'exploitation"],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT], widths: [40, 25, 35] }),
    spacer(),

    // Calcul détaillé
    h1("Détail du calcul de l'indemnité"),

    h2("Poste X — Compensation de la perte de pêche"),
    table([
      ["Étape", "Formule", "Résultat"],
      ["Q — Produit horaire moyen", `V / H = ${fmt(d.V)} / ${fmt(d.H)}`, fmtEur(calc.Q) + "/h"],
      ["T — Temps perdu", `A + R − 2 × p × R = ${d.A} + ${d.R} − 2 × ${Math.min(parseFloat(d.p), 1)} × ${d.R}`, calc.T + " h"],
      [{ text: "X = Q × T", opts: { bold: true } }, "", { text: fmtEur(calc.X), opts: { bold: true } }],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.RIGHT], widths: [30, 45, 25] }),
    spacer(),

    h2("Poste Y — Rémunération du service rendu"),
    table([
      ["Étape", "Formule", "Résultat"],
      ["I — Indemnité horaire", `(W/100)×[(8,5W+16475)/(W+350)]×Kb×(1/6,55957)`, fmtEur(calc.I) + "/h"],
      [{ text: "Y = I × dr × m", opts: { bold: true } }, `${fmt(calc.I)} × ${calc.dr} × ${d.m}`, { text: fmtEur(calc.Y), opts: { bold: true } }],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.RIGHT], widths: [30, 45, 25] }),
    spacer(),

    h2("Poste Z — Dommages subis par l'assistant"),
    table([
      ["Élément", "", "Montant"],
      ["Avaries constatées contradictoirement", "", fmtEur(d.avaries)],
      ["Détérioration remorque (25 % de Y)", "0,25 × Y", fmtEur(calc.remorque)],
      ["Indemnité d'immobilisation", "", fmtEur(d.immo)],
      [{ text: "Z — total", opts: { bold: true } }, "", { text: fmtEur(calc.Z), opts: { bold: true } }],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.RIGHT], widths: [50, 25, 25] }),
    spacer(200),

    // Résultat
    resultBox("Indemnité d'assistance (X + Y + Z)", fmtEur(calc.total)),
    spacer(120),
    resultBox("Remboursement assureur Corps (10/10)", fmtEur(calc.total)),
    spacer(120),
    p("L'indemnité ne peut excéder la valeur des choses sauvées (article L. 5132-6 du Code des transports).", { italics: true, color: GRAY, size: 16 }),
  ];

  return buildDoc({
    title: `LA HUNE — Boulogne — ${d.title || "Rapport"}`,
    headerTitle: "Rapport d'assistance — Convention de Boulogne",
    missionRef,
    content,
    includeConclusions,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE CONCARNEAU — RAPPORT WORD
// ═══════════════════════════════════════════════════════════════════════════

export function docxConcarneau(d, calc, options = {}) {
  const { missionRef = "", includeConclusions = true } = options;

  const content = [
    h1("Référence du dossier"),
    metaRow("Dossier", d.title || "—"),
    metaRow("Convention", "Concarneau (puissance < 900 CV)"),
    metaRow("Coefficient Kc", String(d.kc)),
    metaRow("Date du rapport", new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })),
    spacer(),

    h1("Données factuelles retenues"),
    table([
      ["Paramètre", "Valeur"],
      ["Puissance W de l'assistant", `${d.W} CV — coefficient E = ${calc.E.coeff} (${calc.E.label})`],
      ["Puissance W de l'assisté", `${d.Wassiste} CV`],
      ["N1 — Milles déroutement", `${d.N1} milles`],
      ["Nrem — Milles à la remorque", `${d.Nrem} milles`],
      ["A4 — Coefficient météo", String(d.a4)],
      ["Jours depuis début de marée", `${d.jours} j (équivalent barème : ${calc.joursEquiv} j)`],
      ["Durée moyenne de marée", `${d.dureeMaree} j`],
      ["Distance port de refuge", `${d.dRefuge} milles`],
      ["Port étranger au Quartier", d.portEtranger ? "Oui" : "Non"],
      ["Marée ≤ 4 j (B et C = 1)", d.maree4j ? "Oui" : "Non"],
      ["Avaries de l'assistant", fmtEur(d.avaries)],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT], widths: [45, 55] }),
    spacer(),

    h1("Indemnité de base A"),
    table([
      ["Tranche", "Détail", "Montant"],
      ["A1 — Déroutement", `${d.N1} milles × 0,91 €`, fmtEur(calc.A1)],
      ["A2 — 0 à 5 milles", `${calc.milles_A2} milles × 4,57 €`, fmtEur(calc.A2)],
      ["A3a — 6 à 50 milles", `${calc.milles_A3a} milles × 1,22 €`, fmtEur(calc.A3a)],
      ["A3b — 51 à 400 milles", `${calc.milles_A3b} milles × 0,91 €`, fmtEur(calc.A3b)],
      ["A3c — 401 à 600 milles", `${calc.milles_A3c} milles × 0,61 €`, fmtEur(calc.A3c)],
      ["A3d — au-delà de 600 milles", `${calc.milles_A3d} milles × 0,30 €`, fmtEur(calc.A3d)],
      ["A4 — Application coeff météo", `(A2+A3) × ${d.a4}`, fmtEur(calc.A23meteo)],
      [{ text: "A retenu", opts: { bold: true } }, "A1 + (A2+A3) × A4", { text: fmtEur(calc.A_total), opts: { bold: true } }],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.RIGHT], widths: [30, 45, 25] }),
    spacer(),

    h1("Séquence de calcul (article III)"),
    table([
      ["Étape", "Calcul", "Résultat"],
      [`× B (B = ${calc.B})`, "A × B", fmtEur(calc.A_total * calc.B)],
      ["+ C (retour lieux pêche)", `0,61 × ${d.dRefuge} × ${calc.C_coeff}`, fmtEur(calc.C_val)],
      ["+ D — attente en mer", "—", fmtEur(calc.D_avant)],
      [`× E (puissance)`, `× ${calc.E.coeff}`, fmtEur(calc.apres_E)],
      [`× Kc`, `× ${d.kc}`, fmtEur(calc.apres_Kc)],
      ["× 1,20 (usure câbles)", "—", fmtEur(calc.apres_cables)],
      ["+ Avaries assistant", "—", fmtEur(d.avaries)],
      ["+ D — immobilisation au port", "Da + Db", fmtEur(calc.D_apres)],
      ["+ Immobilisation > 7 jours", "—", fmtEur(d.immoLong)],
      [{ text: "Indemnité d'assistance", opts: { bold: true } }, "", { text: fmtEur(calc.indemnite_avant_immo), opts: { bold: true } }],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.RIGHT], widths: [30, 45, 25] }),
    spacer(200),

    resultBox("Indemnité d'assistance", fmtEur(calc.indemnite_assistant)),
    spacer(120),
    calc.isPetit
      ? resultBox(`Part assureur (9/10 + plafond ${fmtEur(calc.plafond_un_dixieme)})`, fmtEur(calc.part_assureur))
      : resultBox("Part assureur (10/10)", fmtEur(calc.part_assureur)),
  ];

  if (calc.isPetit) {
    content.push(spacer(120));
    content.push(p(`Part restant à la charge de l'assuré (1/10 plafonné à 850 × Kc) : ${fmtEur(calc.part_assure)}`, { italics: true, color: GRAY, size: 16 }));
  }

  return buildDoc({
    title: `LA HUNE — Concarneau — ${d.title || "Rapport"}`,
    headerTitle: "Rapport d'assistance — Convention de Concarneau",
    missionRef,
    content,
    includeConclusions,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE PERTES DE PÊCHE — RAPPORT WORD
// ═══════════════════════════════════════════════════════════════════════════

export function docxPertesPeche(d, calc, options = {}) {
  const { missionRef = "", includeConclusions = true } = options;

  // FIX: tableau Étape 1 avec les vraies valeurs (calc.refsDetail)
  const refRows = d.references.map((r, i) => {
    const detail = calc.refsDetail[i] || {};
    return [
      `Réf. ${String.fromCharCode(65 + i)}`,
      r.nom || "—",
      fmtEur(detail.totalCA),
      `${detail.totalJours} j`,
      fmtEur(detail.caJournalier),
    ];
  });

  const content = [
    h1("Référence du dossier"),
    metaRow("Dossier", d.title || "—"),
    metaRow("Navire sinistré", d.navireSinistre || "—"),
    metaRow("Période d'arrêt", d.periode || "—"),
    metaRow("Jours d'arrêt", `${d.joursArret} j`),
    metaRow("Date du rapport", new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })),
    spacer(),

    h1("Méthode d'évaluation"),
    p("L'évaluation de la perte de pêche est conduite selon la méthode dite « des trois navires de référence », usuelle en expertise maritime sur sinistre pêche. Elle se déroule en quatre temps :"),
    p("1.  Détermination d'un coefficient pondérateur reflétant la performance relative du navire sinistré."),
    p("2.  Calcul du chiffre d'affaires brut perdu sur la période d'arrêt, à partir de l'historique du navire sinistré."),
    p("3.  Identification des charges fixes à déduire (charges non engagées pendant l'arrêt)."),
    p("4.  Détermination de la perte nette retenue."),
    spacer(),

    h1("1. Coefficient pondérateur"),
    p("Comparaison du chiffre d'affaires journalier moyen de trois navires de référence avec celui du navire sinistré sur la même période :", { italics: true, color: GRAY, size: 16 }),
    table([
      ["", "Navire", "CA total", "Jours", "CA / jour"],
      ...refRows,
      [
        { text: "", opts: { shading: SAND } },
        { text: "Moyenne des 3 navires", opts: { bold: true, shading: SAND } },
        { text: "", opts: { shading: SAND } },
        { text: "", opts: { shading: SAND } },
        { text: fmtEur(calc.caJournalierRefMoy), opts: { bold: true, shading: SAND } },
      ],
      [
        "X",
        d.navireSinistre || "Sinistré",
        fmtEur(calc.sinistreTotalCA),
        `${calc.sinistreTotalJours} j`,
        fmtEur(calc.caJournalierSinistre),
      ],
    ], { aligns: [AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.RIGHT, AlignmentType.RIGHT], widths: [10, 30, 22, 13, 25] }),
    spacer(120),
    p([
      txt("Coefficient pondérateur = ", { bold: true }),
      txt(`CA/j sinistré ÷ CA/j moyenne = ${fmtEur(calc.caJournalierSinistre)} ÷ ${fmtEur(calc.caJournalierRefMoy)} = `),
      txt(calc.coeffPond.toFixed(4), { bold: true, color: CORAL }),
    ]),
    spacer(),

    h1("2. Chiffre d'affaires brut perdu"),
    p("Calculé à partir de l'historique du navire sinistré sur trois années, multiplié par les jours d'arrêt et pondéré par le coefficient ci-dessus :", { italics: true, color: GRAY, size: 16 }),
    table([
      ["Élément", "Valeur"],
      ["CA total historique 3 ans", fmtEur(calc.caHistTotal)],
      ["Jours totaux historique", `${calc.joursHistTotal} j`],
      ["CA moyen journalier historique", fmtEur(calc.caJourHist) + "/j"],
      ["Jours d'arrêt", `${calc.joursArret} j`],
      ["Coefficient pondérateur", calc.coeffPond.toFixed(4)],
      [
        { text: "CA brut perdu", opts: { bold: true } },
        { text: fmtEur(calc.caBrutPerdu), opts: { bold: true, color: CORAL } },
      ],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT], widths: [60, 40] }),
    spacer(),

    h1("3. Charges fixes à déduire"),
    p("Charges non engagées pendant la période d'arrêt, rapportées à la durée d'exploitation et appliquées aux jours d'arrêt :", { italics: true, color: GRAY, size: 16 }),
    table([
      ["Poste", "Montant"],
      ...d.charges.filter(c => c.label).map(c => [c.label, fmtEur(c.montant)]),
      [
        { text: "Total charges retenues", opts: { bold: true, shading: SAND } },
        { text: fmtEur(calc.totalCharges), opts: { bold: true, shading: SAND } },
      ],
      [`Charge journalière (sur ${d.joursCharges} j)`, fmtEur(calc.chargeJour) + "/j"],
      [
        { text: `Charges à déduire (× ${calc.joursArret} j d'arrêt)`, opts: { bold: true } },
        { text: fmtEur(calc.chargesDeduire), opts: { bold: true, color: CORAL } },
      ],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT], widths: [60, 40] }),
    spacer(),

    h1("4. Perte de pêche retenue"),
    table([
      ["", "Montant"],
      ["CA brut perdu", fmtEur(calc.caBrutPerdu)],
      ["− Charges à déduire", "− " + fmtEur(calc.chargesDeduire)],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT], widths: [60, 40] }),
    spacer(200),

    resultBox("Perte de pêche retenue", fmtEur(calc.perteRetenue)),
  ];

  return buildDoc({
    title: `LA HUNE — Pertes de pêche — ${d.title || "Rapport"}`,
    headerTitle: "Évaluation — Perte de pêche",
    missionRef,
    content,
    includeConclusions,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE ABORDAGE — RAPPORT WORD
// ═══════════════════════════════════════════════════════════════════════════

export function docxAbordage(d, calc, options = {}) {
  const { missionRef = "", includeConclusions = true } = options;

  const reglesActives = d.regles.filter(r => r.actif);

  const content = [
    h1("Référence du dossier"),
    metaRow("Dossier", d.title || "—"),
    metaRow("Navire A", d.navireA || "—"),
    metaRow("Navire B", d.navireB || "—"),
    metaRow("Date / Lieu", d.dateLieu || "—"),
    metaRow("Date du rapport", new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })),
    spacer(),

    h1("Préjudices déclarés"),
    table([
      ["Poste", "Navire A", "Navire B"],
      ["Dommages matériels", fmtEur(d.matA), fmtEur(d.matB)],
      ["Perte d'exploitation", fmtEur(d.exploitA), fmtEur(d.exploitB)],
      ["Autres préjudices", fmtEur(d.autresA), fmtEur(d.autresB)],
      [
        { text: "Total préjudices", opts: { bold: true, shading: SAND } },
        { text: fmtEur(calc.totalA), opts: { bold: true, shading: SAND } },
        { text: fmtEur(calc.totalB), opts: { bold: true, shading: SAND } },
      ],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.RIGHT], widths: [40, 30, 30] }),
    spacer(),

    h1("Manquements aux règles du RIPAM (COLREG 1972)"),
    p("Les manquements retenus, par règle et par navire :", { italics: true, color: GRAY, size: 16 }),
    table([
      ["Règle", "Intitulé du manquement", "Points A", "Points B"],
      ...reglesActives.map(r => [
        r.code,
        r.label,
        { text: String(r.pointsA || 0), opts: { align: AlignmentType.CENTER } },
        { text: String(r.pointsB || 0), opts: { align: AlignmentType.CENTER } },
      ]),
      [
        { text: "", opts: { shading: SAND } },
        { text: "Total points", opts: { bold: true, shading: SAND } },
        { text: String(calc.pointsA), opts: { bold: true, shading: SAND, align: AlignmentType.CENTER } },
        { text: String(calc.pointsB), opts: { bold: true, shading: SAND, align: AlignmentType.CENTER } },
      ],
    ], { aligns: [AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER], widths: [12, 58, 15, 15] }),
    spacer(120),
    p("Note : le texte intégral des règles RIPAM peut être annexé au rapport. Les passages applicables au cas d'espèce sont à surligner manuellement avant transmission.", { italics: true, color: GRAY, size: 14 }),
    spacer(),

    h1("Partage de responsabilité proposé"),
    table([
      ["Navire", "Quote-part"],
      [
        { text: `${d.navireA || "Navire A"}`, opts: { bold: true } },
        { text: `${calc.partA.toFixed(2)} %`, opts: { bold: true, color: CORAL } },
      ],
      [
        { text: `${d.navireB || "Navire B"}`, opts: { bold: true } },
        { text: `${calc.partB.toFixed(2)} %`, opts: { bold: true, color: CORAL } },
      ],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT], widths: [70, 30] }),
    spacer(),

    h1("Calcul des soldes"),
    table([
      ["Poste", "Calcul", "Montant"],
      [
        `${d.navireA || "A"} doit à ${d.navireB || "B"}`,
        `${calc.partA.toFixed(2)} % × ${fmtEur(calc.totalB)}`,
        fmtEur(calc.aDoitB),
      ],
      [
        `${d.navireB || "B"} doit à ${d.navireA || "A"}`,
        `${calc.partB.toFixed(2)} % × ${fmtEur(calc.totalA)}`,
        fmtEur(calc.bDoitA),
      ],
      [
        {
          text: calc.solde > 0 ? `Solde net : ${d.navireA || "A"} doit à ${d.navireB || "B"}`
              : calc.solde < 0 ? `Solde net : ${d.navireB || "B"} doit à ${d.navireA || "A"}`
              : "Compensation parfaite",
          opts: { bold: true, shading: SAND },
        },
        { text: "", opts: { shading: SAND } },
        { text: fmtEur(Math.abs(calc.solde)), opts: { bold: true, shading: SAND } },
      ],
    ], { aligns: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.RIGHT], widths: [45, 30, 25] }),
    spacer(200),

    resultBox(
      calc.solde > 0 ? `Solde net : ${d.navireA || "A"} doit à ${d.navireB || "B"}`
        : calc.solde < 0 ? `Solde net : ${d.navireB || "B"} doit à ${d.navireA || "A"}`
        : "Compensation parfaite",
      fmtEur(Math.abs(calc.solde))
    ),
    spacer(120),
    p("Le partage de responsabilité ainsi proposé résulte de l'analyse des manquements aux règles du RIPAM (COLREG 1972). Cette pondération constitue une aide à la décision : la décision finale appartient aux parties, à leurs assureurs ou à la juridiction compétente.", { italics: true, color: GRAY, size: 14 }),
  ];

  return buildDoc({
    title: `LA HUNE — Abordage — ${d.title || "Rapport"}`,
    headerTitle: "Partage de responsabilité — Abordage",
    missionRef,
    content,
    includeConclusions,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTE TECHNIQUE GÉNÉRIQUE (template "neutre" si l'expert veut un format minimal)
// ═══════════════════════════════════════════════════════════════════════════

export function docxNoteGenerique(title, paragraphs, options = {}) {
  const { missionRef = "" } = options;

  const content = [
    h1("Note technique"),
    metaRow("Objet", title),
    metaRow("Date", new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })),
    spacer(),
    ...paragraphs.map(t => p(t)),
  ];

  return buildDoc({
    title: `LA HUNE — Note technique`,
    headerTitle: "Note technique",
    missionRef,
    content,
    includeConclusions: true,
  });
}
