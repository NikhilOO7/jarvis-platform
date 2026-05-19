"use client";

import { useEffect, useState } from "react";

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
    const t = setTimeout(() => setShow(false), 4600);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="boot-overlay" id="boot">
      <div className="boot-inner">
        <div className="big">J.A.R.V.I.S</div>
        <div className="line">› Initializing Personal Intelligence Core</div>
        <div className="line">› Mounting Knowledge Graph · loading nodes</div>
        <div className="line">› Spinning AI Cores · OpenAI / Embeddings</div>
        <div className="line">› Calibrating Voice Channel · sub-200ms</div>
        <div className="line">› Verifying Approval Gates</div>
        <div className="line">› Synchronizing Memory Buffer · OK</div>
        <div className="line">▮ System ready · welcome back, operator.</div>
      </div>
    </div>
  );
}
