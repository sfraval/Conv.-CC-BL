import React, { useState, useMemo, useEffect } from "react";
import { Save, FileDown, Trash2, FolderOpen, Plus } from "lucide-react";
import { Field, NumInput, TextInput, Select, Section, StepRow, Warn, InfoBox, Btn, ExportModal, fmtEur, num, NAVY, CORAL } from "../components/ui.jsx";
import { saveDossier, loadByType, deleteDossier } from "../lib/storage.js";
import { docxBoulogne, downloadDocx } from "../lib/docx.js";

const M_BOULOGNE = [
  { coeff: 1, label: "Forces 0-2 — calme à mer belle" },
  { coeff: 1, label: "Force 3 — petite brise" },
  { coeff: 1, label: "Force 4 — jolie brise" },
  { coeff: 1.3, label: "Force 5 — bonne brise, mer agitée" },
  { coeff: 1.3, label: "Force 6 — vent frais, mer forte" },
  { coeff: 1.75, label: "Force 7 — grand frais" },
  { coeff: 1.75, label: "Force 8 — coup de vent" },
  { coeff: 2.2, label: "Force 9 — fort coup de vent" },
  { coeff: 3, label: "Force 10 et + — tempête" },
  { coeff: 1.3, label: "Brume épaisse par temps calme" },
];

const DEFAULT_DATA = {
  title: "Cas pédagogique janvier 2020",
  missionRef: "",
  W: "700", V: "18000", H: "72", A: "72", R: "0", p: "0.8",
  drReel: "8", m: "1.3", avaries: "6000", immo: "3000",
};

export default function Boulogne({ kb }) {
  const [d, setD] = useState(DEFAULT_DATA);
  const [currentId, setCurrentId] = useState(null);
  const [showDossiers, setShowDossiers] = useState(false);
  const [dossiers, setDossiers] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => { setDossiers(loadByType("boulogne")); }, [showDossiers]);

  const set = (k) => (v) => setD({ ...d, [k]: v });

  const calc = useMemo(() => {
    const w = num(d.W), v = num(d.V), h = num(d.H), aa = num(d.A), rr = num(d.R);
    const pp = Math.min(num(d.p), 1);
    const drR = num(d.drReel);
    const dr = Math.max(drR, 12);
    const mm = num(d.m);

    const Q = h > 0 ? v / h : 0;
    const T = aa + rr - 2 * pp * rr;
    const X = Q * T;

    let I = 0;
    if (w > 0) I = (w / 100) * ((8.5 * w + 16475) / (w + 350)) * kb * (1 / 6.55957);
    const Y = I * dr * mm;

    const remorque = 0.25 * Y;
    const Z = num(d.avaries) + remorque + num(d.immo);
    const total = X + Y + Z;
    return { Q, T, X, I, Y, dr, drReel: drR, drForcee: drR < 12, remorque, Z, total };
  }, [d, kb]);

  const onSave = () => {
    const saved = saveDossier({ id: currentId, type: "boulogne", title: d.title || "Sans titre", data: { ...d, kb } });
    setCurrentId(saved.id);
    alert(`Dossier sauvegardé : ${saved.id}`);
  };

  const onLoad = (dossier) => {
    setD({ ...DEFAULT_DATA, ...dossier.data });
    setCurrentId(dossier.id);
    setShowDossiers(false);
  };

  const onNew = () => { setD(DEFAULT_DATA); setCurrentId(null); };

  const onDelete = (id) => {
    if (confirm("Supprimer ce dossier ?")) {
      deleteDossier(id);
      setDossiers(loadByType("boulogne"));
      if (currentId === id) onNew();
    }
  };

  const onExport = async ({ template, missionRef, includeConclusions }) => {
    setD({ ...d, missionRef });
    const doc = docxBoulogne({ ...d, kb }, calc, { template, missionRef, includeConclusions });
    await downloadDocx(doc, `LA_HUNE_Boulogne_${(d.title || "dossier").replace(/[^a-z0-9]/gi, "_")}.docx`);
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
        <Section title="Dossiers Boulogne enregistrés">
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
          <TextInput value={d.title} onChange={set("title")} placeholder="ex. Sinistre Le Goëlec / 12-03-2026" />
        </Field>
        <Field label="N° de mission / référence dossier" hint="Repris en en-tête du rapport Word.">
          <TextInput value={d.missionRef || ""} onChange={set("missionRef")} placeholder="ex. SIN-2026-042" />
        </Field>
      </Section>

      <Section title="Identification du navire">
        <Field label="Puissance W de l'assistant" suffix="CV" hint="Boulogne s'applique si W > 700 CV (515,2 kW). 1 CV = 0,736 kW.">
          <NumInput value={d.W} onChange={set("W")} suffix />
        </Field>
        {num(d.W) > 0 && num(d.W) <= 700 && (
          <Warn>W = {d.W} CV ≤ 700 → <strong>hors champ Boulogne</strong>. Convention applicable : Concarneau.</Warn>
        )}
        {num(d.W) > 700 && num(d.W) < 900 && (
          <InfoBox>Zone grise 700–899 CV : on retient toujours la convention souscrite par l'assistant.</InfoBox>
        )}
      </Section>

      <Section title="Poste X — Compensation perte de pêche">
        <Field label="V — Produit brut des ventes de référence" suffix="€" hint="Trois marées encadrant l'événement, ou 60 j centrés. À défaut, 20 j sur navires similaires.">
          <NumInput value={d.V} onChange={set("V")} suffix />
        </Field>
        <Field label="H — Heures sur lieux de pêche" suffix="h">
          <NumInput value={d.H} onChange={set("H")} suffix />
        </Field>
        <Field label="A — Heures d'interruption" suffix="h" hint="Du moment où l'assistant quitte sa pêche jusqu'au retour sur lieux de pêche ou au port de vente.">
          <NumInput value={d.A} onChange={set("A")} suffix />
        </Field>
        <Field label="R — Trajet direct théorique" suffix="h" hint="0 si l'assistant retourne sur les lieux de pêche.">
          <NumInput value={d.R} onChange={set("R")} suffix />
        </Field>
        <Field label="p — Rapport durée marée évènement / moyenne" hint="Plafonné à 1.">
          <NumInput value={d.p} onChange={set("p")} step="0.01" />
        </Field>
      </Section>

      <Section title="Poste Y — Service rendu">
        <Field label="Durée réelle du remorquage" suffix="h" hint="Minimum fictif de 12 h appliqué automatiquement si inférieur.">
          <NumInput value={d.drReel} onChange={set("drReel")} suffix />
        </Field>
        {calc.drForcee && (
          <InfoBox>{calc.drReel} h &lt; 12 h → application du <strong>minimum fictif de 12 h</strong>.</InfoBox>
        )}
        <Field label="Coefficient météo m">
          <Select value={d.m} onChange={set("m")}>
            {M_BOULOGNE.map((opt) => (
              <option key={opt.label} value={opt.coeff}>{opt.label} — m = {opt.coeff}</option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Poste Z — Dommages de l'assistant">
        <Field label="Avaries constatées contradictoirement" suffix="€">
          <NumInput value={d.avaries} onChange={set("avaries")} suffix />
        </Field>
        <Field label="Indemnité d'immobilisation" suffix="€" hint="Perte d'exploitation nette : ventes navires similaires moins frais non exposés (forfait 30 %) plus salaires économisés.">
          <NumInput value={d.immo} onChange={set("immo")} suffix />
        </Field>
        <InfoBox>La <strong>détérioration de remorque</strong> est calculée automatiquement à 25 % de Y.</InfoBox>
      </Section>

      <Section title="Calcul détaillé" accent>
        <div className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: NAVY }}>Poste X</div>
        <StepRow label="Q = V / H" formula={`${d.V} / ${d.H}`} value={fmtEur(calc.Q) + "/h"} />
        <StepRow label="T = A + R − 2 × p × R" value={calc.T + " h"} />
        <StepRow label="X = Q × T" value={fmtEur(calc.X)} />

        <div className="text-xs uppercase tracking-wider font-bold mt-4 mb-2" style={{ color: NAVY }}>Poste Y</div>
        <StepRow label="I (€/h)" formula={`Kb = ${kb}`} value={fmtEur(calc.I) + "/h"} />
        <StepRow label="Y = I × dr × m" formula={`× ${calc.dr} × ${d.m}`} value={fmtEur(calc.Y)} />

        <div className="text-xs uppercase tracking-wider font-bold mt-4 mb-2" style={{ color: NAVY }}>Poste Z</div>
        <StepRow label="Avaries" value={fmtEur(num(d.avaries))} />
        <StepRow label="Détérioration remorque (25 % de Y)" value={fmtEur(calc.remorque)} />
        <StepRow label="Immobilisation" value={fmtEur(num(d.immo))} />
        <StepRow label="Z" value={fmtEur(calc.Z)} />

        <StepRow label="Indemnité = X + Y + Z" value={fmtEur(calc.total)} highlight />
      </Section>

      <Section title="Prise en charge assureur Corps">
        <StepRow label="Remboursement à l'assuré (10/10)" value={fmtEur(calc.total)} highlight />
      </Section>
    </div>
  );
}
