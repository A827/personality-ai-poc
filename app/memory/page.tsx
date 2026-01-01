// app/memory/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMemoryFact,
  buildMemoryPromptBlock,
  clearMemoryFacts,
  deleteMemoryFact,
  loadMemoryFacts,
  updateMemoryFact,
  type MemoryFact,
} from "../lib/memoryStorage";

function fmtDate(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function MemoryPage() {
  const [loaded, setLoaded] = useState(false);
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [factText, setFactText] = useState("");
  const [tagText, setTagText] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingFact, setEditingFact] = useState("");
  const [editingTag, setEditingTag] = useState("");

  const [search, setSearch] = useState("");

  function refresh() {
    setFacts(loadMemoryFacts());
  }

  useEffect(() => {
    refresh();
    setLoaded(true);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return facts;

    return facts.filter((m) => {
      const a = (m.fact || "").toLowerCase();
      const b = (m.tag || "").toLowerCase();
      return a.includes(q) || b.includes(q);
    });
  }, [facts, search]);

  const promptPreview = useMemo(() => {
    if (!loaded) return "";
    return buildMemoryPromptBlock(20);
  }, [loaded, facts.length]);

  function onAdd() {
    const fact = factText.trim();
    const tag = tagText.trim();
    if (!fact) return;

    addMemoryFact({ fact, tag: tag || undefined });
    setFactText("");
    setTagText("");
    refresh();
  }

  function startEdit(m: MemoryFact) {
    setEditingId(m.id);
    setEditingFact(m.fact || "");
    setEditingTag(m.tag || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingFact("");
    setEditingTag("");
  }

  function saveEdit() {
    if (!editingId) return;
    const fact = editingFact.trim();
    const tag = editingTag.trim();

    if (!fact) return;

    updateMemoryFact(editingId, { fact, tag });
    cancelEdit();
    refresh();
  }

  function remove(id: string) {
    if (!confirm("Delete this memory fact?")) return;
    deleteMemoryFact(id);
    refresh();
  }

  function clearAll() {
    if (!confirm("Clear ALL memory facts? This cannot be undone.")) return;
    clearMemoryFacts();
    refresh();
  }

  return (
    <main className="ds-page">
      <div className="ds-shell">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <a
            href="/"
            style={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "rgb(var(--text))",
              textDecoration: "none",
            }}
          >
            Personality AI
          </a>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/persona" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Account
            </a>
            <a href="/interview" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Interview
            </a>
            <a href="/connections" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Connections
            </a>
            <a href="/ask" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Ask
            </a>
            <a href="/profile" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Profile
            </a>
            <a href="/memory" style={{ fontSize: 13, color: "rgb(var(--text))", fontWeight: 600 }}>
              Memory
            </a>
          </div>
        </div>

        <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 className="ds-h1">Memory</h1>
          <p className="ds-subtitle">
            Save stable facts that the AI should treat as true (e.g., “I hate meetings before 10am”).
          </p>
        </header>

        {/* Add */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Add a Memory Fact</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 10 }}>
            <input
              className="ds-input"
              value={factText}
              onChange={(e) => setFactText(e.target.value)}
              placeholder='Example: "I prefer direct answers and bullet points."'
            />
            <input
              className="ds-input"
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="Tag (optional)"
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="ds-btn ds-btn-primary" onClick={onAdd}>
              Add
            </button>
            <button className="ds-btn" onClick={clearAll} disabled={!facts.length}>
              Clear all
            </button>
          </div>

          <div className="ds-subtitle" style={{ fontSize: 12 }}>
            Tip: keep facts short. We’ll inject up to 20 into the AI prompt.
          </div>
        </div>

        {/* List */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>
              Saved Facts <span style={{ color: "rgb(var(--muted))" }}>({facts.length})</span>
            </div>

            <input
              className="ds-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search facts…"
              style={{ width: 260 }}
            />
          </div>

          {!filtered.length ? (
            <div className="ds-subtitle">No memory facts yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((m) => {
                const isEditing = editingId === m.id;

                return (
                  <div key={m.id} className="ds-card ds-card-pad" style={{ boxShadow: "none" }}>
                    {!isEditing ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 700, whiteSpace: "pre-wrap" }}>{m.fact}</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="ds-btn ds-btn-xs" onClick={() => startEdit(m)}>
                              Edit
                            </button>
                            <button className="ds-btn ds-btn-xs" onClick={() => remove(m.id)}>
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="ds-subtitle" style={{ fontSize: 12, marginTop: 6 }}>
                          {m.tag ? (
                            <>
                              Tag: <span style={{ color: "rgb(var(--text))" }}>{m.tag}</span> ·{" "}
                            </>
                          ) : null}
                          Added: {fmtDate(m.createdAt)}
                          {m.updatedAt ? ` · Updated: ${fmtDate(m.updatedAt)}` : ""}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Edit memory</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 10 }}>
                          <input
                            className="ds-input"
                            value={editingFact}
                            onChange={(e) => setEditingFact(e.target.value)}
                            placeholder="Fact"
                          />
                          <input
                            className="ds-input"
                            value={editingTag}
                            onChange={(e) => setEditingTag(e.target.value)}
                            placeholder="Tag"
                          />
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                          <button className="ds-btn ds-btn-primary" onClick={saveEdit}>
                            Save
                          </button>
                          <button className="ds-btn" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>Prompt Preview (what gets injected)</div>
            <a href="/ask" className="ds-btn">
              Go to Ask →
            </a>
          </div>

          <div className="ds-bubble ds-bubble-user" style={{ whiteSpace: "pre-wrap" }}>
            {promptPreview || "(No memory facts yet.)"}
          </div>

          <div className="ds-subtitle" style={{ fontSize: 12 }}>
            Next step: we’ll send these Memory Facts to <code>/api/ask</code> so the model answers more “like you”.
          </div>
        </div>

        <footer className="ds-subtitle" style={{ fontSize: 12, textAlign: "center" }}>
          This is a POC. Memory facts are stored locally in your browser.
        </footer>
      </div>
    </main>
  );
}