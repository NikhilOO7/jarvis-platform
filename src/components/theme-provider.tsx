"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeId =
  | "jarvis"
  | "cyan"
  | "redgold"
  | "stealth"
  | "hulkbuster"
  | "warmachine"
  | "vapor"
  | "mark1"
  | "centurion"
  | "endgame"
  | "bones"
  | "endosym"
  | "neon";

export const THEME_LABELS: Record<ThemeId, string> = {
  jarvis: "J.A.R.V.I.S · CLASSIC",
  cyan: "MARK XLII · CYAN",
  redgold: "MARK XLIII · RED · GOLD",
  stealth: "MARK VII · STEALTH",
  hulkbuster: "MARK XLIV · HULKBUSTER",
  warmachine: "WAR MACHINE · SILVER",
  vapor: "MARK L · VAPOR",
  mark1: "MARK I · CAVE",
  centurion: "MARK XXXIII · CENTURION",
  endgame: "MARK LXXXV · ENDGAME",
  bones: "MARK XXXIX · BONES",
  endosym: "ENDO-SYM · SYMBIOTE",
  neon: "NEON · CYBER"
};

export const THEMES: ThemeId[] = [
  "jarvis",
  "cyan",
  "redgold",
  "stealth",
  "hulkbuster",
  "warmachine",
  "vapor",
  "mark1",
  "centurion",
  "endgame",
  "bones",
  "endosym",
  "neon"
];

type ThemeCtx = { theme: ThemeId; setTheme: (t: ThemeId) => void };
const Ctx = createContext<ThemeCtx>({ theme: "jarvis", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("jarvis");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jarvis-theme") as ThemeId | null;
      if (saved && THEMES.includes(saved)) setThemeState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    try { localStorage.setItem("jarvis-theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 1-9 → themes 0-8; 0 → theme 9; -/= → 10, 11; remaining themes via ⌥/⌘ arrows
      let idx = -1;
      if (e.key >= "1" && e.key <= "9") idx = parseInt(e.key, 10) - 1;
      else if (e.key === "0") idx = 9;
      else if (e.key === "-" || e.key === "_") idx = 10;
      else if (e.key === "=" || e.key === "+") idx = 11;
      // Arrow keys cycle next/prev
      else if (e.key === "ArrowRight" && (e.metaKey || e.altKey)) {
        setThemeState((cur) => THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]);
        return;
      } else if (e.key === "ArrowLeft" && (e.metaKey || e.altKey)) {
        setThemeState((cur) => THEMES[(THEMES.indexOf(cur) - 1 + THEMES.length) % THEMES.length]);
        return;
      }
      if (idx >= 0 && idx < THEMES.length) setThemeState(THEMES[idx]);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return <Ctx.Provider value={{ theme, setTheme: setThemeState }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
