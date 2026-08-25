"use client";

import { useState } from "react";

type RouteResult = {
  message: string;
  dryRun: boolean;
  executed?: boolean;
  route: {
    agentKind: string;
    confidence: number;
    approvalRequired: boolean;
    risk: string;
    rationale: string;
    suggestedResponse: string;
    routedBy?: "llm" | "keywords";
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
    output?: { summary?: string } | null;
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
    { kind: "system", text: "[boot] web command surface ready · runtime state is reported after routing" },
    { kind: "system", text: "[safety] Phase 0 · tools allowlisted · external email/calendar writes disabled" }
  ]);
  const [busy, setBusy] = useState(false);
  const [deciding, setDeciding] = useState(false);

  async function decideApprovals(decision: "APPROVED" | "REJECTED") {
    const approvals = (result?.workflowRun?.approvals ?? []).filter((a) => a.status === "PENDING");
    if (!result?.workflowRun || approvals.length === 0 || deciding) return;
    setDeciding(true);
    setHistory((h) => [
      ...h,
      { kind: "system", text: `› ${decision === "APPROVED" ? "clearing" : "rejecting"} ${approvals.length} approval gate(s)` }
    ]);

    try {
      let lastRunStatus = result.workflowRun.status;
      for (const approval of approvals) {
        const response = await fetch("/api/approvals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: approval.id, status: decision })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "approval update failed");
        if (data.workflowRun?.status) lastRunStatus = data.workflowRun.status;
        if (decision === "REJECTED") break;
      }

      setResult((r) =>
        r?.workflowRun
          ? {
              ...r,
              workflowRun: {
                ...r.workflowRun,
                status: lastRunStatus,
                approvals: (r.workflowRun.approvals ?? []).map((a) =>
                  a.status === "PENDING" ? { ...a, status: decision } : a
                )
              }
            }
          : r
      );
      setHistory((h) => [
        ...h,
        decision === "APPROVED"
          ? { kind: "ai", text: "Approval recorded. Check the RUNS monitor for the observed execution state." }
          : { kind: "ai", text: "Understood. Run cancelled; nothing was executed.", warn: true }
      ]);
    } catch (e) {
      setHistory((h) => [
        ...h,
        { kind: "system", text: `[error] ${e instanceof Error ? e.message : String(e)}` }
      ]);
    } finally {
      setDeciding(false);
    }
  }

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
        const typed = data as RouteResult;
        setResult(typed);
        const summary = typed.executed ? typed.workflowRun?.output?.summary : null;
        setHistory((h) => [
          ...h,
          {
            kind: "system",
            text: `› ${typed.route.agentKind} agent · ${typed.route.risk.toLowerCase()} risk · routed by ${
              typed.route.routedBy === "llm" ? "model" : "keywords"
            } · ${typed.route.approvalRequired ? "APPROVAL REQUIRED" : "no approval needed"}`
          },
          ...(typed.executed
            ? [{ kind: "system" as const, text: `› execution attempt finished · ${typed.workflowRun?.status ?? "unknown state"}` }]
            : typed.dryRun
              ? [{ kind: "system" as const, text: "› dry run · route evaluated but no workflow was persisted" }]
              : []),
          {
            kind: "ai" as const,
            text: summary || typed.message || typed.route.suggestedResponse || "Route locked.",
            warn: typed.route.approvalRequired
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
                  {(() => {
                    const risk = result.route.risk.toUpperCase();
                    const level = risk === "HIGH" ? 5 : risk === "MEDIUM" ? 3 : 1;
                    return (
                      <>
                        <b className={level > 1 ? "warn" : "ok"}>{risk}</b>
                        <div className="risk-meter">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span key={i} className={i < level ? `on${level >= 4 ? " hi" : ""}` : ""} />
                          ))}
                        </div>
                      </>
                    );
                  })()}
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
              {result.route.approvalRequired &&
              (result.workflowRun?.approvals ?? []).some((a) => a.status === "PENDING") ? (
                <div className="approval-bar">
                  <button className="approve" type="button" disabled={deciding} onClick={() => decideApprovals("APPROVED")}>
                    {deciding ? "◉ WORKING…" : "◉ APPROVE"}
                  </button>
                  <button className="reject" type="button" disabled={deciding} onClick={() => decideApprovals("REJECTED")}>
                    ✕ REJECT
                  </button>
                </div>
              ) : result.workflowRun ? (
                <div className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: 11, marginTop: 8 }}>
                  › run {result.workflowRun.id.slice(0, 8).toUpperCase()} · {result.workflowRun.status}
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
