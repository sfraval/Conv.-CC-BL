import React, { useState, useEffect } from "react";
import { Anchor, LifeBuoy, Fish, AlertTriangle, Database, Download, Upload } from "lucide-react";
import { CORAL, NAVY, SAND, INK, Field, NumInput, Section, Btn } from "./components/ui.jsx";
import { exportAll, importFromFile, loadAll } from "./lib/storage.js";

import Boulogne from "./modules/Boulogne.jsx";
import Concarneau from "./modules/Concarneau.jsx";
import PertesPeche from "./modules/PertesPeche.jsx";
import Abordage from "./modules/Abordage.jsx";

const PRESETS_K = {
  "2020": { kb: 4.05, kc: 8.44 },
  "2023": { kb: 4.40, kc: 9.06 },
  "custom": { kb: 4.40, kc: 9.06 },
};

const MODULES = [
  { id: "boulogne", label: "Boulogne", subtitle: "W > 700 CV", icon: LifeBuoy, color: CORAL },
  { id: "concarneau", label: "Concarneau", subtitle: "W < 900 CV", icon: LifeBuoy, color: CORAL },
  { id: "pertes", label: "Pertes de pêche", subtitle: "Méthode 4 étapes", icon: Fish, color: NAVY },
  { id: "abordage", label: "Abordage", subtitle: "RIPAM / COLREG", icon: AlertTriangle, color: NAVY },
];

export default function App() {
  const [module, setModule] = useState("boulogne");
  const [yearPreset, setYearPreset] = useState("2020");
  const [kb, setKb] = useState(PRESETS_K["2020"].kb);
  const [kc, setKc] = useState(PRESETS_K["2020"].kc);
  const [showSettings, setShowSettings] = useState(false);
  const [totalDossiers, setTotalDossiers] = useState(0);

  useEffect(() => {
    setTotalDossiers(loadAll().length);
  }, [module, showSettings]);

  const onPresetChange = (y) => {
    setYearPreset(y);
    if (y !== "custom") {
      setKb(PRESETS_K[y].kb);
      setKc(PRESETS_K[y].kc);
    }
  };

  const onImport = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const n = await importFromFile(f);
      alert(`${n} dossier(s) importé(s).`);
      setTotalDossiers(loadAll().length);
    } catch (err) {
      alert("Erreur d'import : " + err.message);
    }
    e.target.value = "";
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: SAND, color: INK, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header LA HUNE */}
      <header className="px-4 py-5 mb-4" style={{ background: NAVY, color: "white" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <Anchor size={20} style={{ color: CORAL }} />
              <div className="text-xs uppercase tracking-widest opacity-80">LA HUNE.</div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs px-2 py-1 rounded border border-white/30 hover:bg-white/10"
            >
              <Database size={12} className="inline mr-1" />
              {totalDossiers} dossier(s)
            </button>
          </div>
          <h1 className="text-xl font-bold leading-tight">Boîte à outils expert pêche</h1>
          <p className="text-xs opacity-80 mt-1">Conventions, pertes de pêche, partage de responsabilité</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        {/* Settings panel */}
        {showSettings && (
          <Section title="Paramètres globaux">
            <div className="text-xs uppercase font-bold mb-2" style={{ color: NAVY }}>Coefficients d'indexation</div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {["2020", "2023", "custom"].map((y) => (
                <button
                  key={y}
                  onClick={() => onPresetChange(y)}
                  className="px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    background: yearPreset === y ? NAVY : "white",
                    color: yearPreset === y ? "white" : NAVY,
                    borderColor: NAVY,
                  }}
                >
                  {y === "custom" ? "Personnalisé" : y}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Field label="Kb (Boulogne)">
                <NumInput value={kb} onChange={(v) => { setKb(parseFloat(v) || 0); setYearPreset("custom"); }} step="0.01" />
              </Field>
              <Field label="Kc (Concarneau)">
                <NumInput value={kc} onChange={(v) => { setKc(parseFloat(v) || 0); setYearPreset("custom"); }} step="0.01" />
              </Field>
            </div>

            <div className="text-xs uppercase font-bold mb-2 mt-4" style={{ color: NAVY }}>Sauvegarde</div>
            <div className="flex gap-2 flex-wrap">
              <Btn onClick={exportAll} icon={Download} variant="secondary" size="sm">
                Exporter tous les dossiers (JSON)
              </Btn>
              <label className="px-3 py-2 text-sm rounded-md font-semibold flex items-center gap-2 cursor-pointer border" style={{ borderColor: NAVY, color: NAVY, background: "white" }}>
                <Upload size={14} />
                Importer
                <input type="file" accept=".json" onChange={onImport} className="hidden" />
              </label>
            </div>
            <div className="text-xs italic mt-2" style={{ color: "#6B7280" }}>
              Sauvegarde locale dans le navigateur. Pour transférer entre appareils ou sécuriser, utiliser l'export JSON.
            </div>
          </Section>
        )}

        {/* Sélection du module */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const active = module === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setModule(m.id)}
                className="px-3 py-3 rounded-lg border-2 text-left transition"
                style={{
                  borderColor: active ? CORAL : "#D8DCE6",
                  background: active ? "#FFF8F5" : "white",
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} style={{ color: m.color }} />
                  <span className="font-bold text-sm" style={{ color: NAVY }}>{m.label}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: "#6B7280" }}>{m.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* Module actif */}
        {module === "boulogne" && <Boulogne kb={kb} />}
        {module === "concarneau" && <Concarneau kc={kc} />}
        {module === "pertes" && <PertesPeche />}
        {module === "abordage" && <Abordage />}

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t text-xs" style={{ borderColor: "#E5E1D8", color: "#6B7280" }}>
          <div className="font-bold mb-1" style={{ color: NAVY }}>LA HUNE.</div>
          <div>Cabinet d'expertise maritime indépendant · Landéda, Finistère</div>
          <div className="mt-2 italic">
            Outil interne d'aide au calcul. À vérifier contre les conditions particulières de la police et la convention en vigueur.
          </div>
        </div>
      </main>
    </div>
  );
}
