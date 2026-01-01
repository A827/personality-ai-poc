"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/persona", label: "Account" },
  { href: "/interview", label: "Interview" },
  { href: "/connections", label: "Connections" },
  { href: "/ask", label: "Ask" },
  { href: "/profile", label: "Profile" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function TopNav() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  // Hide navigation on entry page(s)
  const hideNav = pathname === "/start";

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const activeLabel = useMemo(() => {
    const found = links.find((l) => isActive(pathname, l.href));
    return found?.label || "Home";
  }, [pathname]);

  // If we're on /start, show only the brand (no menu, no links)
  if (hideNav) {
    return (
      <header className="ds-topbar">
        <div className="ds-topbar-row">
          <Link href="/start" className="ds-brand" aria-label="Go to start">
            Personality AI
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="ds-topbar">
      <div className="ds-topbar-row">
        <Link href="/" className="ds-brand" aria-label="Go to home">
          Personality AI
        </Link>

        {/* Desktop nav */}
        <nav className="ds-nav ds-nav-desktop" aria-label="Primary">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                data-active={active ? "true" : "false"}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile: current section + menu button */}
        <div className="ds-nav-mobilebar">
          <div className="ds-subtitle ds-nav-current">{activeLabel}</div>

          <button
            className="ds-btn ds-btn-xs"
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="topnav-mobile"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div id="topnav-mobile" className="ds-nav-panel">
          <div className="ds-divider" />
          <div className="ds-nav-grid">
            {links.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`ds-nav-tile ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Minimal responsive behavior (no Tailwind required) */}
      <style jsx>{`
        .ds-nav-desktop {
          display: none;
        }

        .ds-nav-mobilebar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }

        .ds-nav-current {
          font-size: 12px;
          white-space: nowrap;
        }

        .ds-nav-panel {
          margin-top: 10px;
        }

        .ds-nav-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .ds-nav-tile {
          border: 1px solid rgb(var(--border));
          border-radius: var(--r-md);
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 600;
          color: rgb(var(--muted));
          background: transparent;
          text-decoration: none;
        }

        .ds-nav-tile:hover {
          color: rgb(var(--text));
          background: rgba(var(--text), 0.04);
          text-decoration: none;
        }

        .ds-nav-tile.is-active {
          color: rgb(var(--text));
          font-weight: 700;
          background: rgba(var(--text), 0.06);
        }

        @media (min-width: 860px) {
          .ds-nav-desktop {
            display: flex;
          }
          .ds-nav-mobilebar {
            display: none;
          }
          .ds-nav-panel {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}