import Link from "next/link";
import { Battery, Code2, Info, Mic, Quote, Radio, Server, Sparkles, Volume2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TopBar } from "@/components/top-bar";
import { SubRail } from "@/components/sub-rail";
import { JarvisLogoCore } from "@/components/jarvis-logo-core";
import { categoryDescriptions, categoryLabels, contentCategories } from "@/lib/categories";
import { demoBriefing, demoStats } from "@/lib/demo-data";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

async function getBriefingData() {
  if (!env.DATABASE_URL) {
    return { stats: demoStats, briefing: [], suggestions: demoBriefing };
  }
  try {
    const [rawItems, knowledgeItems, duplicates, grouped, latest] = await Promise.all([
      prisma.rawSourceItem.count(),
      prisma.knowledgeItem.count(),
      prisma.rawSourceItem.count({ where: { status: "DUPLICATE" } }),
      prisma.rawSourceItem.groupBy({ by: ["category"], _count: true }),
      prisma.knowledgeItem.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { source: true }
      })
    ]);
    return {
      stats: {
        rawItems,
        knowledgeItems,
        duplicates,
        categories: {
          ...demoStats.categories,
          ...Object.fromEntries(grouped.map((g) => [g.category, g._count]))
        }
      },
      briefing: latest.map((item) => ({ title: item.title, summary: item.summary, category: item.category })),
      suggestions: latest.length === 0 ? demoBriefing : []
    };
  } catch {
    return { stats: demoStats, briefing: [], suggestions: demoBriefing };
  }
}

const heroLeft = [
  { id: "CMD · 01", title: "Greeting", icon: Sparkles, primary: true },
  { id: "CMD · 02", title: "Battery", icon: Battery },
  { id: "CMD · 03", title: "System Info", icon: Server }
];
const heroRight = [
  { id: "CMD · 04", title: "Quotes", icon: Quote },
  { id: "CMD · 05", title: "Background", icon: Code2 },
  { id: "CMD · 06", title: "Version", icon: Info }
];

export default async function BriefingPage() {
  const { stats, briefing, suggestions } = await getBriefingData();

  return (
    <AppShell>
      <TopBar label="J.A.R.V.I.S · BRIEFING" uplink="live" center="SITUATION ROOM · ONLINE" />
      <SubRail
        extras={[
          { label: "RAW", value: stats.rawItems.toLocaleString() },
          { label: "KNOWLEDGE", value: stats.knowledgeItems.toLocaleString() },
          { label: "ECHOES", value: stats.duplicates.toLocaleString() }
        ]}
      />

      <PageHeader
        eyebrow="Command Center // Mainframe · Operator-1"
        title="Personal intelligence core [b]online[/b]."
        description="Capture, classify, deduplicate, retrieve, brief, and convert your saved universe into decisions. Standing by for instructions."
        action={
          <Link className="button" href="/capture">
            ◆ Save Something
          </Link>
        }
        meta={[
          { label: "FILE", value: "Δ001" },
          { label: "CLASS::", value: "ALPHA", highlight: true },
          { label: "MODE", value: "BRIEFING" }
        ]}
      />

      <section className="jarvis-hero" aria-label="Jarvis command interface" style={{ position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="reactor-glyph tr" src="/images/jarvis%203.png" alt="" aria-hidden="true" />
        <div className="hero-rail-top">
          <span><span className="pill">AUTO STARTUP</span></span>
          <span><b>SYSTEM 2.0</b> · INTERFACE ACTIVE</span>
          <span><span className="pill">VOICE READY</span></span>
        </div>

        <div className="hero-side hero-side-left">
          {heroLeft.map((c) => (
            <Link className={`cmd-pill ${c.primary ? "primary" : ""}`} href="/chat" key={c.id}>
              <span className="ic"><c.icon size={18} /></span>
              <div className="lbl">
                <span className="cmdid">{c.id}</span>
                <span className="ttl">{c.title}</span>
              </div>
              <span className="ch">›</span>
            </Link>
          ))}
        </div>

        <JarvisLogoCore />

        <div className="hero-side hero-side-right">
          {heroRight.map((c) => (
            <Link className="cmd-pill" href="/chat" key={c.id}>
              <span className="ic"><c.icon size={18} /></span>
              <div className="lbl">
                <span className="cmdid">{c.id}</span>
                <span className="ttl">{c.title}</span>
              </div>
              <span className="ch">›</span>
            </Link>
          ))}
        </div>

        <div className="hero-rail-bottom">
          <div className="chip"><Radio size={14} /> VOICE CHANNEL ARMED</div>
          <Link className="button danger" href="/command">◆ ACTIVATE COMMAND MODE</Link>
          <div className="chip"><Mic size={14} /> SPEECH INPUT QUEUED</div>
          <div className="chip"><Volume2 size={14} /> VOICE OUTPUT OPTIONAL</div>
        </div>
      </section>

      <section className="grid stats-grid" style={{ marginTop: 18 }} aria-label="System stats">
        <div className="panel">
          <div className="panel-head"><h3>RAW ITEMS</h3><span className="tag">CAPTURED</span></div>
          <div className="stat-value">{stats.rawItems.toLocaleString()}</div>
          <div className="label">Captured signals</div>
        </div>
        <div className="panel">
          <div className="panel-head"><h3>KNOWLEDGE</h3><span className="tag">MEMORY</span></div>
          <div className="stat-value" style={{ color: "var(--accent-3)" }}>{stats.knowledgeItems.toLocaleString()}</div>
          <div className="label">Memory nodes</div>
        </div>
        <div className="panel">
          <div className="panel-head"><h3>DUPLICATES</h3><span className="tag">ECHOES</span></div>
          <div className="stat-value" style={{ color: "var(--accent-2)" }}>{stats.duplicates.toLocaleString()}</div>
          <div className="label">Signal echoes</div>
        </div>
        <div className="panel">
          <div className="panel-head"><h3>CHANNELS</h3><span className="tag">ALL OK</span></div>
          <div className="stat-value">4 / 4</div>
          <div className="label">Input paths</div>
        </div>
      </section>

      <section className="grid content-grid" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panel-head">
            <h3>KNOWLEDGE SECTORS</h3>
            <span className="tag">{contentCategories.length} LIVE</span>
          </div>
          {contentCategories.map((category) => (
            <Link href="/knowledge" className="sector-row" key={category}>
              <span className="ic">◈</span>
              <span>{categoryLabels[category]}</span>
              <span className="ct">{stats.categories[category]}</span>
              <span className="arr">›</span>
            </Link>
          ))}
          <div className="muted" style={{ fontSize: 12, marginTop: 12, opacity: 0.7 }}>
            {categoryDescriptions.MISC}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>MISSION BRIEFING</h3>
            <span className="tag">{briefing.length > 0 ? `${briefing.length} FILES` : "STANDBY"}</span>
          </div>
          {briefing.length > 0 ? (
            <div className="grid" style={{ gap: 10 }}>
              {briefing.map((item, i) => (
                <article className="file-card" key={`${item.category}-${i}`}>
                  <div className="fhead">
                    <span>FILE-{String(i + 1).padStart(3, "0")}</span>
                    <span><b>{item.category}</b></span>
                  </div>
                  <div className="ftitle">{item.title}</div>
                  <div className="fdesc">{item.summary}</div>
                </article>
              ))}
            </div>
          ) : (
            <ul className="list">
              {suggestions.map((item, i) => (
                <li className="list-item" key={i}>
                  <div className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{item}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AppShell>
  );
}
