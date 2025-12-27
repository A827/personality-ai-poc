export type Correction = {
  id: string;
  question: string;
  aiAnswer: string;
  correctedAnswer: string;
  createdAt: number;
};

const CORRECTIONS_KEY = "poc_corrections_v1";

export function loadCorrections(): Correction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CORRECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCorrections(items: Correction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(items));
}

export function addCorrection(c: Correction) {
  const existing = loadCorrections();
  saveCorrections([c, ...existing]);
}