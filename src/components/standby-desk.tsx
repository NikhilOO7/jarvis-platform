import Link from "next/link";
import { HologramStage } from "./hologram-stage";

type RecentItem = {
  when: string;
  category: string;
  title: string;
};

interface StandbyDeskProps {
  stats?: {
    rawItems: number;
    knowledgeItems: number;
    duplicates: number;
  };
  recent?: RecentItem[];
  pendingApprovals?: number;
  systemState?: "LIVE" | "OFFLINE" | "DEGRADED";
  statusMessage?: string;
  capabilities?: { database: boolean; ai: boolean; auth: boolean };
}

const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

const DOCK_ITEMS = [
  { href: "/capture", icon: "⊕", label: "CAPTURE" },
  { href: "/knowledge", icon: "▦", label: "KNOWLEDGE" },
  { href: "/agents", icon: "⌬", label: "AGENTS" },
  { href: "/workflows", icon: "⇆", label: "WORKFLOWS" },
  { href: "/command", icon: "›_", label: "COMMAND" },
  { href: "/approvals", icon: "◉", label: "APPROVALS" },
  { href: "/chat", icon: "◈", label: "CHAT" },
  { href: "/briefing", icon: "▤", label: "BRIEFING" },
  { href: "/settings", icon: "⚙", label: "SETTINGS" }
];

export function StandbyDesk({
  stats,
  recent,
  pendingApprovals = 0,
  systemState = "OFFLINE",
  statusMessage = "Runtime status unavailable",
  capabilities = { database: false, ai: false, auth: false }
}: StandbyDeskProps) {
  const now = new Date();
  const today = now.getDate();
  const monthLabel = now.toLocaleDateString(undefined, { month: "long" });
  const dowLabel = now.toLocaleDateString(undefined, { weekday: "short" });
  const year = now.getFullYear();
  const week = Math.ceil((now.getDate() + new Date(year, 0, 1).getDay()) / 7);
  const visibleRecent = recent ?? [];
  const stateColor = systemState === "LIVE" ? "var(--accent-3)" : systemState === "DEGRADED" ? "var(--warn)" : "var(--muted)";

  return (
    <div className="desk">
      <div className="desk-topbar">
        <div className="left">
          <div className="crest" />
          <span><b>J.A.R.V.I.S</b> · STANDBY · v0.1</span>
          <span>SYS.STATE<b>::{systemState.toLowerCase()}</b></span>
        </div>
        <div className="right">
          <span style={{ color: stateColor, fontWeight: 600 }}>{systemState} · {statusMessage}</span>
        </div>
      </div>
      <div className="day-rail">
        {DAYS.map((d) => (
          <div key={d} className={`day ${d === today ? "today" : ""}`}>
            {String(d).padStart(2, "0")}
          </div>
        ))}
        <div className="system-brand">PERSONAL · SYSTEM</div>
      </div>

      <div className="desk-body">
        <div className="desk-col left">
          <div className="panel" style={{ padding: 14 }}>
            <div className="panel-head">
              <h3>{monthLabel.toUpperCase()} · {dowLabel.toUpperCase()}</h3>
            </div>
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 64,
                  fontWeight: 500,
                  color: "var(--text)",
                  textShadow: "0 0 24px rgba(var(--glow-rgb), 0.7)",
                  lineHeight: 1
                }}
              >
                {String(today).padStart(2, "0")}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.28em",
                  color: "var(--muted)",
                  marginTop: 8,
                  textTransform: "uppercase"
                }}
              >
                {year} · WK {week}
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: 14 }}>
            <div className="panel-head">
              <h3>RUNTIME · CORE</h3>
              <span className="tag">{systemState}</span>
            </div>
            <div style={{ display: "grid", placeItems: "center", padding: "12px 0" }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  border: "1px solid rgba(var(--glow-rgb), 0.36)",
                  background: "radial-gradient(circle, rgba(4, 16, 22, 0.9), rgba(0,0,0,0.7))",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  fontWeight: 500,
                  color: stateColor,
                  textShadow: "0 0 14px rgba(var(--glow-rgb), 0.7)",
                  boxShadow: "0 0 20px rgba(var(--glow-rgb), 0.3)"
                }}
              >
                {systemState}
              </div>
            </div>
          </div>

          {stats ? (
            <div className="panel" style={{ padding: 14 }}>
              <div className="panel-head">
                <h3>CORE TELEMETRY</h3>
                <span className="tag">{systemState}</span>
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--muted)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>RAW</span>
                  <b style={{ color: "var(--accent)" }}>{stats.rawItems.toLocaleString()}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>KNOWLEDGE</span>
                  <b style={{ color: "var(--accent-3)" }}>{stats.knowledgeItems.toLocaleString()}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>ECHOES</span>
                  <b style={{ color: "var(--accent-2)" }}>{stats.duplicates.toLocaleString()}</b>
                </div>
                {pendingApprovals > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>PENDING</span>
                    <b style={{ color: "var(--warn)" }}>{pendingApprovals}</b>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="panel" style={{ padding: 14 }}>
            <div className="panel-head">
              <h3>QUICK ROUTINES</h3>
            </div>
            {[
              { label: "BRIEF ME", code: "CMD·B", href: "/briefing" },
              { label: "ROUTE COMMAND", code: "CMD·R", href: "/command" },
              { label: "SAVE SIGNAL", code: "CMD·S", href: "/capture" },
              { label: "ASK MEMORY", code: "CMD·A", href: "/chat" }
            ].map((r) => (
              <Link href={r.href} className="sector-row" key={r.code}>
                <span className="ic">›</span>
                <span>{r.label}</span>
                <span className="ct">{r.code}</span>
                <span className="arr">›</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="desk-center">
          <HologramStage />
        </div>

        <div className="desk-col right">
          <div className="panel" style={{ padding: 14 }}>
            <div className="panel-head">
              <h3>CAPABILITY STATUS</h3>
              <span className="tag">OBSERVED</span>
            </div>
            <div
              style={{
                paddingBottom: 12,
                borderBottom: "1px dashed rgba(var(--glow-rgb), 0.14)"
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{statusMessage}</div>
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    marginTop: 3
                  }}
                >
                  NO SYNTHETIC TELEMETRY
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {[
                ["DATABASE", capabilities.database ? "CONNECTED" : "OFFLINE"],
                ["AI", capabilities.ai ? "CONFIGURED" : "NOT CONFIGURED"],
                ["AUTH", capabilities.auth ? "ENFORCED" : "OPEN MODE"]
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                    padding: "4px 0",
                    color: "var(--text-dim)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase"
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: 14 }}>
            <div className="panel-head">
              <h3>RECENT CAPTURES</h3>
              <span className="tag">{stats ? `${stats.rawItems} ALL` : "UNAVAILABLE"}</span>
            </div>
            {visibleRecent.length === 0 ? (
              <div className="muted" style={{ fontSize: 11, padding: "8px 0" }}>No captures recorded.</div>
            ) : visibleRecent.map((it, i) => (
              <div
                key={`${it.when}-${i}`}
                style={{
                  padding: "8px 0",
                  borderBottom:
                    i < visibleRecent.length - 1
                      ? "1px dashed rgba(var(--glow-rgb), 0.1)"
                      : "0"
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    color: "var(--muted-faint)",
                    textTransform: "uppercase",
                    marginBottom: 3
                  }}
                >
                  {it.when}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "var(--text)" }}>
                  {it.title}
                </div>
              </div>
            ))}
          </div>

          <div className="panel" style={{ padding: 14 }}>
            <div className="panel-head">
              <h3>NOTES · UPCOMING</h3>
              <span className="tag">{pendingApprovals} PENDING</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.7, color: "var(--text-dim)" }}>
              <div style={{ color: "var(--muted-faint)", marginBottom: 6 }}>› TODAY · STANDBY MODE</div>
              <div>Web controls available. Voice input is not enabled.</div>
              <div style={{ color: "var(--muted-faint)", margin: "10px 0 6px" }}>› DOCK · ACTIVE</div>
              <div>Navigation channels are available below the hologram.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dock">
        {DOCK_ITEMS.map((d) => (
          <Link key={d.href} href={d.href} className="btn">
            <div className="ring" />
            <div className="ring inner" />
            <span className="ic">{d.icon}</span>
            <span className="lbl">{d.label}</span>
          </Link>
        ))}
      </div>

      <div className="hud-reticle tl" aria-hidden="true" />
      <div className="hud-reticle gold rev br" aria-hidden="true" />
    </div>
  );
}
