"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  Database,
  MessageSquare,
  Network,
  Newspaper,
  Radio,
  Settings,
  ShieldCheck,
  TerminalSquare,
  UploadCloud,
  Workflow,
  Zap
} from "lucide-react";
import { MiniCore } from "./mini-core";
import { HudBackground } from "./hud-background";

const navItems = [
  { href: "/", label: "Standby", icon: Zap, cmd: "CMD·01" },
  { href: "/briefing", label: "Briefing", icon: Newspaper, cmd: "CMD·02" },
  { href: "/capture", label: "Capture", icon: UploadCloud, cmd: "CMD·03" },
  { href: "/knowledge", label: "Knowledge", icon: Database, cmd: "CMD·04" },
  { href: "/agents", label: "Agents", icon: Network, cmd: "CMD·05" },
  { href: "/workflows", label: "Workflows", icon: Workflow, cmd: "CMD·06" },
  { href: "/runs", label: "Runs", icon: Activity, cmd: "CMD·07" },
  { href: "/command", label: "Command", icon: TerminalSquare, cmd: "CMD·08" },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck, cmd: "CMD·09" },
  { href: "/chat", label: "Chat", icon: MessageSquare, cmd: "CMD·10" },
  { href: "/settings", label: "Settings", icon: Settings, cmd: "CMD·11" }
] as const;

export function AppShell({
  children,
  hideSidebar = false
}: {
  children: React.ReactNode;
  hideSidebar?: boolean;
}) {
  const pathname = usePathname();

  if (hideSidebar) {
    return (
      <div className="app-shell no-sidebar">
        <HudBackground />
        <main className="main">{children}</main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <HudBackground />

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Bot size={18} />
          </div>
          <div className="brand-text">
            <div className="name">JARVIS</div>
            <div className="tag">PERSONAL · CORE</div>
          </div>
        </div>

        <MiniCore />

        <div className="sys-stack" aria-label="System status">
          <div className="sys-row">
            <span className="led" />
            <span>INGESTION</span>
            <b>MANUAL</b>
          </div>
          <div className="sys-row">
            <span className="led warn" />
            <span>AI CORE</span>
            <b className="warn">SEE SETTINGS</b>
          </div>
          <div className="sys-row">
            <span className="led" />
            <span>BRIEFING</span>
            <b>ON DEMAND</b>
          </div>
          <div className="sys-row">
            <span className="led idle" />
            <span>VOICE</span>
            <b className="idle">OFF</b>
          </div>
        </div>

        <div className="nav-header">
          <span>COMMANDS</span>
          <b>{navItems.length}</b>
        </div>

        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={isActive ? "active" : ""}>
                <item.icon size={14} />
                <span className="cmd">{item.cmd}</span>
                <span>{item.label}</span>
                <span className="chev">›</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 14 }}>
          <div className="sys-row">
            <Radio size={12} />
            <span>CHANNEL</span>
            <b>WEB UI</b>
          </div>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
