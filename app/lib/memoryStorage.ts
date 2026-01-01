// app/lib/memoryStorage.ts
// Local “Memory Facts” store for Personality AI POC

export type MemoryFact = {
  id: string;
  fact: string;        // the actual memory line (short + clear)
  tag?: string;        // optional label like "Work", "Family", "Rules"
  createdAt: number;
  updatedAt?: number;
};

const MEMORY_KEY = "poc_memory_facts_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Load memory facts (newest first) */
export function loadMemoryFacts(): MemoryFact[] {
  if (typeof window === "undefined") return [];
  const list = safeParse<MemoryFact[]>(localStorage.getItem(MEMORY_KEY), []);
  if (!Array.isArray(list)) return [];
  return list
    .filter((x) => x && typeof x.fact === "string")
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/** Save full list */
function saveMemoryFacts(list: MemoryFact[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEMORY_KEY, JSON.stringify(list.slice(0, 200))); // hard cap
}

/** Add a new memory fact */
export function addMemoryFact(input: { fact: string; tag?: string }) {
  if (typeof window === "undefined") return;

  const fact = (input.fact || "").trim();
  const tag = (input.tag || "").trim();
  if (!fact) return;

  const existing = loadMemoryFacts();

  const item: MemoryFact = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
    fact: fact.slice(0, 240), // keep prompt-safe
    tag: tag ? tag.slice(0, 40) : undefined,
    createdAt: Date.now(),
  };

  saveMemoryFacts([item, ...existing]);
}

/** Update a memory fact */
export function updateMemoryFact(id: string, updates: { fact?: string; tag?: string }) {
  if (typeof window === "undefined") return;

  const list = loadMemoryFacts();
  const next = list.map((m) => {
    if (m.id !== id) return m;

    const fact = typeof updates.fact === "string" ? updates.fact.trim() : m.fact;
    const tag = typeof updates.tag === "string" ? updates.tag.trim() : (m.tag || "");

    return {
      ...m,
      fact: (fact || "").slice(0, 240),
      tag: tag ? tag.slice(0, 40) : undefined,
      updatedAt: Date.now(),
    };
  });

  saveMemoryFacts(next);
}

/** Delete a memory fact */
export function deleteMemoryFact(id: string) {
  if (typeof window === "undefined") return;
  const list = loadMemoryFacts();
  saveMemoryFacts(list.filter((m) => m.id !== id));
}

/** Clear ALL memory facts */
export function clearMemoryFacts() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MEMORY_KEY);
}

/**
 * Build a compact prompt block to send to /api/ask
 * (Most important 20 facts max)
 */
export function buildMemoryPromptBlock(limit = 20) {
  if (typeof window === "undefined") return "";
  const list = loadMemoryFacts().slice(0, limit);
  if (!list.length) return "";

  const lines = list.map((m) => {
    const tag = (m.tag || "").trim();
    return tag ? `- [${tag}] ${m.fact}` : `- ${m.fact}`;
  });

  return ["MEMORY FACTS (always treat these as true for this persona):", ...lines].join("\n");
}