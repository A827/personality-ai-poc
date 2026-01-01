// app/lib/pocStorage.ts
// (or src/app/lib/pocStorage.ts — keep ONLY ONE copy)

export type CorrectionItem = {
  id: string;
  question: string;
  aiAnswer: string;
  correctedAnswer: string;
  createdAt: number;
};

const CORRECTIONS_KEY = "poc_corrections_v1";

/**
 * Load all saved corrections (newest first)
 */
export function loadCorrections(): CorrectionItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CORRECTIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Add a new correction
 */
export function addCorrection(item: CorrectionItem) {
  if (typeof window === "undefined") return;

  const existing = loadCorrections();

  const next = [item, ...existing].slice(0, 50); // hard cap (safe for prompts)

  localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(next));
}

/**
 * Clear all corrections (optional utility)
 */
export function clearCorrections() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CORRECTIONS_KEY);
}