// app/connections/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ConnectionRole = "Father" | "Mother" | "Partner" | "Friend" | "Sibling" | "Child" | "Other";

type Connection = {
  id: string;
  name: string;
  role: ConnectionRole;
  inviteCode: string;
  createdAt: number;
};

type MyAccount = {
  displayName: string;
  bio?: string;
};

const PERSONA_KEY = "poc_persona_v1";
const MY_INVITE_KEY = "poc_my_invite_code_v1";
const CONNECTIONS_KEY = "poc_connections_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uid() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function generateInviteCode() {
  // short, human-friendly
  const a = Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${a}-${b}`;
}

export default function ConnectionsPage() {
  const [loaded, setLoaded] = useState(false);

  const [myInvite, setMyInvite] = useState<string>("");
  const [myAccount, setMyAccount] = useState<MyAccount | null>(null);

  const [connections, setConnections] = useState<Connection[]>([]);
  const [status, setStatus] = useState("");

  // form
  const [name, setName] = useState("");
  const [role, setRole] = useState<ConnectionRole>("Father");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    const account = safeParse<MyAccount | null>(localStorage.getItem(PERSONA_KEY), null);
    setMyAccount(account);

    // invite code (create once)
    let code = localStorage.getItem(MY_INVITE_KEY) || "";
    if (!code) {
      code = generateInviteCode();
      localStorage.setItem(MY_INVITE_KEY, code);
    }
    setMyInvite(code);

    // connections list
    const list = safeParse<Connection[]>(localStorage.getItem(CONNECTIONS_KEY), []);
    setConnections(list);

    setLoaded(true);
  }, []);

  const myLabel = useMemo(() => {
    const n = (myAccount?.displayName || "").trim();
    return n ? n : "Me";
  }, [myAccount]);

  function saveConnections(next: Connection[]) {
    setConnections(next);
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(next));
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(myInvite);
      setStatus("✅ Invite code copied");
      setTimeout(() => setStatus(""), 1400);
    } catch {
      setStatus("❌ Could not copy (browser blocked)");
      setTimeout(() => setStatus(""), 1600);
    }
  }

  function addConnection() {
    const n = name.trim();
    const code = inviteCode.trim().toUpperCase();

    if (!n) {
      setStatus("❌ Please enter a name");
      setTimeout(() => setStatus(""), 1400);
      return;
    }
    if (!code || code.length < 5) {
      setStatus("❌ Please enter a valid invite code");
      setTimeout(() => setStatus(""), 1400);
      return;
    }
    if (code === myInvite) {
      setStatus("❌ You can’t add your own invite code");
      setTimeout(() => setStatus(""), 1600);
      return;
    }
    if (connections.some((c) => c.inviteCode === code)) {
      setStatus("❌ That code is already connected");
      setTimeout(() => setStatus(""), 1600);
      return;
    }

    const next: Connection[] = [
      {
        id: uid(),
        name: n,
        role,
        inviteCode: code,
        createdAt: Date.now(),
      },
      ...connections,
    ];

    saveConnections(next);
    setName("");
    setInviteCode("");
    setRole("Father");

    setStatus("✅ Connection added");
    setTimeout(() => setStatus(""), 1400);
  }

  function removeConnection(id: string) {
    if (!confirm("Remove this connection?")) return;
    const next = connections.filter((c) => c.id !== id);
    saveConnections(next);
    setStatus("🗑️ Removed");
    setTimeout(() => setStatus(""), 1200);
  }

  return (
    <main className="ds-page">
      <div className="ds-shell">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
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
            <a href="/ask" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Ask
            </a>
            <a href="/profile" style={{ fontSize: 13, color: "rgb(var(--muted))" }}>
              Profile
            </a>
            <a href="/connections" style={{ fontSize: 13, color: "rgb(var(--text))", fontWeight: 600 }}>
              Connections
            </a>
          </div>
        </div>

        <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 className="ds-h1">Connections</h1>
          <p className="ds-subtitle">
            Connect people by invite code. Later you can “Ask as” them or “Ask about” them.
          </p>
        </header>

        {/* My Invite */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
            <div style={{ fontWeight: 700 }}>Your Invite Code</div>
            <div className="ds-subtitle" style={{ fontSize: 12 }}>
              {loaded ? `Owner: ${myLabel}` : "Loading…"}
            </div>
          </div>

          <div className="ds-bubble ds-bubble-user" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div style={{ fontWeight: 800, letterSpacing: "0.08em" }}>{myInvite || "…"}</div>
            <button className="ds-btn ds-btn-xs" onClick={copyInvite} disabled={!loaded}>
              Copy
            </button>
          </div>

          <div className="ds-subtitle" style={{ fontSize: 12 }}>
            Share this code with someone so they can add you.
          </div>
        </div>

        {/* Add connection */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 700 }}>Add a Connection</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 10 }}>
            <div>
              <div className="ds-subtitle" style={{ fontSize: 12, marginBottom: 6 }}>
                Name
              </div>
              <input className="ds-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dad, Ahmet" />
            </div>

            <div>
              <div className="ds-subtitle" style={{ fontSize: 12, marginBottom: 6 }}>
                Role
              </div>
              <select
                className="ds-input"
                value={role}
                onChange={(e) => setRole(e.target.value as ConnectionRole)}
              >
                <option>Father</option>
                <option>Mother</option>
                <option>Partner</option>
                <option>Friend</option>
                <option>Sibling</option>
                <option>Child</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <div className="ds-subtitle" style={{ fontSize: 12, marginBottom: 6 }}>
              Their invite code
            </div>
            <input
              className="ds-input"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="AB12-CD34"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="ds-btn ds-btn-primary" onClick={addConnection} disabled={!loaded}>
              Add Connection
            </button>
          </div>
        </div>

        {/* List */}
        <div className="ds-card ds-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
            <div style={{ fontWeight: 700 }}>Your Connections</div>
            <div className="ds-subtitle" style={{ fontSize: 12 }}>
              {loaded ? `${connections.length} total` : "…"}
            </div>
          </div>

          {!loaded ? (
            <div className="ds-subtitle">Loading…</div>
          ) : connections.length === 0 ? (
            <div className="ds-bubble ds-bubble-user">No connections yet. Add someone using their invite code.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {connections.map((c) => (
                <div
                  key={c.id}
                  className="ds-bubble"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontWeight: 700 }}>
                      {c.name} <span style={{ color: "rgb(var(--muted))", fontWeight: 500 }}>• {c.role}</span>
                    </div>
                    <div className="ds-subtitle" style={{ fontSize: 12 }}>
                      Code: {c.inviteCode}
                    </div>
                  </div>

                  <button className="ds-btn ds-btn-xs" onClick={() => removeConnection(c.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="ds-subtitle" style={{ fontSize: 12, textAlign: "center" }}>
          {status || "Tip: later we’ll let you pick a connection inside Ask."}
        </div>
      </div>
    </main>
  );
}