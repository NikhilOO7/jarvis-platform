export function JarvisLogoCore() {
  return (
    <div className="hero-core-stage">
      <div className="orb-system" aria-hidden="true">
        <div className="ring r4" />
        <div className="ring r1" />
        <div className="ring r2" />
        <div className="ring r3" />
      </div>
      <Waveform />
      <div className="arc-reactor hero-reactor" aria-hidden="true">
        <div className="ar-halo" />
        <div className="ar-ring ar-ticks" />
        <div className="ar-ring ar-outer" />
        <div className="ar-ring ar-coils" />
        <div className="ar-ring ar-dashed" />
        <div className="ar-ring ar-inner" />
        <div className="ar-core" />
      </div>
      <div className="hero-status">
        <span className="dot" /> LISTENING STANDBY
      </div>
    </div>
  );
}

function Waveform() {
  const N = 140;
  // Center bars peak higher than edges to give the "voice" shape
  return (
    <div className="waveform" aria-hidden="true">
      {Array.from({ length: N }).map((_, i) => {
        const center = (N - 1) / 2;
        const distFromCenter = Math.abs(i - center) / center; // 0 at center → 1 at edge
        const envelope = 1 - distFromCenter * 0.55; // peak in middle
        const variance = 8 + ((i * 17) % 56);
        const height = Math.max(4, variance * envelope);
        return (
          <span
            key={i}
            style={{ height: `${height}px`, animationDelay: `${i * 0.025}s` }}
          />
        );
      })}
    </div>
  );
}
