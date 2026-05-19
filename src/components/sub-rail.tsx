"use client";

import { useEffect, useState } from "react";

interface ExtraMetric {
  label: string;
  value: string | number;
  variant?: "default" | "warn" | "ok";
}

interface SubRailProps {
  /** Right-side static metrics, e.g. counts pulled server-side */
  extras?: ExtraMetric[];
}

function jitter(base: number, range: number) {
  return base + (Math.random() * 2 - 1) * range;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function SubRail({ extras }: SubRailProps) {
  const [cpu, setCpu] = useState(18);
  const [mem, setMem] = useState(42);
  const [netD, setNetD] = useState(12.4);
  const [netU, setNetU] = useState(4.1);
  const [core, setCore] = useState(14);

  useEffect(() => {
    const tick = () => {
      setCpu((c) => clamp(jitter(c, 3.5), 6, 74));
      setMem((m) => clamp(jitter(m, 1.8), 28, 78));
      setNetD((n) => Math.max(0.4, jitter(n, 2.6)));
      setNetU((n) => Math.max(0.2, jitter(n, 1.1)));
      setCore((c) => clamp(Math.round(jitter(c, 2.5)), 2, 40));
    };
    const id = setInterval(tick, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="subrail">
      <div className="gauge">
        <label>CPU</label>
        <div className="bar" style={{ ["--w" as never]: `${cpu}%` }} />
        <span className="val">{cpu.toFixed(1)}%</span>
      </div>
      <div className="gauge">
        <label>MEM</label>
        <div className="bar warn" style={{ ["--w" as never]: `${mem}%` }} />
        <span className="val warn">{mem.toFixed(1)}%</span>
      </div>
      <div className="gauge">
        <label>NET ↓</label>
        <div className="bar" style={{ ["--w" as never]: `${Math.min(80, netD * 4)}%` }} />
        <span className="val">{netD.toFixed(1)} MB/s</span>
      </div>
      <div className="gauge">
        <label>NET ↑</label>
        <div className="bar" style={{ ["--w" as never]: `${Math.min(80, netU * 8)}%` }} />
        <span className="val">{netU.toFixed(1)} MB/s</span>
      </div>
      <div className="gauge">
        <label>CORE LOAD</label>
        <span className="val">{core}</span>
      </div>
      <div className="gauge">
        <label>ENV</label>
        <span className="val" style={{ color: "var(--muted)" }}>
          darwin · 25.4.0
        </span>
      </div>
      <div className="spacer" />
      {extras?.map((m, i) => (
        <div className="gauge" key={i}>
          <label>{m.label}</label>
          <span className={`val${m.variant === "warn" ? " warn" : ""}`}>{m.value}</span>
        </div>
      ))}
    </div>
  );
}
