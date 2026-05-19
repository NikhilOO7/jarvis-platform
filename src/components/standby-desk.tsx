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

const FALLBACK_RECENT: RecentItem[] = [
  { when: "14:21 · FOOD", category: "FOOD", title: "High-protein chicken bowls" },
  { when: "13:48 · TECH", category: "TECH", title: "Embedding model benchmarks" },
  { when: "12:32 · JOBS", category: "JOBS", title: "Senior AI Engineer · Replicate" },
  { when: "11:09 · HEALTH", category: "MISC", title: "Updated creatine dosing" }
];

export function StandbyDesk({ stats, recent, pendingApprovals = 0 }: StandbyDeskProps) {
  const now = new Date();
  const today = now.getDate();
  const monthLabel = now.toLocaleDateString(undefined, { month: "long" });
  const dowLabel = now.toLocaleDateString(undefined, { weekday: "short" });
  const year = now.getFullYear();
  const week = Math.ceil((now.getDate() + new Date(year, 0, 1).getDay()) / 7);
  const visibleRecent = recent && recent.length > 0 ? recent : FALLBACK_RECENT;

  return (
    <div className="desk">
      <div className="desk-topbar">
        <div className="left">
          <div className="crest" />
          <span><b>J.A.R.V.I.S</b> · STANDBY · v4.7</span>
          <span>SYS.UPLINK<b>::stable</b></span>
        </div>
        <div className="right">
          <span className="live-dot" />
          <span style={{ color: "var(--accent-3)", fontWeight: 600 }}>ONLINE · LISTENING STANDBY</span>
          <span className="live-dot" />
        </div>
      </div>
      <div className="day-rail">
        {DAYS.map((d) => (
          <div key={d} className={`day ${d === today ? "today" : ""}`}>
            {String(d).padStart(2, "0")}
          </div>
        ))}
        <div className="stark">STARK · INDUSTRIES</div>
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
              <h3>ENERGY · CORE</h3>
              <span className="tag">100%</span>
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
                  color: "var(--accent-hot)",
                  textShadow: "0 0 14px rgba(var(--glow-rgb), 0.7)",
                  boxShadow: "0 0 20px rgba(var(--glow-rgb), 0.3)"
                }}
              >
                100%
              </div>
            </div>
          </div>

          {stats ? (
            <div className="panel" style={{ padding: 14 }}>
              <div className="panel-head">
                <h3>CORE TELEMETRY</h3>
                <span className="tag">LIVE</span>
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
              <h3>WEATHER · LOCATION</h3>
              <span className="tag">LIVE</span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                paddingBottom: 12,
                borderBottom: "1px dashed rgba(var(--glow-rgb), 0.14)"
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  border: "1px solid rgba(var(--glow-rgb), 0.4)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow:
                    "inset 0 0 12px rgba(var(--glow-rgb), 0.14), 0 0 12px rgba(var(--glow-rgb), 0.2)"
                }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500 }}>72°</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>New York, US</div>
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
                  CLEAR · WIND 6 MPH
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {[
                ["TUE", "74°", "/ 58°"],
                ["WED", "68°", "/ 54°"],
                ["THU", "62°", "/ 50°"],
                ["FRI", "58°", "/ 49°"]
              ].map(([d, h, l]) => (
                <div
                  key={d}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr auto",
                    gap: 8,
                    padding: "4px 0",
                    color: "var(--text-dim)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase"
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>{d}</span>
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>{h}</span>
                  <span style={{ color: "var(--muted-faint)", fontSize: 10 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: 14 }}>
            <div className="panel-head">
              <h3>RECENT CAPTURES</h3>
              <span className="tag">{stats ? `+${stats.rawItems} ALL` : "DEMO"}</span>
            </div>
            {visibleRecent.map((it, i) => (
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
              <div>Listening for voice and text commands.</div>
              <div style={{ color: "var(--muted-faint)", margin: "10px 0 6px" }}>› DOCK · ACTIVE</div>
              <div>9 channels armed below the hologram.</div>
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

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="deco-ornament tl" src="/images/jarvis%202.png" alt="" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="deco-ornament br" src="/images/jarvis%202.png" alt="" aria-hidden="true" />
    </div>
  );
}
