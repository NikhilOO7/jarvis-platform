/* eslint-disable @next/next/no-img-element */
export function HologramStage() {
  return (
    <div className="hologram-stage">
      <img className="bg-ring" src="/images/jarvis%204.png" alt="" aria-hidden="true" />
      <img className="bg-ring reverse" src="/images/jarvis%206.png" alt="" aria-hidden="true" />
      <img className="dust" src="/images/jarvis%205.webp" alt="" aria-hidden="true" />
      <img className="chest-reactor" src="/images/jarvis%206.png" alt="" aria-hidden="true" />
      <img className="iron-man" src="/images/iron-man-hologram.png" alt="Iron Man hologram standby" />
      <div className="hologram-base" />
    </div>
  );
}
