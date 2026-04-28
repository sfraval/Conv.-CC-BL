import React, { useState, useMemo, useEffect } from "react";
import { Save, FileDown, Trash2, FolderOpen, Plus } from "lucide-react";
import { Field, NumInput, TextInput, Select, Section, StepRow, Warn, InfoBox, Btn, ExportModal, fmtEur, num, NAVY, SAND, INK } from "../components/ui.jsx";
import { saveDossier, loadByType, deleteDossier } from "../lib/storage.js";
import { docxConcarneau, downloadDocx } from "../lib/docx.js";

const E_TABLE = [
  { max: 34, coeff: 1.0, label: "< 35 CV" },
  { max: 49, coeff: 1.15, label: "35 à 49 CV" },
  { max: 74, coeff: 1.22, label: "50 à 74 CV" },
  { max: 100, coeff: 1.3, label: "75 à 100 CV" },
  { max: 124, coeff: 1.4, label: "101 à 124 CV" },
  { max: 149, coeff: 1.5, label: "125 à 149 CV" },
  { max: 174, coeff: 1.6, label: "150 à 174 CV" },
  { max: 199, coeff: 1.7, label: "175 à 199 CV" },
  { max: 249, coeff: 1.85, label: "200 à 249 CV" },
  { max: 299, coeff: 2.0, label: "250 à 299 CV" },
  { max: 349, coeff: 2.15, label: "300 à 349 CV" },
  { max: 399, coeff: 2.3, label: "350 à 399 CV" },
  { max: 449, coeff: 2.4, label: "400 à 449 CV" },
  { max: 499, coeff: 2.55, label: "450 à 499 CV" },
  { max: 599, coeff: 2.75, label: "500 à 599 CV" },
  { max: 699, coeff: 3.0, label: "600 à 699 CV" },
  { max: 799, coeff: 3.25, label: "700 à 799 CV" },
  { max: 899, coeff: 3.4, label: "800 à 899 CV" },
];
const getECoeff = (cv) => { for (const r of E_TABLE) if (cv <= r.max) return r; return E_TABLE[E_TABLE.length - 1]; };
const getCCoeff = (j) => {
  const t = { 6: 0.98, 7: 0.94, 8: 0.84, 9: 0.65, 10: 0.30, 11: 0.15, 12: 0.07, 13: 0.03 };
  if (j <= 5) return 1; if (j >= 14) return 0; return t[j] ?? 0;
};
const getBCoeff = (j) => j <= 10 ? 1 : j <= 12 ? 0.95 : 0.9;

const A4_OPTS = [
  { coeff: 1, label: "Temps normal" },
  { coeff: 1.25, label: "Mauvais temps, force 6 à 9" },
  { coeff: 1.75, label: "Gros mauvais temps, > force 9" },
];

const DEFAULT_DATA = {
  title: "Cas pédagogique janvier 2020",
  missionRef: "",
  W: "475", N1: "260", Nrem: "260", a4: "1",
  jours: "3", dureeMaree: "14", dRefuge: "180",
  portEtranger: false, maree4j: false,
  da: "0", db: "0", hAttenteEntree: "0", hAttenteRupture: "0",
  avaries: "1800", immoLong: "0",
  pannesPropulsives: "0", Wassiste: "250", appliquerPlafond: true,
};

export default function Concarneau({ kc }) {
  const [d, setD] = useState(DEFAULT_DATA);
  const [currentId, setCurrentId] = useState(null);
  const [showDossiers, setShowDossiers] = useState(false);
  const [dossiers, setDossiers] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => { setDossiers(loadByType("concarneau")); }, [showDossiers]);

  const set = (k) => (v) => setD({ ...d, [k]: v });

  const calc = useMemo(() => {
    const w = num(d.W), n1 = num(d.N1), nrem = num(d.Nrem);
    const meteoMul = num(d.a4);
    const j = Math.max(1, Math.round(num(d.jours)));
    const dMaree = Math.max(1, num(d.dureeMaree));
    const dRef = num(d.dRefuge);

    const A1 = 0.91 * n1;
    const milles_A2 = Math.min(5, nrem);
    const A2 = 4.57 * milles_A2;
    const milles_A3a = Math.max(0, Math.min(nrem - 5, 45));
    const A3a = 1.22 * milles_A3a;
    const milles_A3b = Math.max(0, Math.min(nrem - 50, 350));
    const A3b = 0.91 * milles_A3b;
    const milles_A3c = Math.max(0, Math.min(nrem - 400, 200));
    const A3c = 0.61 * milles_A3c;
    const milles_A3d = Math.max(0, nrem - 600);
    const A3d = 0.30 * milles_A3d;

    const A23 = A2 + A3a + A3b + A3c + A3d;
    const A23meteo = A23 * meteoMul;
    const A_total = A1 + A23meteo;

    let joursEquiv = j;
    if (dMaree !== 14) joursEquiv = Math.round((j * 14) / dMaree);
    let B = getBCoeff(joursEquiv);
    let C_coeff = d.portEtranger ? (joursEquiv <= 12 ? 1 : 0.8) : getCCoeff(joursEquiv);
    if (d.maree4j) { B = 1; C_coeff = 1; }

    const C_val = 0.61 * dRef * C_coeff;
    const D_a = 38.11 * num(d.da);
    const D_b = 30.49 * num(d.db);
    const D_d_entree = Math.min(3.05 * num(d.hAttenteEntree), 73.18);
    const D_d_rupture = Math.min(6.10 * num(d.hAttenteRupture), 73.18);
    const D_avant = D_d_entree + D_d_rupture;
    const D_apres = D_a + D_b;

    const E = getECoeff(w);
    const apres_C = A_total * B + C_val + D_avant;
    const apres_E = apres_C * E.coeff;
    const apres_Kc = apres_E * kc;
    const apres_cables = apres_Kc * 1.20;
    const indemnite_avant_immo = apres_cables + num(d.avaries) + D_apres + num(d.immoLong);

    let coeffPanne = 1;
    const panneApplicable = w <= 407.6;
    const npp = num(d.pannesPropulsives);
    if (panneApplicable && npp >= 1) {
      coeffPanne = npp === 1 ? 0.90 : npp === 2 ? 0.25 : 0;
    }

    const wAssiste = num(d.Wassiste);
    const isPetit = wAssiste > 0 && wAssiste <= 407.6;
    const indemnite_assistant = indemnite_avant_immo * (panneApplicable ? coeffPanne : 1);
    let part_assureur, part_assure, plafond_un_dixieme;

    if (isPetit && d.appliquerPlafond) {
      plafond_un_dixieme = 850 * kc;
      const reste_assure = Math.min(indemnite_assistant / 10, plafond_un_dixieme);
      part_assureur = indemnite_assistant - reste_assure;
      part_assure = reste_assure;
    } else {
      part_assureur = indemnite_assistant;
      part_assure = 0;
      plafond_un_dixieme = null;
    }

    return {
      A1, A2, milles_A2, A3a, milles_A3a, A3b, milles_A3b, A3c, milles_A3c, A3d, milles_A3d,
      A23, A23meteo, A_total, B, C_coeff, C_val, D_avant, D_apres, D_a, D_b, D_d_entree, D_d_rupture,
      E, joursEquiv, apres_C, apres_E, apres_Kc, apres_cables, indemnite_avant_immo,
      coeffPanne, panneApplicable, indemnite_assistant, part_assureur, part_assure, plafond_un_dixieme, isPetit,
    };
  }, [d, kc]);

  const onSave = () => {
    const saved = saveDossier({ id: currentId, type: "concarneau", title: d.title || "Sans titre", data: { ...d, kc } });
    setCurrentId(saved.id);
    alert(`Dossier sauvegardé : ${saved.id}`);
  };
  const onLoad = (dos) => { setD({ ...DEFAULT_DATA, ...dos.data }); setCurrentId(dos.id); setShowDossiers(false); };
  const onNew = () => { setD(DEFAULT_DATA); setCurrentId(null); };
  const onDelete = (id) => {
    if (confirm("Supprimer ce dossier ?")) {
      deleteDossier(id); setDossiers(loadByType("concarneau"));
      if (currentId === id) onNew();
    }
  };
  const onExport = async ({ template, missionRef, includeConclusions }) => {
    setD({ ...d, missionRef });
    const doc = docxConcarneau({ ...d, kc }, calc, { template, missionRef, includeConclusions });
    await downloadDocx(doc, `LA_HUNE_Concarneau_${(d.title || "dossier").replace(/[^a-z0-9]/gi, "_")}.docx`);
    setExportOpen(false);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Btn onClick={onNew} icon={Plus} variant="ghost">Nouveau</Btn>
        <Btn onClick={() => setShowDossiers(!showDossiers)} icon={FolderOpen} variant="ghost">
          Dossiers ({dossiers.length})
        </Btn>
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
        <Section title="Dossiers Concarneau enregistrés">
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

      <Section title="Identification du dossier">
        <Field label="Titre du dossier" hint={currentId ? `ID actuel : ${currentId}` : "Nouveau dossier (non sauvegardé)"}>
          <TextInput value={d.title} onChange={set("title")} placeholder="ex. Sinistre St-Guénolé / 15-04-2026" />
        </Field>
        <Field label="N° de mission / référence dossier" hint="Repris en en-tête du rapport Word.">
          <TextInput value={d.missionRef || ""} onChange={set("missionRef")} placeholder="ex. SIN-2026-042" />
        </Field>
      </Section>

      <Section title="Identification">
        <Field label="Puissance W de l'assistant" suffix="CV">
          <NumInput value={d.W} onChange={set("W")} suffix />
        </Field>
        <div className="text-xs px-3 py-2 rounded-md inline-block" style={{ background: NAVY, color: "white" }}>
          Coefficient E retenu : <strong>{calc.E.coeff}</strong> ({calc.E.label})
        </div>
        {num(d.W) >= 900 && <Warn>W ≥ 900 CV → hors champ Concarneau.</Warn>}
      </Section>

      <Section title="Distances et météo (poste A)">
        <Field label="Milles déroutement effectif (N1)" suffix="milles">
          <NumInput value={d.N1} onChange={set("N1")} suffix />
        </Field>
        <Field label="Milles à la remorque (total)" suffix="milles" hint="Décomposé automatiquement en tranches A2, A3a, A3b, A3c, A3d.">
          <NumInput value={d.Nrem} onChange={set("Nrem")} suffix />
        </Field>
        <Field label="Coefficient météo A4 (sur A2+A3)">
          <Select value={d.a4} onChange={set("a4")}>
            {A4_OPTS.map((o) => <option key={o.coeff} value={o.coeff}>{o.label} — {o.coeff}</option>)}
          </Select>
        </Field>
      </Section>

      <Section title="Marée et coefficients B / C">
        <Field label="Jours écoulés depuis début marée" suffix="j">
          <NumInput value={d.jours} onChange={set("jours")} suffix />
        </Field>
        <Field label="Durée moyenne des marées de référence" suffix="j" hint="Si différent de 14 j, ajustement automatique.">
          <NumInput value={d.dureeMaree} onChange={set("dureeMaree")} suffix />
        </Field>
        {num(d.dureeMaree) !== 14 && (
          <InfoBox>Durée ≠ 14 j → jours équivalents : <strong>{calc.joursEquiv} j</strong>.</InfoBox>
        )}
        <label className="flex items-center gap-2 my-2 text-sm" style={{ color: INK }}>
          <input type="checkbox" checked={d.maree4j} onChange={(e) => set("maree4j")(e.target.checked)} />
          Marée moyenne ≤ 4 jours (B et C forcés à 1)
        </label>
        <Field label="Distance port refuge / point quitté" suffix="milles">
          <NumInput value={d.dRefuge} onChange={set("dRefuge")} suffix />
        </Field>
        <label className="flex items-center gap-2 my-2 text-sm" style={{ color: INK }}>
          <input type="checkbox" checked={d.portEtranger} onChange={(e) => set("portEtranger")(e.target.checked)} />
          Port étranger au Quartier (C : 1 si ≤ 12 j, 0,80 sinon)
        </label>
        <div className="text-xs mt-2 px-3 py-2 rounded-md" style={{ background: SAND, color: NAVY }}>
          B = <strong>{calc.B}</strong> · C jours = <strong>{calc.C_coeff}</strong>
        </div>
      </Section>

      <Section title="Indemnités D">
        <Field label="½ journées immobilisation (premières 24 h)" suffix="½j" hint="38,11 € chacune.">
          <NumInput value={d.da} onChange={set("da")} suffix />
        </Field>
        <Field label="½ journées immobilisation (jours suivants)" suffix="½j" hint="30,49 € chacune.">
          <NumInput value={d.db} onChange={set("db")} suffix />
        </Field>
        <Field label="Heures attente en mer (entrée port)" suffix="h" hint="3,05 €/h, plafond 73,18 €.">
          <NumInput value={d.hAttenteEntree} onChange={set("hAttenteEntree")} suffix />
        </Field>
        <Field label="Heures attente en mer (rupture)" suffix="h" hint="6,10 €/h, plafond 73,18 €.">
          <NumInput value={d.hAttenteRupture} onChange={set("hAttenteRupture")} suffix />
        </Field>
      </Section>

      <Section title="Avaries et immobilisation longue">
        <Field label="Avaries assistant" suffix="€">
          <NumInput value={d.avaries} onChange={set("avaries")} suffix />
        </Field>
        <Field label="Immobilisation > 7 jours" suffix="€">
          <NumInput value={d.immoLong} onChange={set("immoLong")} suffix />
        </Field>
      </Section>

      {calc.panneApplicable && (
        <Section title="Pannes propulsives (W ≤ 300 kW)">
          <Field label="Rang de la panne" hint="1ère = 90 %, 2e = 25 %, 3e+ = 0 %.">
            <Select value={d.pannesPropulsives} onChange={set("pannesPropulsives")}>
              <option value="0">Aucune</option>
              <option value="1">1ère panne — 90 %</option>
              <option value="2">2e panne — 25 %</option>
              <option value="3">3e ou + — non indemnisée</option>
            </Select>
          </Field>
        </Section>
      )}

      <Section title="Calcul détaillé" accent>
        <div className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: NAVY }}>Indemnité de base A</div>
        <StepRow label={`A1 — déroutement (${num(d.N1)} × 0,91)`} value={fmtEur(calc.A1)} />
        <StepRow label={`A2 — ${calc.milles_A2} milles × 4,57`} value={fmtEur(calc.A2)} />
        <StepRow label={`A3a — ${calc.milles_A3a} milles × 1,22`} value={fmtEur(calc.A3a)} />
        <StepRow label={`A3b — ${calc.milles_A3b} milles × 0,91`} value={fmtEur(calc.A3b)} />
        <StepRow label={`A3c — ${calc.milles_A3c} milles × 0,61`} value={fmtEur(calc.A3c)} />
        <StepRow label={`A3d — ${calc.milles_A3d} milles × 0,30`} value={fmtEur(calc.A3d)} />
        <StepRow label={`(A2+A3) × A4 (${num(d.a4)})`} value={fmtEur(calc.A23meteo)} />
        <StepRow label="A retenu" value={fmtEur(calc.A_total)} />

        <div className="text-xs uppercase tracking-wider font-bold mt-4 mb-2" style={{ color: NAVY }}>Séquence article III</div>
        <StepRow label={`A × B (${calc.B})`} value={fmtEur(calc.A_total * calc.B)} />
        <StepRow label={`+ C (0,61 × ${num(d.dRefuge)} × ${calc.C_coeff})`} value={fmtEur(calc.C_val)} />
        <StepRow label={`+ D attente`} value={fmtEur(calc.D_avant)} />
        <StepRow label={`× E (${calc.E.coeff})`} value={fmtEur(calc.apres_E)} />
        <StepRow label={`× Kc (${kc})`} value={fmtEur(calc.apres_Kc)} />
        <StepRow label="× 1,20 (câbles)" value={fmtEur(calc.apres_cables)} />
        <StepRow label="+ Avaries" value={fmtEur(num(d.avaries))} />
        <StepRow label="+ D immo port" value={fmtEur(calc.D_apres)} />
        <StepRow label="+ Immo > 7 j" value={fmtEur(num(d.immoLong))} />
        <StepRow label="Indemnité d'assistance" value={fmtEur(calc.indemnite_avant_immo)} highlight />

        {calc.panneApplicable && calc.coeffPanne !== 1 && (
          <StepRow label={`× coeff panne (${calc.coeffPanne})`} value={fmtEur(calc.indemnite_assistant)} highlight />
        )}
      </Section>

      <Section title="Prise en charge assureur Corps">
        <Field label="Puissance du navire ASSISTÉ" suffix="CV" hint="Détermine la règle de prise en charge (seuil 300 kW = 407,6 CV).">
          <NumInput value={d.Wassiste} onChange={set("Wassiste")} suffix />
        </Field>
        {calc.isPetit ? (
          <>
            <InfoBox>Assisté ≤ 300 kW → 9/10 avec plafond 850 × Kc.</InfoBox>
            <label className="flex items-center gap-2 mb-3 text-sm" style={{ color: INK }}>
              <input type="checkbox" checked={d.appliquerPlafond} onChange={(e) => set("appliquerPlafond")(e.target.checked)} />
              Appliquer le 9/10 + plafond
            </label>
            <StepRow label="Plafond 1/10 = 850 × Kc" value={fmtEur(calc.plafond_un_dixieme)} />
            <StepRow label="Part assuré (1/10 plafonné)" value={fmtEur(calc.part_assure)} />
            <StepRow label="Part assureur" value={fmtEur(calc.part_assureur)} highlight />
          </>
        ) : (
          <>
            <InfoBox>Assisté &gt; 300 kW → remboursement intégral 10/10.</InfoBox>
            <StepRow label="Remboursement assureur" value={fmtEur(calc.part_assureur)} highlight />
          </>
        )}
      </Section>
    </div>
  );
}
