// Stockage local des dossiers d'expertise
// Structure : { id, type, title, createdAt, updatedAt, data }

const STORAGE_KEY = "lahune.dossiers.v1";

export function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAll(dossiers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dossiers));
    return true;
  } catch {
    return false;
  }
}

export function saveDossier({ id, type, title, data }) {
  const dossiers = loadAll();
  const now = new Date().toISOString();
  if (id) {
    const idx = dossiers.findIndex((d) => d.id === id);
    if (idx >= 0) {
      dossiers[idx] = { ...dossiers[idx], title, data, updatedAt: now };
      saveAll(dossiers);
      return dossiers[idx];
    }
  }
  const newId = "DOS-" + Date.now().toString(36).toUpperCase();
  const dossier = { id: newId, type, title, data, createdAt: now, updatedAt: now };
  dossiers.unshift(dossier);
  saveAll(dossiers);
  return dossier;
}

export function deleteDossier(id) {
  const dossiers = loadAll().filter((d) => d.id !== id);
  saveAll(dossiers);
}

export function loadByType(type) {
  return loadAll().filter((d) => d.type === type);
}

export function exportAll() {
  const dossiers = loadAll();
  const blob = new Blob([JSON.stringify(dossiers, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lahune-dossiers-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Format invalide");
  const existing = loadAll();
  const existingIds = new Set(existing.map((d) => d.id));
  const merged = [...existing];
  for (const d of parsed) {
    if (!existingIds.has(d.id)) merged.push(d);
  }
  saveAll(merged);
  return merged.length - existing.length;
}
