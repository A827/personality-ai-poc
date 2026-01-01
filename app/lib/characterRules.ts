// app/lib/characterRules.ts

const RULES_KEY = "poc_character_rules_v1";

export function loadCharacterRules(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RULES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCharacterRules(rules: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RULES_KEY, JSON.stringify(rules.slice(0, 12)));
}

export function addCharacterRule(rule: string) {
  if (typeof window === "undefined") return;
  const existing = loadCharacterRules();
  const cleaned = rule.trim();
  if (!cleaned) return;

  const next = [cleaned, ...existing.filter(r => r !== cleaned)];
  localStorage.setItem(RULES_KEY, JSON.stringify(next.slice(0, 12)));
}

export function clearCharacterRules() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RULES_KEY);
}