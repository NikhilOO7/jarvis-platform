import Link from "next/link";
import { Battery, Code2, Info, Mic, Quote, Radio, Server, Sparkles, Volume2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { agentModules, automationStack, executionSteps } from "@/lib/agent-features";
import { categoryDescriptions, categoryLabels, contentCategories } from "@/lib/categories";
import { demoBriefing, demoStats } from "@/lib/demo-data";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

async function getStats() {
  if (!env.DATABASE_URL) return demoStats;

  try {
    const [rawItems, knowledgeItems, duplicates, grouped] = await Promise.all([
      prisma.rawSourceItem.count(),
      prisma.knowledgeItem.count(),
      prisma.rawSourceItem.count({ where: { status: "DUPLICATE" } }),
      prisma.rawSourceItem.groupBy({ by: ["category"], _count: true })
    ]);

    return {
      rawItems,
      knowledgeItems,
      duplicates,
      categories: {
        ...demoStats.categories,
        ...Object.fromEntries(grouped.map((item) => [item.category, item._count]))
      }
    };
  } catch {
    return demoStats;
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Command Center // Mainframe"
        title="Personal intelligence core online."
        description="Capture, classify, deduplicate, retrieve, brief, and convert your saved universe into decisions."
        action={
          <Link className="button" href="/capture">
            Save Something
          </Link>
        }
      />

      <section className="jarvis-hero" aria-label="Jarvis command interface">
        <div className="hero-top-rail">
          <span>JARVIS PERSONAL AI</span>
          <span>Auto Startup</span>
          <span>System 2.0</span>
        </div>

        <div className="hero-side hero-side-left">
          <Link className="command-pill" href="/chat">
            <Sparkles size={20} />
            Greeting
          </Link>
          <div className="command-pill">
            <Battery size={20} />
            Battery
          </div>
          <div className="command-pill">
            <Server size={20} />
            System Info
          </div>
        </div>

        <div className="hero-core-stage">
          <div className="orbital-system" aria-hidden="true">
            <div className="orbit orbit-1" />
            <div className="orbit orbit-2" />
            <div className="orbit orbit-3" />
            <div className="orbital-sphere" />
          </div>
          <div className="waveform" aria-hidden="true">
            {Array.from({ length: 64 }).map((_, index) => (
              <span key={index} style={{ height: `${8 + ((index * 13) % 42)}px` }} />
            ))}
          </div>
          <div className="reactor-button" aria-hidden="true">
            <div className="reactor-ring" />
            <div className="reactor-label">JARVIS</div>
          </div>
          <div className="hero-status">
            <span className="status-dot" />
            Listening Standby
          </div>
        </div>

        <div className="hero-side hero-side-right">
          <div className="command-pill">
            <Quote size={20} />
            Quotes
          </div>
          <div className="command-pill">
            <Code2 size={20} />
            Background
          </div>
          <div className="command-pill">
            <Info size={20} />
            Version
          </div>
        </div>

        <div className="hero-bottom-rail">
          <div className="rail-chip">
            <Radio size={16} />
            Voice channel armed
          </div>
          <Link className="button danger" href="/agents">
            Activate Command Mode
          </Link>
          <div className="rail-chip">
            <Mic size={16} />
            Speech input queued
          </div>
          <div className="rail-chip">
            <Volume2 size={16} />
            Voice output optional
          </div>
        </div>
      </section>

      <section className="grid stats-grid" aria-label="System stats">
        <div className="card">
          <div className="label">Raw items</div>
          <div className="stat-value">{stats.rawItems}</div>
          <div className="muted">Captured signals</div>
        </div>
        <div className="card">
          <div className="label">Knowledge</div>
          <div className="stat-value">{stats.knowledgeItems}</div>
          <div className="muted">Memory nodes</div>
        </div>
        <div className="card">
          <div className="label">Duplicates</div>
          <div className="stat-value">{stats.duplicates}</div>
          <div className="muted">Signal echoes</div>
        </div>
        <div className="card">
          <div className="label">Capture paths</div>
          <div className="stat-value">4</div>
          <div className="muted">Input channels</div>
        </div>
      </section>

      <section className="grid content-grid" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>Knowledge Sectors</h2>
          <div className="list">
            {contentCategories.map((category) => (
              <div className="list-item" key={category}>
                <div className="button-row" style={{ justifyContent: "space-between" }}>
                  <strong>{categoryLabels[category]}</strong>
                  <span className="pill">{stats.categories[category]} items</span>
                </div>
                <div className="muted">{categoryDescriptions[category]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Mission Briefing</h2>
          <ul className="list">
            {demoBriefing.map((item) => (
              <li className="list-item" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">Agent Ecosystem // Expansion Bay</div>
            <h2>Delegated workflow command layer</h2>
          </div>
          <span className="pill">Roadmap Modules</span>
        </div>
        <div className="module-grid">
          {agentModules.map((module) => (
            <article className="module-card" key={module.title}>
              <div className="module-icon">
                <module.icon size={22} />
              </div>
              <div>
                <h3>{module.title}</h3>
                <p className="muted">{module.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid content-grid" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>Voice + Automation Stack</h2>
          <div className="timeline-list">
            {automationStack.map((item, index) => (
              <div className="timeline-item" key={item.title}>
                <div className="timeline-index">{index + 1}</div>
                <div className="module-icon compact">
                  <item.icon size={18} />
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <p className="muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Execution Model</h2>
          <ul className="list">
            {executionSteps.slice(0, 4).map((step) => (
              <li className="list-item" key={step}>
                {step}
              </li>
            ))}
          </ul>
          <Link className="button secondary" href="/agents" style={{ marginTop: 14 }}>
            Open Agent Console
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
