export function HudBackground() {
  return (
    <div className="hud-background" aria-hidden="true">
      <div className="hud-grid" />
      <div className="hud-stars" />
      <div className="hud-scanlines" />
      <div className="hud-sweep" />
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-br" />
    </div>
  );
}
