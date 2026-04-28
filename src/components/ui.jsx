import React from "react";
import { AlertTriangle, Info } from "lucide-react";

export const CORAL = "#E85B3A";
export const NAVY = "#1C2E5C";
export const NAVY_LIGHT = "#2A4178";
export const SAND = "#FAF7F2";
export const INK = "#0F1B33";

export const fmt = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};
export const fmtEur = (n) => fmt(n) + " €";
export const fmt0 = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
};
export const num = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  const x = parseFloat(String(v).replace(",", "."));
  return Number.isNaN(x) ? 0 : x;
};

export const Field = ({ label, hint, children, suffix }) => (
  <label className="block mb-3">
    <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: NAVY }}>
      {label}
    </div>
    <div className="flex items-stretch">
      {children}
      {suffix && (
        <span
          className="px-3 flex items-center text-sm border border-l-0 rounded-r-md"
          style={{ borderColor: "#D8DCE6", background: "#F4F1EA", color: NAVY }}
        >
          {suffix}
        </span>
      )}
    </div>
    {hint && <div className="text-xs mt-1 italic" style={{ color: "#6B7280" }}>{hint}</div>}
  </label>
);

export const NumInput = ({ value, onChange, step = "any", placeholder, suffix }) => (
  <input
    type="number"
    inputMode="decimal"
    step={step}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-3 py-2 border bg-white outline-none focus:ring-2 ${suffix ? "rounded-l-md border-r-0" : "rounded-md"}`}
    style={{ borderColor: "#D8DCE6", color: INK }}
  />
);

export const TextInput = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2 border rounded-md bg-white outline-none focus:ring-2"
    style={{ borderColor: "#D8DCE6", color: INK }}
  />
);

export const Select = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2 border rounded-md bg-white outline-none"
    style={{ borderColor: "#D8DCE6", color: INK }}
  >
    {children}
  </select>
);

export const Section = ({ title, children, accent = false }) => (
  <div
    className="rounded-lg border p-4 mb-4"
    style={{ borderColor: accent ? CORAL : "#E5E1D8", background: accent ? "#FFF8F5" : "white" }}
  >
    {title && (
      <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b" style={{ color: NAVY, borderColor: "#EDE8DC" }}>
        {title}
      </h3>
    )}
    {children}
  </div>
);

export const StepRow = ({ label, formula, value, highlight = false }) => (
  <div className={`flex justify-between items-baseline py-2 ${highlight ? "border-t-2 mt-2 pt-3" : "border-b"}`} style={{ borderColor: highlight ? NAVY : "#EDE8DC" }}>
    <div className="flex-1">
      <div className={`text-sm ${highlight ? "font-bold" : "font-medium"}`} style={{ color: highlight ? NAVY : INK }}>
        {label}
      </div>
      {formula && <div className="text-xs italic" style={{ color: "#7A8398" }}>{formula}</div>}
    </div>
    <div className={`tabular-nums ml-3 ${highlight ? "text-lg font-bold" : "text-sm font-semibold"}`} style={{ color: highlight ? CORAL : NAVY }}>
      {value}
    </div>
  </div>
);

export const Warn = ({ children }) => (
  <div className="flex gap-2 p-3 rounded-md border my-3" style={{ borderColor: "#F6C07A", background: "#FFF8EE", color: "#7A4A00" }}>
    <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
    <div className="text-xs">{children}</div>
  </div>
);

export const InfoBox = ({ children }) => (
  <div className="flex gap-2 p-3 rounded-md border my-3" style={{ borderColor: "#BFD4F0", background: "#F2F7FF", color: NAVY }}>
    <Info className="flex-shrink-0 mt-0.5" size={16} />
    <div className="text-xs">{children}</div>
  </div>
);

export const Btn = ({ onClick, children, variant = "primary", icon: Icon, size = "md" }) => {
  const styles = {
    primary: { background: CORAL, color: "white", border: "none" },
    secondary: { background: "white", color: NAVY, border: `1px solid ${NAVY}` },
    ghost: { background: "transparent", color: NAVY, border: "1px solid #D8DCE6" },
    danger: { background: "white", color: "#B91C1C", border: "1px solid #B91C1C" },
  };
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2 text-sm",
  };
  return (
    <button
      onClick={onClick}
      className={`${sizes[size]} rounded-md font-semibold flex items-center gap-2 transition active:scale-95`}
      style={styles[variant]}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Modale d'export Word — choix du template
// ═══════════════════════════════════════════════════════════════════════════

export function ExportModal({ open, onClose, onExport, defaultTemplate = "module", currentMissionRef = "" }) {
  const [template, setTemplate] = React.useState(defaultTemplate);
  const [missionRef, setMissionRef] = React.useState(currentMissionRef);
  const [includeConclusions, setIncludeConclusions] = React.useState(true);

  React.useEffect(() => {
    if (open) {
      setTemplate(defaultTemplate);
      setMissionRef(currentMissionRef);
    }
  }, [open, defaultTemplate, currentMissionRef]);

  if (!open) return null;

  const TEMPLATES = [
    { id: "module", label: "Rapport adapté au module", desc: "Mise en forme standard pour le module en cours" },
    { id: "note", label: "Note technique générique", desc: "Format neutre, mise en page sobre" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 27, 51, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl"
        style={{ borderTop: `4px solid ${CORAL}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold mb-4 uppercase tracking-wider" style={{ color: NAVY }}>
          Export Word — paramètres
        </h3>

        <Field label="Numéro de mission / référence dossier" hint="Affiché en en-tête du rapport. Optionnel.">
          <TextInput value={missionRef} onChange={setMissionRef} placeholder="ex. SIN-2026-042" />
        </Field>

        <div className="text-xs font-semibold uppercase tracking-wider mb-2 mt-3" style={{ color: NAVY }}>
          Modèle
        </div>
        <div className="space-y-2 mb-4">
          {TEMPLATES.map((t) => (
            <label
              key={t.id}
              className="flex items-start gap-2 p-2 rounded border cursor-pointer transition"
              style={{
                borderColor: template === t.id ? CORAL : "#D8DCE6",
                background: template === t.id ? "#FFF8F5" : "white",
              }}
            >
              <input
                type="radio"
                checked={template === t.id}
                onChange={() => setTemplate(t.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: NAVY }}>{t.label}</div>
                <div className="text-xs" style={{ color: "#6B7280" }}>{t.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <label className="flex items-center gap-2 mb-4 text-sm" style={{ color: INK }}>
          <input
            type="checkbox"
            checked={includeConclusions}
            onChange={(e) => setIncludeConclusions(e.target.checked)}
          />
          Inclure le bloc « Conclusions et observations » (lignes vides à compléter)
        </label>

        <div className="flex gap-2 justify-end pt-3 border-t" style={{ borderColor: "#EDE8DC" }}>
          <Btn onClick={onClose} variant="ghost">Annuler</Btn>
          <Btn onClick={() => onExport({ template, missionRef, includeConclusions })}>
            Générer le rapport
          </Btn>
        </div>
      </div>
    </div>
  );
}
