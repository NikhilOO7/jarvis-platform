"use client";

import { useEffect, useState } from "react";

interface TopBarProps {
  label?: string;
  uplink?: string;
  center?: string;
}

const SESSION_ID = (() => {
  // Stable per-page mount; varied across reloads
  const seg = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${seg.slice(0, 2)}-${seg.slice(2, 4)}`;
})();

export function TopBar({
  label = "J.A.R.V.I.S",
  uplink = "stable",
  center = "ONLINE · LISTENING STANDBY"
}: TopBarProps) {
  const [uptime, setUptime] = useState("00:00:00");
  const [start] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => {
      const s = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      setUptime(`${h}:${m}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [start]);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="crest" />
        <span>
          <b>{label}</b> <span className="sep">·</span> v4.7
        </span>
        <span>
          SYS.UPLINK<b>::{uplink}</b>
        </span>
        <span>
          PWR <b>1.21 GW</b>
        </span>
      </div>
      <div className="topbar-center">
        <span className="live-dot" />
        <span style={{ color: "var(--accent-3)", fontWeight: 600 }}>{center}</span>
        <span className="live-dot" />
      </div>
      <div className="topbar-right">
        <div className="metric">
          <span>SES</span>
          <b className="ok">{SESSION_ID}</b>
        </div>
        <div className="metric">
          <span>USR</span>
          <b>OPERATOR</b>
        </div>
        <div className="metric">
          <span>UPTIME</span>
          <b>{uptime}</b>
        </div>
      </div>
    </div>
  );
}
