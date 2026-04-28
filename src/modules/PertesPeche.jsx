import React, { useState, useMemo, useEffect } from "react";
import { Save, FileDown, Trash2, FolderOpen, Plus, X } from "lucide-react";
import { Field, NumInput, TextInput, Section, StepRow, InfoBox, Btn, ExportModal, fmtEur, fmt, num, NAVY, CORAL, INK } from "../components/ui.jsx";
import { saveDossier, loadByType, deleteDossier } from "../lib/storage.js";
import { docxPertesPeche, downloadDocx } from "../lib/docx.js";

// Données par défaut basées sur l'exemple xlsx LA HUNE
const DEFAULT_DATA = {
  title: "Cas pédagogique perte de pêche",
  missionRef: "",
  navireSinistre: "Navire X",
  periode: "21/09 — 17/02",
  joursArret: "72",
  references: [
    { nom: "Navire A", marees: [{ ca: "1508489", j: "49" }, { ca: "769822", j: "46" }, { ca: "848498", j: "52" }] },
    { nom: "Navire B", marees: [{ ca: "1109737", j: "49" }, { ca: "1036635", j: "43" }, { ca: "954250", j: "48" }] },
    { nom: "Navire C", marees: [{ ca: "1678133", j: "44" }, { ca: "969488", j: "49" }, { ca: "977009", j: "51" }] },
  ],
  sinistreMareesRef: [
    { ca: "1178447", j: "49" }, { ca: "277742", j: "35" }, { ca: "1182437", j: "45" },
  ],
  historique: [
    { annee: "N-2", marees: [{ ca: "1282668", j: "43" }, { ca: "790947", j: "49" }, { ca: "944226", j: "52" }] },
    { annee: "N-1", marees: [{ ca: "1105162", j: "49" }, { ca: "941388", j: "47" }, { ca: "1106128", j: "50" }] },
    { annee: "N",   marees: [{ ca: "1528031", j: "48" }, { ca: "830543", j: "49" }, { ca: "897806", j: "51" }] },
  ],
  charges: [
    { label: "Salaires équipage", montant: "1574261" },
    { label: "Fuel", montant: "674000" },
    { label: "Oil", montant: "52000" },
    { label: "Sel", montant: "62000" },
    { label: "Insurance", montant: "78000" },
    { label: "Dotations", montant: "306000" },
    { label: "Engine & Aux", montant: "163000" },
    { label: "Vessel running", montant: "24000" },
    { label: "Bridge computer aid", montant: "83000" },
    { label: "Admin", montant: "180000" },
    { label: "Comm", montant: "39000" },
    { label: "Taxes", montant: "12000" },
  ],
  joursCharges: "270",
};

function sumMarees(marees) {
  let totalCA = 0, totalJ = 0;
  for (const m of marees) {
    totalCA += num(m.ca);
    totalJ += num(m.j);
  }
  return { totalCA, totalJours: totalJ };
}

export default function PertesPeche() {
  const [d, setD] = useState(DEFAULT_DATA);
  const [currentId, setCurrentId] = useState(null);
  const [showDossiers, setShowDossiers] = useState(false);
  const [dossiers, setDossiers] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => { setDossiers(loadByType("pertes-peche")); }, [showDossiers]);

  const set = (k) => (v) => setD({ ...d, [k]: v });

  const calc = useMemo(() => {
    // Étape 1 - Coefficient pondérateur
    const refsDetail = d.references.map((r) => {
      const s = sumMarees(r.marees);
      return { ...s, caJournalier: s.totalJours > 0 ? s.totalCA / s.totalJours : 0 };
    });
    const caJournalierRefMoy = refsDetail.length > 0
      ? refsDetail.reduce((a, b) => a + b.caJournalier, 0) / refsDetail.length
      : 0;
    const sinistreSum = sumMarees(d.sinistreMareesRef);
    const caJournalierSinistre = sinistreSum.totalJours > 0 ? sinistreSum.totalCA / sinistreSum.totalJours : 0;
    const coeffPond = caJournalierRefMoy > 0 ? caJournalierSinistre / caJournalierRefMoy : 0;

    // Étape 2 - CA brut perdu
    let caHistTotal = 0, joursHistTotal = 0;
    for (const an of d.historique) {
      const s = sumMarees(an.marees);
      caHistTotal += s.totalCA;
      joursHistTotal += s.totalJours;
    }
    const caJourHist = joursHistTotal > 0 ? caHistTotal / joursHistTotal : 0;
    const joursArret = num(d.joursArret);
    const caBrutPerdu = joursArret * caJourHist * coeffPond;

    // Étape 3 - Charges
    const totalCharges = d.charges.reduce((a, c) => a + num(c.montant), 0);
    const joursCharges = num(d.joursCharges);
    const chargeJour = joursCharges > 0 ? totalCharges / joursCharges : 0;
    const chargesDeduire = chargeJour * joursArret;

    // Étape 4 - Perte retenue
    const perteRetenue = caBrutPerdu - chargesDeduire;

    return {
      refsDetail, caJournalierRefMoy,
      sinistreTotalCA: sinistreSum.totalCA, sinistreTotalJours: sinistreSum.totalJours, caJournalierSinistre,
      coeffPond, caHistTotal, joursHistTotal, caJourHist, joursArret, caBrutPerdu,
      totalCharges, chargeJour, chargesDeduire, perteRetenue,
    };
  }, [d]);

  const onSave = () => {
    const saved = saveDossier({ id: currentId, type: "pertes-peche", title: d.title || "Sans titre", data: d });
    setCurrentId(saved.id);
    alert(`Dossier sauvegardé : ${saved.id}`);
  };
  const onLoad = (dos) => { setD({ ...DEFAULT_DATA, ...dos.data }); setCurrentId(dos.id); setShowDossiers(false); };
  const onNew = () => { setD(DEFAULT_DATA); setCurrentId(null); };
  const onDelete = (id) => {
    if (confirm("Supprimer ce dossier ?")) {
      deleteDossier(id); setDossiers(loadByType("pertes-peche"));
      if (currentId === id) onNew();
    }
  };
  const onExport = async ({ template, missionRef, includeConclusions }) => {
    setD({ ...d, missionRef });
    const doc = docxPertesPeche(d, calc, { template, missionRef, includeConclusions });
    await downloadDocx(doc, `LA_HUNE_PertesPeche_${(d.title || "dossier").replace(/[^a-z0-9]/gi, "_")}.docx`);
    setExportOpen(false);
  };

  // Helpers d'édition de tableaux
  const updateRef = (i, key, val, mareeIdx = null) => {
    const refs = [...d.references];
    if (mareeIdx !== null) {
      refs[i].marees[mareeIdx] = { ...refs[i].marees[mareeIdx], [key]: val };
    } else {
      refs[i] = { ...refs[i], [key]: val };
    }
    setD({ ...d, references: refs });
  };
  const updateSinistreMaree = (i, key, val) => {
    const m = [...d.sinistreMareesRef];
    m[i] = { ...m[i], [key]: val };
    setD({ ...d, sinistreMareesRef: m });
  };
  const updateHist = (i, mareeIdx, key, val) => {
    const h = [...d.historique];
    h[i].marees[mareeIdx] = { ...h[i].marees[mareeIdx], [key]: val };
    setD({ ...d, historique: h });
  };
  const updateCharge = (i, key, val) => {
    const c = [...d.charges];
    c[i] = { ...c[i], [key]: val };
    setD({ ...d, charges: c });
  };
  const addCharge = () => setD({ ...d, charges: [...d.charges, { label: "", montant: "0" }] });
  const removeCharge = (i) => setD({ ...d, charges: d.charges.filter((_, idx) => idx !== i) });

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Btn onClick={onNew} icon={Plus} variant="ghost">Nouveau</Btn>
        <Btn onClick={() => setShowDossiers(!showDossiers)} icon={FolderOpen} variant="ghost">Dossiers ({dossiers.length})</Btn>
        <Btn onClick={onSave} icon={Save} variant="secondary">Sauvegarder</Btn>
        <Btn onClick={() => setExportOpen(true)} icon={FileDown}>Export Word</Btn>
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={onExport}
        defaultTemplate="module"
        currentMissionRef={d.missionRef || ""}
      />

      {showDossiers && (
        <Section title="Dossiers Pertes de pêche">
          {dossiers.length === 0 ? (
            <div className="text-sm italic text-gray-500">Aucun dossier sauvegardé.</div>
          ) : (
            <div className="space-y-2">
              {dossiers.map((dos) => (
                <div key={dos.id} className="flex justify-between items-center p-2 rounded border" style={{ borderColor: "#E5E1D8" }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: NAVY }}>{dos.title}</div>
                    <div className="text-xs text-gray-500">{dos.id} · {new Date(dos.updatedAt).toLocaleString("fr-FR")}</div>
                  </div>
                  <div className="flex gap-1">
                    <Btn onClick={() => onLoad(dos)} size="sm" variant="ghost">Charger</Btn>
                    <Btn onClick={() => onDelete(dos.id)} size="sm" variant="danger" icon={Trash2} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      <Section title="Identification">
        <Field label="Titre du dossier">
          <TextInput value={d.title} onChange={set("title")} />
        </Field>
        <Field label="N° de mission / référence dossier" hint="Repris en en-tête du rapport Word.">
          <TextInput value={d.missionRef || ""} onChange={set("missionRef")} placeholder="ex. SIN-2026-042" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Navire sinistré"><TextInput value={d.navireSinistre} onChange={set("navireSinistre")} /></Field>
          <Field label="Période"><TextInput value={d.periode} onChange={set("periode")} /></Field>
        </div>
        <Field label="Nombre de jours d'arrêt" suffix="j"><NumInput value={d.joursArret} onChange={set("joursArret")} suffix /></Field>
      </Section>

      {/* Étape 1 - Coefficient pondérateur */}
      <Section title="Étape 1 — Coefficient pondérateur (3 navires de référence)">
        <InfoBox>Choisir 3 navires équivalents en tonnage et en prises. Comparer leur CA journalier moyen à celui du navire sinistré.</InfoBox>
        {d.references.map((r, i) => (
          <div key={i} className="mb-3 pb-3 border-b" style={{ borderColor: "#EDE8DC" }}>
            <Field label={`Référence ${String.fromCharCode(65 + i)} — nom du navire`}>
              <TextInput value={r.nom} onChange={(v) => updateRef(i, "nom", v)} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              {r.marees.map((m, j) => (
                <div key={j}>
                  <div className="text-xs font-semibold mb-1" style={{ color: NAVY }}>Marée {j + 1}</div>
                  <NumInput value={m.ca} onChange={(v) => updateRef(i, "ca", v, j)} placeholder="CA €" />
                  <div className="h-1" />
                  <NumInput value={m.j} onChange={(v) => updateRef(i, "j", v, j)} placeholder="Jours" />
                </div>
              ))}
            </div>
            <div className="text-xs mt-2 text-right" style={{ color: NAVY }}>
              Total : {fmtEur(calc.refsDetail[i]?.totalCA)} sur {calc.refsDetail[i]?.totalJours} j → <strong>{fmtEur(calc.refsDetail[i]?.caJournalier)}/jour</strong>
            </div>
          </div>
        ))}
        <div className="text-sm mb-3 p-2 rounded" style={{ background: "#F4F1EA", color: NAVY }}>
          CA journalier moyen de référence : <strong>{fmtEur(calc.caJournalierRefMoy)}/jour</strong>
        </div>

        <div className="text-xs uppercase tracking-wider font-bold mt-4 mb-2" style={{ color: CORAL }}>Navire sinistré (X) — 3 marées de référence</div>
        <div className="grid grid-cols-3 gap-2">
          {d.sinistreMareesRef.map((m, j) => (
            <div key={j}>
              <div className="text-xs font-semibold mb-1" style={{ color: NAVY }}>Marée {j + 1}</div>
              <NumInput value={m.ca} onChange={(v) => updateSinistreMaree(j, "ca", v)} placeholder="CA €" />
              <div className="h-1" />
              <NumInput value={m.j} onChange={(v) => updateSinistreMaree(j, "j", v)} placeholder="Jours" />
            </div>
          ))}
        </div>
        <div className="text-xs mt-2 text-right" style={{ color: NAVY }}>
          Total : {fmtEur(calc.sinistreTotalCA)} sur {calc.sinistreTotalJours} j → <strong>{fmtEur(calc.caJournalierSinistre)}/jour</strong>
        </div>

        <StepRow label="Coefficient pondérateur" formula="CA/j sinistré ÷ CA/j moyen ref" value={calc.coeffPond.toFixed(4)} highlight />
      </Section>

      {/* Étape 2 - Historique 3 ans */}
      <Section title="Étape 2 — CA brut perdu (historique 3 ans)">
        {d.historique.map((an, i) => (
          <div key={i} className="mb-3">
            <div className="text-xs font-bold mb-1" style={{ color: NAVY }}>Année {an.annee}</div>
            <div className="grid grid-cols-3 gap-2">
              {an.marees.map((m, j) => (
                <div key={j}>
                  <div className="text-xs mb-1" style={{ color: NAVY }}>Marée {j + 1}</div>
                  <NumInput value={m.ca} onChange={(v) => updateHist(i, j, "ca", v)} placeholder="CA €" />
                  <div className="h-1" />
                  <NumInput value={m.j} onChange={(v) => updateHist(i, j, "j", v)} placeholder="Jours" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <StepRow label="CA total historique 3 ans" value={fmtEur(calc.caHistTotal)} />
        <StepRow label="Jours totaux historique" value={calc.joursHistTotal + " j"} />
        <StepRow label="CA moyen journalier historique" value={fmtEur(calc.caJourHist) + "/j"} />
        <StepRow label={`× ${calc.joursArret} jours d'arrêt × coeff ${calc.coeffPond.toFixed(4)}`} value={fmtEur(calc.caBrutPerdu)} highlight />
      </Section>

      {/* Étape 3 - Charges */}
      <Section title="Étape 3 — Charges fixes à déduire">
        {d.charges.map((c, i) => (
          <div key={i} className="flex gap-2 mb-2 items-end">
            <div className="flex-1">
              <TextInput value={c.label} onChange={(v) => updateCharge(i, "label", v)} placeholder="Poste" />
            </div>
            <div className="w-32">
              <NumInput value={c.montant} onChange={(v) => updateCharge(i, "montant", v)} placeholder="€" />
            </div>
            <button onClick={() => removeCharge(i)} className="px-2 py-2 text-red-700 hover:bg-red-50 rounded">
              <X size={14} />
            </button>
          </div>
        ))}
        <Btn onClick={addCharge} icon={Plus} size="sm" variant="ghost">Ajouter un poste</Btn>
        <div className="mt-3">
          <Field label="Nombre de jours du calcul de charges" suffix="j" hint="Période sur laquelle les charges sont rapportées (ex. 270 j d'exploitation annuelle).">
            <NumInput value={d.joursCharges} onChange={set("joursCharges")} suffix />
          </Field>
        </div>
        <StepRow label="Total charges retenues" value={fmtEur(calc.totalCharges)} />
        <StepRow label={`÷ ${d.joursCharges} jours = charge journalière`} value={fmtEur(calc.chargeJour) + "/j"} />
        <StepRow label={`× ${calc.joursArret} jours d'arrêt = charges à déduire`} value={fmtEur(calc.chargesDeduire)} highlight />
      </Section>

      {/* Étape 4 - Résultat */}
      <Section title="Étape 4 — Perte de pêche retenue" accent>
        <StepRow label="CA brut perdu" value={fmtEur(calc.caBrutPerdu)} />
        <StepRow label="− Charges à déduire" value={"− " + fmtEur(calc.chargesDeduire)} />
        <StepRow label="Perte de pêche retenue" value={fmtEur(calc.perteRetenue)} highlight />
      </Section>
    </div>
  );
}
