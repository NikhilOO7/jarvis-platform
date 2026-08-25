"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

const PROMPTS = [
  "Summarize my saved tech posts about RAG",
  "What recipes do I have for high-protein dinners?",
  "Compare the jobs I saved this month",
  "Build a workout split from saved exercises",
  "Find newer evidence on creatine vs. my saves"
];

export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "[boot] saved-memory query surface ready · runtime checked on first request" },
    {
      role: "assistant",
      content: "Good evening. Ask what you want to plan, compare, learn, or remember."
    }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [retrievalMode, setRetrievalMode] = useState("NOT YET QUERIED");
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "user", content: question },
      { role: "system", content: "› retrieving memory · ranking sources · synthesizing answer" }
    ]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, sessionId: sessionId ?? undefined })
      });
      const data = await response.json();
      if (data.sessionId) setSessionId(data.sessionId);
      if (!response.ok) setRetrievalMode("UNAVAILABLE");
      else if (typeof data.retrieval === "string") setRetrievalMode(data.retrieval.toUpperCase());
      const sources = Array.isArray(data.sources)
        ? (data.sources as Array<{ title: string }>).map((s) => s.title).slice(0, 3)
        : [];
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer || data.error || "I could not answer that yet." },
        ...(sources.length
          ? [{ role: "system" as const, content: `› grounded in: ${sources.join(" · ")}` }]
          : [])
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "system", content: `[error] ${e instanceof Error ? e.message : String(e)}` }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1.4fr) 340px", gap: 18 }}>
      <div>
        <div className="terminal" ref={terminalRef} style={{ maxHeight: 480, overflowY: "auto" }}>
          {messages.map((m, i) => (
            <div className="line" key={i}>
              {m.role === "user" ? (
                <>
                  <span className="prompt">operator ›</span> <span className="you">{m.content}</span>
                </>
              ) : m.role === "system" ? (
                <span className="sys">{m.content}</span>
              ) : (
                <>
                  <span className="ai">Jarvis ›</span> <span>{m.content}</span>
                </>
              )}
            </div>
          ))}
          {!busy ? (
            <div className="line">
              <span className="prompt">operator ›</span>
              <span className="cursor" />
            </div>
          ) : (
            <div className="line">
              <span className="sys">› processing</span>
              <span className="cursor" />
            </div>
          )}
        </div>

        <form className="input-bar" onSubmit={submit}>
          <span className="chev">›</span>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about saved recipes, jobs, products, workouts, tech..."
            disabled={busy}
          />
          <button className="button" type="submit" disabled={busy}>
            {busy ? "ASKING…" : "ASK"}
          </button>
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="routing-card">
          <h4>SESSION CONTEXT</h4>
          <dl className="kv">
            <dt>Mode</dt>
            <dd>
              <b className={retrievalMode === "UNAVAILABLE" ? "warn" : retrievalMode === "NOT YET QUERIED" ? "" : "ok"}>
                {retrievalMode}
              </b>
            </dd>
            <dt>Source</dt>
            <dd>saved memory only</dd>
            <dt>Turns</dt>
            <dd><b>{messages.filter((m) => m.role !== "system").length}</b></dd>
            <dt>Session</dt>
            <dd><b className={sessionId ? "ok" : ""}>{sessionId ? "PERSISTED" : "NEW"}</b></dd>
          </dl>
        </div>

        <div className="routing-card">
          <h4>SUGGESTED QUERIES</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                className="approve"
                style={{ textAlign: "left" }}
                onClick={() => setInput(p)}
              >
                › {p}
              </button>
            ))}
          </div>
        </div>

        <div className="routing-card">
          <h4>SAFETY</h4>
          <div className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.7 }}>
            <div>· Queries saved memory only.</div>
            <div>· No external web retrieval.</div>
            <div>· No action tools available in chat.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
