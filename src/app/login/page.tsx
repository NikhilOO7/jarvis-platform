"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setStatus("VERIFYING…");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || "ACCESS DENIED");
        setBusy(false);
        return;
      }
      setStatus("ACCESS GRANTED · WELCOME BACK, OPERATOR");
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed.");
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24
      }}
    >
      <div className="panel" style={{ width: "min(420px, 92vw)", padding: "34px 34px 28px", textAlign: "center" }}>
        <div className="arc-reactor" style={{ ["--ar-size" as string]: "110px", position: "relative", margin: "0 auto 20px" }}>
          <div className="ar-halo" />
          <div className="ar-ring ar-ticks" />
          <div className="ar-ring ar-outer" />
          <div className="ar-ring ar-coils" />
          <div className="ar-ring ar-dashed" />
          <div className="ar-ring ar-inner" />
          <div className="ar-core" />
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display, inherit)",
            letterSpacing: "0.3em",
            fontSize: 22,
            margin: "0 0 6px",
            color: "#fff"
          }}
        >
          J.A.R.V.I.S
        </h1>
        <p
          className="mono"
          style={{ fontSize: 10, letterSpacing: "0.24em", color: "var(--accent-2, #ffd27a)", margin: "0 0 26px" }}
        >
          OPERATOR AUTHENTICATION REQUIRED
        </p>

        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="passphrase" style={{ textAlign: "left" }}>Passphrase</label>
            <input
              id="passphrase"
              className="input"
              type="password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••••"
              disabled={busy}
            />
          </div>
          <button className="button" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
            {busy ? "VERIFYING…" : "◉ AUTHENTICATE"}
          </button>
        </form>

        <p className="mono muted" style={{ fontSize: 10, letterSpacing: "0.12em", marginTop: 18, minHeight: 14 }}>
          {status || "SESSION EXPIRES AFTER 30 DAYS OF SILENCE"}
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
