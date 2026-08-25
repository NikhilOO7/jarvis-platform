"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeId =
  | "core"
  | "ion"
  | "solar"
  | "eclipse"
  | "titan"
  | "forge"
  | "vapor"
  | "cavern"
  | "sentinel"
  | "apex"
  | "ivory"
  | "symbiosis"
  | "neon";

export const THEME_LABELS: Record<ThemeId, string> = {
  core: "CORE · CLASSIC",
  ion: "ION · CYAN",
  solar: "SOLAR · RED GOLD",
  eclipse: "ECLIPSE · STEALTH",
  titan: "TITAN · VIOLET",
  forge: "FORGE · SILVER",
  vapor: "VAPOR · IRIDESCENT",
  cavern: "CAVERN · COPPER",
  sentinel: "SENTINEL · CRIMSON",
  apex: "APEX · CRIMSON",
  ivory: "IVORY · PALE GOLD",
  symbiosis: "SYMBIOSIS · BLACK RED",
  neon: "NEON · CYBER"
};

export const THEMES: ThemeId[] = [
  "core",
  "ion",
  "solar",
  "eclipse",
  "titan",
  "forge",
  "vapor",
  "cavern",
  "sentinel",
  "apex",
  "ivory",
  "symbiosis",
  "neon"
];

type ThemeCtx = { theme: ThemeId; setTheme: (t: ThemeId) => void };
const Ctx = createContext<ThemeCtx>({ theme: "core", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("core");

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
