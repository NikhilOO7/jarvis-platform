"use client";

import { useEffect, useState } from "react";

interface TopBarProps {
  label?: string;
  uplink?: string;
  center?: string;
}

export function TopBar({
  label = "J.A.R.V.I.S",
  uplink = "unknown",
  center = "RUNTIME STATE NOT PROVIDED"
}: TopBarProps) {
  const [uptime, setUptime] = useState("00:00:00");
  const [start] = useState(() => Date.now());
  // This is only a short-lived browser UI instance label, not a backend session identifier.
  const [uiInstanceId, setUiInstanceId] = useState("--");
  const centerColor = uplink.toLowerCase() === "live"
    ? "var(--accent-3)"
    : uplink.toLowerCase() === "degraded"
      ? "var(--warn)"
      : "var(--muted)";

  useEffect(() => {
    const seg = Math.random().toString(36).slice(2, 6).toUpperCase();
    setUiInstanceId(`${seg.slice(0, 2)}-${seg.slice(2, 4)}`);
  }, []);

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
          <b>{label}</b> <span className="sep">·</span> v0.1
        </span>
        <span>
          SYS.UPLINK<b>::{uplink}</b>
        </span>
        <span>
          PHASE <b>0 · HARDENING</b>
        </span>
      </div>
      <div className="topbar-center">
        <span style={{ color: centerColor, fontWeight: 600 }}>{center}</span>
      </div>
      <div className="topbar-right">
        <div className="metric">
          <span>UI INSTANCE</span>
          <b>{uiInstanceId}</b>
        </div>
        <div className="metric">
          <span>USR</span>
          <b>OPERATOR</b>
        </div>
        <div className="metric">
          <span>SESSION AGE</span>
          <b>{uptime}</b>
        </div>
      </div>
    </div>
  );
}
