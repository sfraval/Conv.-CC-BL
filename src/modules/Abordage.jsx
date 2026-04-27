import React, { useState, useMemo, useEffect } from "react";
import { Save, FileDown, Trash2, FolderOpen, Plus, X } from "lucide-react";
import { Field, NumInput, TextInput, Section, StepRow, InfoBox, Btn, fmtEur, num, NAVY, CORAL, INK, SAND } from "../components/ui.jsx";
import { saveDossier, loadByType, deleteDossier } from "../lib/storage.js";
import { pdfAbordage, downloadPDF } from "../lib/pdf.js";

// Catalogue des règles RIPAM (COLREG 1972) pertinentes pour l'abordage
const REGLES_RIPAM = [
  { code: "R5", label: "Veille — Visuelle, auditive et par tous moyens disponibles", section: "I" },
  { code: "R6", label: "Vitesse de sécurité", section: "I" },
  { code: "R7", label: "Risque d'abordage — Évaluation appropriée", section: "I" },
  { code: "R8", label: "Manœuvre pour éviter l'abordage", section: "I" },
  { code: "R9", label: "Chenaux étroits", section: "I" },
  { code: "R10", label: "Dispositifs de séparation du trafic", section: "I" },
  { code: "R13", label: "Navire qui en rattrape un autre", section: "II" },
  { code: "R14", label: "Routes directement opposées", section: "II" },
  { code: "R15", label: "Routes qui se croisent", section: "II" },
  { code: "R16", label: "Manœuvre du navire non privilégié", section: "II" },
  { code: "R17", label: "Manœuvre du navire privilégié", section: "II" },
  { code: "R18", label: "Responsabilités réciproques entre navires", section: "II" },
  { code: "R19", label: "Conduite par visibilité réduite", section: "III" },
  { code: "R20-31", label: "Feux et marques (Partie C)", section: "C" },
  { code: "R32-37", label: "Signaux sonores et lumineux", section: "D" },
  { code: "R35", label: "Signaux sonores par visibilité réduite", section: "D" },
];

// Barème par défaut (basé sur l'exemple LA HUNE) - modifiable par dossier
const DEFAULT_DATA = {
  title: "Cas pédagogique abordage",
  navireA: "Navire A",
  navireB: "Navire B",
  dateLieu: "—",
  matA: "0", exploitA: "0", autresA: "0",
  matB: "0", exploitB: "0", autresB: "0",
  regles: [
    { code: "R5", label: "Veille (R5)", actif: true, pointsA: "1", pointsB: "1" },
    { code: "R17", label: "Navire privilégié n'a pas manœuvré (R17)", actif: true, pointsA: "0", pointsB: "2" },
    { code: "R8", label: "Navire entré en collision (R7+R8)", actif: true, pointsA: "0", pointsB: "3" },
  ],
};

export default function Abordage() {
  const [d, setD] = useState(DEFAULT_DATA);
  const [currentId, setCurrentId] = useState(null);
  const [showDossiers, setShowDossiers] = useState(false);
  const [dossiers, setDossiers] = useState([]);
  const [showCatalogue, setShowCatalogue] = useState(false);

  useEffect(() => { setDossiers(loadByType("abordage")); }, [showDossiers]);

  const set = (k) => (v) => setD({ ...d, [k]: v });

  const calc = useMemo(() => {
    const totalA = num(d.matA) + num(d.exploitA) + num(d.autresA);
    const totalB = num(d.matB) + num(d.exploitB) + num(d.autresB);
    const reglesActives = d.regles.filter((r) => r.actif);
    const pointsA = reglesActives.reduce((s, r) => s + num(r.pointsA), 0);
    const pointsB = reglesActives.reduce((s, r) => s + num(r.pointsB), 0);
    const totalPoints = pointsA + pointsB;
    const partA = totalPoints > 0 ? (pointsA / totalPoints) * 100 : 0;
    const partB = totalPoints > 0 ? (pointsB / totalPoints) * 100 : 0;
    // A doit à B : partA % du préjudice de B
    const aDoitB = (partA / 100) * totalB;
    // B doit à A : partB % du préjudice de A
    const bDoitA = (partB / 100) * totalA;
    const solde = aDoitB - bDoitA; // > 0 : A doit à B ; < 0 : B doit à A
    return { totalA, totalB, pointsA, pointsB, totalPoints, partA, partB, aDoitB, bDoitA, solde };
  }, [d]);

  const onSave = () => {
    const saved = saveDossier({ id: currentId, type: "abordage", title: d.title || "Sans titre", data: d });
    setCurrentId(saved.id);
    alert(`Dossier sauvegardé : ${saved.id}`);
  };
  const onLoad = (dos) => { setD(dos.data); setCurrentId(dos.id); setShowDossiers(false); };
  const onNew = () => { setD(DEFAULT_DATA); setCurrentId(null); };
  const onDelete = (id) => {
    if (confirm("Supprimer ce dossier ?")) {
      deleteDossier(id); setDossiers(loadByType("abordage"));
      if (currentId === id) onNew();
    }
  };
  const onPDF = () => {
    const doc = pdfAbordage(d, calc);
    downloadPDF(doc, `LA_HUNE_Abordage_${(d.title || "dossier").replace(/[^a-z0-9]/gi, "_")}.pdf`);
  };

  const updateRegle = (i, key, val) => {
    const r = [...d.regles];
    r[i] = { ...r[i], [key]: val };
    setD({ ...d, regles: r });
  };
  const addRegle = (regleCatalogue = null) => {
    const newRegle = regleCatalogue
      ? { code: regleCatalogue.code, label: `${regleCatalogue.label} (${regleCatalogue.code})`, actif: true, pointsA: "0", pointsB: "0" }
      : { code: "Custom", label: "Manquement", actif: true, pointsA: "0", pointsB: "0" };
    setD({ ...d, regles: [...d.regles, newRegle] });
    setShowCatalogue(false);
  };
  const removeRegle = (i) => setD({ ...d, regles: d.regles.filter((_, idx) => idx !== i) });

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Btn onClick={onNew} icon={Plus} variant="ghost">Nouveau</Btn>
        <Btn onClick={() => setShowDossiers(!showDossiers)} icon={FolderOpen} variant="ghost">Dossiers ({dossiers.length})</Btn>
        <Btn onClick={onSave} icon={Save} variant="secondary">Sauvegarder</Btn>
        <Btn onClick={onPDF} icon={FileDown}>Export PDF</Btn>
      </div>

      {showDossiers && (
        <Section title="Dossiers Abordage">
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
        <Field label="Titre du dossier"><TextInput value={d.title} onChange={set("title")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Navire A"><TextInput value={d.navireA} onChange={set("navireA")} /></Field>
          <Field label="Navire B"><TextInput value={d.navireB} onChange={set("navireB")} /></Field>
        </div>
        <Field label="Date / Lieu" hint="ex. 15-04-2026, 4 NM ouest île Vierge"><TextInput value={d.dateLieu} onChange={set("dateLieu")} /></Field>
      </Section>

      <Section title="Préjudices déclarés">
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <div className="text-xs font-bold uppercase mb-2" style={{ color: NAVY }}>Navire A — {d.navireA}</div>
            <Field label="Dommages matériels" suffix="€"><NumInput value={d.matA} onChange={set("matA")} suffix /></Field>
            <Field label="Perte d'exploitation" suffix="€"><NumInput value={d.exploitA} onChange={set("exploitA")} suffix /></Field>
            <Field label="Autres préjudices" suffix="€"><NumInput value={d.autresA} onChange={set("autresA")} suffix /></Field>
            <div className="text-sm font-bold p-2 rounded" style={{ background: SAND, color: NAVY }}>
              Total A : {fmtEur(calc.totalA)}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase mb-2" style={{ color: NAVY }}>Navire B — {d.navireB}</div>
            <Field label="Dommages matériels" suffix="€"><NumInput value={d.matB} onChange={set("matB")} suffix /></Field>
            <Field label="Perte d'exploitation" suffix="€"><NumInput value={d.exploitB} onChange={set("exploitB")} suffix /></Field>
            <Field label="Autres préjudices" suffix="€"><NumInput value={d.autresB} onChange={set("autresB")} suffix /></Field>
            <div className="text-sm font-bold p-2 rounded" style={{ background: SAND, color: NAVY }}>
              Total B : {fmtEur(calc.totalB)}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Manquements RIPAM (COLREG 1972)">
        <InfoBox>
          <strong>Méthode pédagogique LA HUNE :</strong> attribution de points par règle enfreinte. La part de responsabilité est ensuite calculée au prorata des points. <em>Le partage final reste une décision d'expert ou de juridiction.</em>
          <br /><br />
          <strong>Barème indicatif :</strong> Veille (R5) = 1 pt à chaque navire · Privilégié non manœuvrant = +2 pts · Navire entré en collision = +3 pts.
        </InfoBox>

        {d.regles.map((r, i) => (
          <div key={i} className="mb-3 p-2 rounded border" style={{ borderColor: r.actif ? CORAL : "#E5E1D8", background: r.actif ? "#FFF8F5" : "#F9F8F4" }}>
            <div className="flex items-start gap-2 mb-2">
              <input type="checkbox" checked={r.actif} onChange={(e) => updateRegle(i, "actif", e.target.checked)} className="mt-1" />
              <div className="flex-1">
                <TextInput value={r.label} onChange={(v) => updateRegle(i, "label", v)} />
              </div>
              <button onClick={() => removeRegle(i)} className="px-2 py-1 text-red-700 hover:bg-red-50 rounded">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Points A">
                <NumInput value={r.pointsA} onChange={(v) => updateRegle(i, "pointsA", v)} />
              </Field>
              <Field label="Points B">
                <NumInput value={r.pointsB} onChange={(v) => updateRegle(i, "pointsB", v)} />
              </Field>
            </div>
          </div>
        ))}

        <div className="flex gap-2 flex-wrap">
          <Btn onClick={() => addRegle()} icon={Plus} size="sm" variant="ghost">Manquement libre</Btn>
          <Btn onClick={() => setShowCatalogue(!showCatalogue)} size="sm" variant="ghost">
            {showCatalogue ? "Fermer le catalogue" : "Catalogue RIPAM"}
          </Btn>
        </div>

        {showCatalogue && (
          <div className="mt-3 p-3 rounded border" style={{ borderColor: "#D8DCE6", background: "white" }}>
            <div className="text-xs font-bold uppercase mb-2" style={{ color: NAVY }}>Sélectionner une règle à ajouter</div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {REGLES_RIPAM.map((r) => (
                <button
                  key={r.code}
                  onClick={() => addRegle(r)}
                  className="w-full text-left px-2 py-1 rounded text-xs hover:bg-orange-50 flex items-center gap-2"
                  style={{ color: INK }}
                >
                  <span className="font-bold w-12 flex-shrink-0" style={{ color: CORAL }}>{r.code}</span>
                  <span className="flex-1">{r.label}</span>
                  <span className="text-gray-400">§{r.section}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Partage de responsabilité" accent>
        <StepRow label={`Total points A`} value={calc.pointsA} />
        <StepRow label={`Total points B`} value={calc.pointsB} />
        <StepRow label={`Quote-part A`} value={calc.partA.toFixed(2) + " %"} />
        <StepRow label={`Quote-part B`} value={calc.partB.toFixed(2) + " %"} />

        <div className="text-xs uppercase tracking-wider font-bold mt-4 mb-2" style={{ color: NAVY }}>Calcul des soldes</div>
        <StepRow label={`A doit à B (${calc.partA.toFixed(1)} % × préjudice B)`} value={fmtEur(calc.aDoitB)} />
        <StepRow label={`B doit à A (${calc.partB.toFixed(1)} % × préjudice A)`} value={fmtEur(calc.bDoitA)} />
        <StepRow
          label={
            calc.solde > 0 ? `Solde net : ${d.navireA} doit à ${d.navireB}`
            : calc.solde < 0 ? `Solde net : ${d.navireB} doit à ${d.navireA}`
            : `Compensation parfaite`
          }
          value={fmtEur(Math.abs(calc.solde))}
          highlight
        />
      </Section>

      <Section title="Mémo expert">
        <InfoBox>
          Étapes systématiques de l'expert sur abordage :
          <br />1. Constater les dommages de l'assuré
          <br />2. Constater les dommages et préjudices de l'autre
          <br />3. Évaluer la perte d'exploitation (cf. module Pertes de pêche)
          <br />4. Interpréter le COLREG / RIPAM (règles 5 à 19, plus 35 en visi réduite)
          <br />5. Proposer un partage de responsabilité (jamais 100 % d'un côté en pratique)
        </InfoBox>
      </Section>
    </div>
  );
}
