"use client";

import { useEffect, useState } from "react";

const BOOT_LINES: Array<{ text: string; status: string; gold?: boolean }> = [
  { text: "› Loading operator interface", status: "UI" },
  { text: "› Phase 0 safety policy", status: "ACTIVE", gold: true },
  { text: "› External email and calendar writes", status: "OFF" },
  { text: "› Voice input and output", status: "OFF" },
  { text: "› Runtime data policy", status: "OBSERVED" }
];

export function BootOverlay() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // only show once per session
    try {
      if (sessionStorage.getItem("jarvis-booted") === "1") {
        setShow(false);
        return;
      }
      sessionStorage.setItem("jarvis-booted", "1");
    } catch {}
    const t = setTimeout(() => setShow(false), 5700);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="boot-overlay" id="boot">
      <div className="boot-inner">
        <div className="boot-core" aria-hidden="true">
          <div className="br-ring br-rim" />
          <div className="br-ring br-coil" />
          <div className="br-ring br-dash" />
          <div className="br-core" />
        </div>
        <div className="big">J.A.R.V.I.S</div>
        <div className="boot-sub">Just A Rather Very Intelligent System</div>
        <div className="boot-lines">
          {BOOT_LINES.map((l, i) => (
            <div
              key={l.text}
              className="line"
              style={{ animationDelay: `${0.6 + i * 0.42}s` }}
            >
              <span>{l.text}</span>
              <i className={l.gold ? "gold" : undefined}>[{l.status}]</i>
            </div>
          ))}
          <div className="line ready" style={{ animationDelay: "3.4s" }}>
            ▮ Interface ready · verify runtime status in Settings.
          </div>
        </div>
        <div className="boot-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
