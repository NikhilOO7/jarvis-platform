import Link from "next/link";
import {
  Activity,
  Bot,
  Cpu,
  Database,
  Home,
  MessageSquare,
  Network,
  Newspaper,
  Radio,
  Settings,
  ShieldCheck,
  TerminalSquare,
  UploadCloud,
  Workflow
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/capture", label: "Capture", icon: UploadCloud },
  { href: "/knowledge", label: "Knowledge", icon: Database },
  { href: "/agents", label: "Agents", icon: Network },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/runs", label: "Runs", icon: Activity },
  { href: "/command", label: "Command", icon: TerminalSquare },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/briefing", label: "Briefing", icon: Newspaper },
  { href: "/settings", label: "Settings", icon: Settings }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="hud-background" aria-hidden="true">
        <div className="hud-grid" />
        <div className="hud-stars" />
        <div className="hud-hex" />
        <div className="hud-scanlines" />
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-br" />
      </div>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Bot size={18} />
          </div>
          <div>
            <div className="brand-title">JARVIS</div>
            <div className="label">Personal Intelligence Core</div>
          </div>
        </div>

        <div className="core-visual" aria-hidden="true">
          <div className="core-ring core-ring-outer" />
          <div className="core-ring core-ring-middle" />
          <div className="core-ring core-ring-inner" />
          <div className="core-pulse" />
        </div>

        <div className="system-stack" aria-label="System status">
          <div className="system-row">
            <Activity size={14} />
            <span>INGESTION</span>
            <strong>ARMED</strong>
          </div>
          <div className="system-row">
            <Cpu size={14} />
            <span>AI CORE</span>
            <strong>STANDBY</strong>
          </div>
          <div className="system-row">
            <Radio size={14} />
            <span>BRIEFING</span>
            <strong>LIVE</strong>
          </div>
        </div>

        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
