/* eslint-disable @next/next/no-img-element */

/**
 * Concentric "data ring" layers drawn as SVG so they inherit the active suit
 * theme's glow color directly (no hue-rotated image, no baked-in watermark).
 */
function HoloDataRing({ variant }: { variant: "outer" | "inner" }) {
  const rings =
    variant === "outer"
      ? [
          { r: 47.5, w: 0.5, dash: "9 2.4 1.4 2.4 4.5 3.4 14 2.4", o: 0.5 },
          { r: 45, w: 1.1, dash: "0.6 2.1", o: 0.42 },
          { r: 42.5, w: 0.5, dash: "16 3 2.5 3 7 5", o: 0.55 },
          { r: 40, w: 0.4, dash: "3.2 1.6 1 1.6 6.5 1.6", o: 0.4 },
          { r: 37, w: 1.6, dash: "11 7 4 8", o: 0.24 },
          { r: 34.5, w: 0.4, dash: "1.2 1.8", o: 0.55 }
        ]
      : [
          { r: 46, w: 0.6, dash: "12 3.2 2 3.2 5.5 3.2", o: 0.6 },
          { r: 43, w: 1.8, dash: "8 5.5 15 6.5", o: 0.22 },
          { r: 40, w: 0.5, dash: "1 2 4.5 2", o: 0.6 },
          { r: 35.5, w: 0.4, dash: "20 4 3.5 4", o: 0.5 }
        ];

  return (
    <svg className={`holo-ring-svg ${variant}`} viewBox="0 0 100 100" aria-hidden="true">
      {rings.map((ring) => (
        <circle
          key={ring.r}
          cx="50"
          cy="50"
          r={ring.r}
          strokeWidth={ring.w}
          strokeDasharray={ring.dash}
          opacity={ring.o}
        />
      ))}
      {variant === "inner" ? <circle className="hr-bright" cx="50" cy="50" r="30" strokeWidth="0.9" /> : null}
    </svg>
  );
}

export function HologramStage() {
  return (
    <div className="hologram-stage" aria-hidden="true">
      <div className="holo-column" />
      <HoloDataRing variant="outer" />
      <HoloDataRing variant="inner" />
      <div className="holo-motes" />
      <div className="holo-platform">
        <div className="hp-ring seg" />
        <div className="hp-ring dash" />
        <div className="hp-ring faint" />
      </div>
      <img className="iron-man" src="/images/iron-man-hologram.png" alt="Iron Man hologram standby" />
      <div className="hud-reticle holo-flank l" />
      <div className="hud-reticle gold rev holo-flank r" />
      <div className="holo-scan" />
      <div className="hologram-base" />
    </div>
  );
}
