"use client";

import { useState } from "react";
import { Radio, Send } from "lucide-react";

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

export function CommandConsole() {
  const [command, setCommand] = useState(examples[0]);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [status, setStatus] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Routing command...");
    setResult(null);

    const response = await fetch("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command })
    });
    const data = await response.json();
    setStatus(response.ok ? "Route locked." : data.error || "Unable to route command.");
    if (response.ok) setResult(data);
  }

  return (
    <div className="grid content-grid">
      <div className="card">
        <h2>Command Input</h2>
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="command">Text or transcribed voice command</label>
            <textarea
              className="textarea"
              id="command"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="Tell Jarvis what to do..."
            />
          </div>
          <div className="button-row">
            <button className="button" type="submit">
              <Send size={16} />
              Route Command
            </button>
            <span className="muted">{status}</span>
          </div>
        </form>

        <div className="capability-list large">
          {examples.map((example) => (
            <button className="chip-button" key={example} type="button" onClick={() => setCommand(example)}>
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Routing Result</h2>
        {result ? (
          <div className="list">
            <div className="list-item">
              <div className="pill-row">
                <span className="pill">{result.route.agentKind}</span>
                <span className="pill">{Math.round(result.route.confidence * 100)}% confidence</span>
                <span className="pill">{result.route.risk} risk</span>
              </div>
              <h3 style={{ marginTop: 12 }}>{result.route.workflow.name}</h3>
              <p className="muted">{result.route.workflow.description}</p>
              <div className="label">Rationale</div>
              <p>{result.route.rationale}</p>
              <div className="label">Approval</div>
              <p>{result.route.approvalRequired ? "Required before external action." : "Not required for this dry run."}</p>
              <div className="label">Workflow Run</div>
              {result.workflowRun ? (
                <div className="pill-row">
                  <span className="pill">{result.workflowRun.status}</span>
                  <span className="pill">{result.workflowRun.approvals?.length || 0} approval gates</span>
                  <span className="pill">{result.workflowRun.id.slice(0, 10)}</span>
                </div>
              ) : (
                <p className="muted">{result.message}</p>
              )}
            </div>
            {result.route.workflow.steps.map((step, index) => (
              <div className="timeline-item" key={step.title}>
                <div className="timeline-index">{index + 1}</div>
                <div>
                  <strong>{step.title}</strong>
                  <p className="muted">{step.description}</p>
                  {step.approvalRequired ? <span className="pill">Approval Gate</span> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div>
              <Radio size={28} />
              <p>Awaiting command vector.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
