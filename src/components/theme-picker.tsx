"use client";

import { useEffect, useState } from "react";
import { THEMES, THEME_LABELS, useTheme } from "./theme-provider";

const SHORT: Record<string, string> = {
  cyan: "MK XLII",
  redgold: "RED·GOLD",
  stealth: "STEALTH",
  hulkbuster: "HULKBUST",
  warmachine: "WAR·MCH",
  vapor: "VAPOR",
  mark1: "MK I CAVE",
  centurion: "CENTURION",
  endgame: "MK LXXXV",
  bones: "BONES",
  endosym: "ENDO-SYM",
  neon: "NEON"
};

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className={`theme-pin ${open ? "open" : ""}`}
        aria-label={open ? "Close theme picker" : "Open theme picker"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        data-th={theme}
      >
        <div className="dot" />
        <span className="lbl">{SHORT[theme]}</span>
      </button>

      {open ? (
        <aside className="theme-picker" aria-label="Theme picker">
          <div className="tp-head">
            <span>◇ SUIT</span>
            <b>{THEME_LABELS[theme]}</b>
          </div>
          <div className="tp-swatches">
            {THEMES.map((t) => (
              <div
                key={t}
                className={`sw ${theme === t ? "active" : ""}`}
                data-th={t}
                onClick={() => {
                  setTheme(t);
                  // keep open so user can browse
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setTheme(t)}
              >
                <div className="dot" />
                {SHORT[t]}
              </div>
            ))}
          </div>
          <div className="tp-foot">12 SUITS · 1–9 0 − = · ⌥◄ ⌥► · ESC</div>
        </aside>
      ) : null}
    </>
  );
}
