interface Meta {
  label: string;
  value: string;
  highlight?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  meta
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  meta?: Meta[];
}) {
  // allow inline highlight via [b]text[/b]
  const parts = title.split(/\[b\](.*?)\[\/b\]/);

  return (
    <div className="page-header">
      <div className="lhs">
        <div className="eyebrow">{eyebrow}</div>
        <h1>
          {parts.map((p, i) =>
            i % 2 === 1 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>
          )}
        </h1>
        {description ? <p className="sub">{description}</p> : null}
        {action ? <div className="button-row" style={{ marginTop: 16 }}>{action}</div> : null}
      </div>
      {meta && meta.length > 0 ? (
        <div className="meta">
          {meta.map((m) => (
            <div key={m.label}>
              {m.label} {m.highlight ? <b>{m.value}</b> : m.value}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
