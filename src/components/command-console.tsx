"use client";

import { useState } from "react";

type RouteResult = {
  message: string;
  dryRun: boolean;
  route: {
    agentKind: string;
    confidence: number;
    approvalRequired: boolean;
    risk: string;
    rationale: string;
    suggestedResponse: string;
    workflow: {
      name: string;
      description: string;
      trigger: string;
      steps: Array<{ title: string; description: string; approvalRequired?: boolean }>;
    };
  };
  workflowRun?: {
    id: string;
    status: string;
    approvals?: Array<{ id: string; status: string }>;
  } | null;
};

const examples = [
  "Draft a professional reply to the latest client email",
  "Schedule a meeting with the team next Tuesday afternoon",
  "Research competitors for my AI assistant product",
  "Log this receipt as a software expense",
  "Calculate the profit margin if price is 49 and cost is 18",
  "Give me my daily executive briefing"
];

type Turn =
  | { kind: "operator"; text: string }
  | { kind: "system"; text: string }
  | { kind: "ai"; text: string; warn?: boolean };

export function CommandConsole() {
  const [command, setCommand] = useState(examples[0]);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [history, setHistory] = useState<Turn[]>([
    { kind: "system", text: "[boot] session authenticated · context loaded · memory buffer ready" },
    { kind: "system", text: "[boot] router model: gpt-4o · 6 agents online · approval gates engaged" }
  ]);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!command.trim()) return;
    setBusy(true);
    setResult(null);
    setHistory((h) => [
      ...h,
      { kind: "operator", text: command },
      { kind: "system", text: "› routing → analyzing intent · classifying risk · selecting agent" }
    ]);

    try {
      const response = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command })
      });
      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setHistory((h) => [
          ...h,
          {
            kind: "system",
            text: `› ${data.route.agentKind} agent · ${data.route.risk.toLowerCase()} risk · ${
              data.route.approvalRequired ? "APPROVAL REQUIRED" : "no approval needed"
            }`
          },
          {
            kind: "ai",
            text: data.route.suggestedResponse || data.message || "Route locked.",
            warn: data.route.approvalRequired
          }
        ]);
      } else {
        setHistory((h) => [
          ...h,
          { kind: "system", text: `[error] ${data.error || "unable to route command"}` }
        ]);
      }
    } catch (e) {
      setHistory((h) => [
        ...h,
        { kind: "system", text: `[error] network failure: ${e instanceof Error ? e.message : String(e)}` }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1.4fr) 340px", gap: 18 }}>
      <div>
        <div className="terminal">
          {history.map((t, i) => (
            <div className="line" key={i}>
              {t.kind === "operator" ? (
                <>
                  <span className="prompt">operator ›</span>{" "}
                  <span className="you">{t.text}</span>
                </>
              ) : t.kind === "system" ? (
                <span className="sys">{t.text}</span>
              ) : (
                <>
                  <span className="ai">Jarvis ›</span>{" "}
                  <span className={t.warn ? "warn" : ""}>{t.text}</span>
                </>
              )}
            </div>
          ))}
          <div className="line">
            <span className="prompt">operator ›</span>
            <span className="cursor" />
          </div>
        </div>

        <form className="input-bar" onSubmit={submit}>
          <span className="chev">›</span>
          <input
            className="input"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Tell Jarvis what to do..."
            disabled={busy}
          />
          <button className="button" type="submit" disabled={busy}>
            {busy ? "ROUTING…" : "ROUTE"}
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {examples.map((example) => (
            <button
              className="chip-button"
              key={example}
              type="button"
              onClick={() => setCommand(example)}
            >
              › {example}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="routing-card">
          <h4>ACTIVE ROUTING</h4>
          {result ? (
            <>
              <dl className="kv">
                <dt>Intent</dt>
                <dd><b>{result.route.agentKind.toUpperCase()}</b></dd>
                <dt>Agent</dt>
                <dd><b className="ok">{result.route.agentKind.toUpperCase()}</b></dd>
                <dt>Workflow</dt>
                <dd>{result.route.workflow.name}</dd>
                <dt>Risk</dt>
                <dd>
                  <b className={result.route.risk === "HIGH" ? "warn" : result.route.risk === "MEDIUM" ? "warn" : "ok"}>
                    {result.route.risk}
                  </b>
                  <div className="risk-meter">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const level = result.route.risk === "HIGH" ? 5 : result.route.risk === "MEDIUM" ? 3 : 1;
                      return <span key={i} className={i < level ? `on${level >= 4 ? " hi" : ""}` : ""} />;
                    })}
                  </div>
                </dd>
                <dt>Confidence</dt>
                <dd><b className="ok">{(result.route.confidence * 100).toFixed(0)}%</b></dd>
                <dt>Approval</dt>
                <dd>
                  <b className={result.route.approvalRequired ? "warn" : "ok"}>
                    {result.route.approvalRequired ? "REQUIRED" : "NOT REQUIRED"}
                  </b>
                </dd>
              </dl>
              {result.route.approvalRequired ? (
                <div className="approval-bar">
                  <button className="approve">◉ APPROVE</button>
                  <button className="reject">✕ REJECT</button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.7 }}>
              <div>› awaiting command vector</div>
              <div>› router idle</div>
            </div>
          )}
        </div>

        <div className="routing-card">
          <h4>EXECUTION STEPS</h4>
          {result ? (
            <div className="timeline-list" style={{ marginTop: 6 }}>
              {result.route.workflow.steps.map((step, index) => (
                <div className="timeline-item" key={step.title}>
                  <div className="timeline-index">{index + 1}</div>
                  <div className="module-icon compact">
                    <span style={{ fontSize: 11 }}>›</span>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 3 }}>
                      {step.title}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>{step.description}</div>
                    {step.approvalRequired ? <span className="pill" style={{ marginTop: 6, display: "inline-block" }}>APPROVAL GATE</span> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              Route a command to see the pipeline.
            </div>
          )}
        </div>

        <div className="routing-card">
          <h4>QUICK COMMANDS</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button className="approve" style={{ textAlign: "left" }} type="button" onClick={() => setCommand("Brief me on today")}>› Brief me on today</button>
            <button className="approve" style={{ textAlign: "left" }} type="button" onClick={() => setCommand("Plan this week's workouts")}>› Plan this week's workouts</button>
            <button className="approve" style={{ textAlign: "left" }} type="button" onClick={() => setCommand("Compare 3 saved laptops")}>› Compare 3 saved laptops</button>
            <button className="approve" style={{ textAlign: "left" }} type="button" onClick={() => setCommand("Summarize unread important emails")}>› Summarize unread important emails</button>
          </div>
        </div>
      </div>
    </div>
  );
}
