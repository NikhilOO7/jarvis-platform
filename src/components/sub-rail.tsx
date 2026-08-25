interface ExtraMetric {
  label: string;
  value: string | number;
  variant?: "default" | "warn" | "ok";
}

interface SubRailProps {
  /** Right-side static metrics, e.g. counts pulled server-side */
  extras?: ExtraMetric[];
}

export function SubRail({ extras }: SubRailProps) {
  return (
    <div className="subrail">
      <div className="gauge">
        <label>TELEMETRY</label>
        <span className="val warn">NOT CONNECTED</span>
      </div>
      <div className="gauge">
        <label>DATA POLICY</label>
        <span className="val">OBSERVED ONLY</span>
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
