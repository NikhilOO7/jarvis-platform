/* Jarvis Companion — content script.
 * Builds capture PROPOSALS from what is visible, renders the consent HUD,
 * and extracts content only after the user approves each item. */

(() => {
  if (window.__jarvisCompanion) return;
  window.__jarvisCompanion = true;

  const MAX_TEXT = 4000;

  /* ------------------------------ helpers ------------------------------- */

  const clean = (value) => (value || "").replace(/\s+/g, " ").trim();

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.height > 60 && rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 100;
  }

  function absoluteUrl(href) {
    try {
      return new URL(href, location.href).toString();
    } catch {
      return null;
    }
  }

  function detectPlatform() {
    const host = location.hostname;
    if (host.includes("instagram")) return "instagram";
    if (host.includes("facebook")) return "facebook";
    if (host.includes("linkedin")) return "linkedin";
    return host.replace(/^www\./, "");
  }

  function isPrivateConversationPage() {
    const path = location.pathname;
    return path.startsWith("/direct/") || path.startsWith("/messages") || path.includes("/messaging");
  }

  /* ---------------------------- site adapters ---------------------------- */

  function instagramProposals() {
    const proposals = [];
    document.querySelectorAll("article").forEach((article, index) => {
      if (!isVisible(article)) return;
      const author = clean(article.querySelector("header a[href^='/']")?.textContent);
      const caption = clean(article.querySelector("h1")?.textContent) || clean(article.textContent).slice(0, 600);
      const timeLink = article.querySelector("a time")?.closest("a");
      const permalink =
        (timeLink && absoluteUrl(timeLink.getAttribute("href"))) ||
        (/\/(p|reel)\//.test(location.pathname) ? location.href : null);
      if (!caption && !permalink) return;
      proposals.push({
        id: `ig-${index}`,
        kind: "post",
        label: author ? `Post by @${author}` : "Instagram post",
        preview: caption.slice(0, 140),
        extract: () => ({
          title: author ? `Instagram post by @${author}` : "Instagram post",
          url: permalink || location.href,
          visibleText: caption.slice(0, MAX_TEXT),
          platform: "instagram",
          author: author || null,
          kind: "post"
        })
      });
    });
    return proposals;
  }

  function facebookProposals() {
    const proposals = [];
    document.querySelectorAll("div[role='article']").forEach((article, index) => {
      if (!isVisible(article)) return;
      const text = clean(article.innerText).slice(0, 800);
      if (text.length < 60) return;
      const permalinkEl = article.querySelector(
        "a[href*='/posts/'], a[href*='story_fbid'], a[href*='/videos/'], a[href*='/reel/']"
      );
      proposals.push({
        id: `fb-${index}`,
        kind: "post",
        label: `Facebook post`,
        preview: text.slice(0, 140),
        extract: () => ({
          title: `Facebook post: ${text.slice(0, 60)}`,
          url: (permalinkEl && absoluteUrl(permalinkEl.getAttribute("href"))) || location.href,
          visibleText: text.slice(0, MAX_TEXT),
          platform: "facebook",
          kind: "post"
        })
      });
    });
    return proposals.slice(0, 6);
  }

  function linkedinProposals() {
    const proposals = [];
    document.querySelectorAll("[data-urn^='urn:li:activity'], .feed-shared-update-v2").forEach((post, index) => {
      if (!isVisible(post)) return;
      const author = clean(post.querySelector(".update-components-actor__title")?.textContent)?.split("\n")[0];
      const text = clean(post.querySelector(".update-components-text")?.textContent || post.innerText).slice(0, 800);
      if (text.length < 40) return;
      const urn = post.getAttribute("data-urn");
      proposals.push({
        id: `li-${index}`,
        kind: "post",
        label: author ? `Post by ${author}` : "LinkedIn post",
        preview: text.slice(0, 140),
        extract: () => ({
          title: author ? `LinkedIn post by ${author}` : "LinkedIn post",
          url: urn ? `https://www.linkedin.com/feed/update/${urn}/` : location.href,
          visibleText: text.slice(0, MAX_TEXT),
          platform: "linkedin",
          author: author || null,
          kind: "post"
        })
      });
    });
    return proposals.slice(0, 6);
  }

  function genericPageProposal() {
    const meta = (name) =>
      document.querySelector(`meta[property='${name}'], meta[name='${name}']`)?.getAttribute("content");
    const title = clean(meta("og:title") || document.title);
    const description = clean(meta("og:description") || "");
    const body = clean(document.querySelector("article, main")?.innerText || document.body.innerText).slice(0, MAX_TEXT);
    return {
      id: "page",
      kind: "page",
      label: "This page",
      preview: (description || body).slice(0, 140),
      extract: () => ({
        title,
        url: document.querySelector("link[rel='canonical']")?.href || location.href,
        visibleText: [description, body].filter(Boolean).join("\n\n").slice(0, MAX_TEXT),
        platform: detectPlatform(),
        kind: "page"
      })
    };
  }

  function selectionProposal() {
    const selection = clean(String(window.getSelection() || ""));
    if (selection.length < 10) return null;
    return {
      id: "selection",
      kind: "selection",
      label: "Selected text",
      preview: selection.slice(0, 140),
      privateWarning: isPrivateConversationPage(),
      extract: () => ({
        title: `Selection from ${document.title}`.slice(0, 120),
        url: location.href,
        visibleText: selection.slice(0, MAX_TEXT),
        platform: detectPlatform(),
        kind: "selection"
      })
    };
  }

  function listenProposal() {
    const video = Array.from(document.querySelectorAll("video")).find(isVisible);
    if (!video) return null;
    return {
      id: "listen",
      kind: "listen",
      label: "Transcribe playing video",
      preview:
        "Records this tab's audio while you play the video (max 5 min), transcribes it, and saves the brief to your knowledge base."
    };
  }

  function collectProposals(mode) {
    const proposals = [];
    const selected = selectionProposal();
    if (selected) proposals.push(selected);
    if (mode === "selection") return proposals;

    if (isPrivateConversationPage()) {
      // DM rule: never propose bulk reads on conversation pages.
      return proposals;
    }
    const listen = listenProposal();
    if (listen) proposals.push(listen);
    if (mode !== "page") {
      const platform = detectPlatform();
      if (platform === "instagram") proposals.push(...instagramProposals());
      else if (platform === "facebook") proposals.push(...facebookProposals());
      else if (platform === "linkedin") proposals.push(...linkedinProposals());
    }
    proposals.push(genericPageProposal());
    return proposals;
  }

  /* ------------------------------ consent HUD ---------------------------- */

  let host = null;
  const listenState = { active: false, statusEl: null, buttonEl: null, timer: null, startedAt: 0 };

  function startRecTimer(statusEl) {
    listenState.startedAt = Date.now();
    const tick = () => {
      const seconds = Math.floor((Date.now() - listenState.startedAt) / 1000);
      const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
      const ss = String(seconds % 60).padStart(2, "0");
      statusEl.className = "status err"; // red = recording indicator
      statusEl.textContent = `● REC ${mm}:${ss} — audio only, this tab`;
    };
    tick();
    listenState.timer = setInterval(tick, 1000);
  }

  function stopRecTimer() {
    clearInterval(listenState.timer);
    listenState.timer = null;
  }

  function showToast(text, ok) {
    const toast = document.createElement("div");
    toast.style.cssText = [
      "all:initial",
      "position:fixed",
      "z-index:2147483647",
      "bottom:18px",
      "right:18px",
      "max-width:340px",
      "padding:12px 14px",
      "background:rgba(4,14,24,0.95)",
      `border:1px solid ${ok ? "rgba(139,226,139,0.6)" : "rgba(255,180,180,0.6)"}`,
      "border-radius:10px",
      "color:#d7ecf7",
      "font:12px/1.5 ui-monospace,Menlo,monospace",
      "white-space:pre-wrap",
      "word-break:break-word"
    ].join(";");
    toast.textContent = text;
    document.documentElement.appendChild(toast);
    setTimeout(() => toast.remove(), 12000);
  }

  function handleListenResult(result) {
    stopRecTimer();
    listenState.active = false;
    const body = result?.body || {};
    const ok = Boolean(result?.ok);
    const text = ok
      ? `◉ JARVIS · TRANSCRIBED${body.saved ? " · SAVED" : " · NOT SAVED (no database)"}\n\n${(body.summary || "").slice(0, 400)}`
      : `◉ JARVIS · TRANSCRIPTION FAILED\n${body.error || "Unknown error"}`;

    if (listenState.statusEl && host) {
      listenState.statusEl.className = ok ? "status ok" : "status err";
      listenState.statusEl.textContent = ok ? (body.saved ? "✓ TRANSCRIBED & SAVED" : "✓ TRANSCRIBED (not saved)") : `✕ ${body.error || "FAILED"}`.slice(0, 70);
      if (listenState.buttonEl) {
        listenState.buttonEl.disabled = true;
        listenState.buttonEl.textContent = "DONE";
      }
    }
    showToast(text, ok);
  }

  function closeHud() {
    host?.remove();
    host = null;
    document.removeEventListener("keydown", onKeydown, true);
  }

  function onKeydown(event) {
    if (event.key === "Escape") closeHud();
  }

  function render(proposals) {
    closeHud();
    host = document.createElement("div");
    host.style.cssText = "all:initial; position:fixed; z-index:2147483647; bottom:18px; right:18px;";
    const shadow = host.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .panel {
        width: 340px; max-height: 70vh; overflow: auto;
        background: rgba(4, 14, 24, 0.94);
        border: 1px solid rgba(127, 212, 255, 0.45);
        border-radius: 10px;
        box-shadow: 0 0 24px rgba(127, 212, 255, 0.25), inset 0 0 40px rgba(127, 212, 255, 0.04);
        color: #d7ecf7; font: 12px/1.5 ui-monospace, Menlo, monospace;
        backdrop-filter: blur(6px);
      }
      .head {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 12px; border-bottom: 1px solid rgba(127, 212, 255, 0.25);
        color: #7fd4ff; letter-spacing: 0.18em; font-size: 10px;
      }
      .head b { color: #ffd27a; }
      .close { cursor: pointer; color: #d7ecf7; opacity: 0.7; background: none; border: none; font: inherit; }
      .close:hover { opacity: 1; }
      .body { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
      .note { font-size: 10px; opacity: 0.65; letter-spacing: 0.06em; }
      .item { border: 1px solid rgba(127, 212, 255, 0.22); border-radius: 7px; padding: 8px 9px; }
      .item.private { border-color: rgba(255, 178, 107, 0.6); }
      .label { color: #7fd4ff; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 3px; }
      .private-tag { color: #ffb26b; }
      .preview { opacity: 0.8; margin-bottom: 7px; word-break: break-word; }
      .row { display: flex; gap: 6px; align-items: center; }
      button.act {
        cursor: pointer; font: 10px ui-monospace, Menlo, monospace; letter-spacing: 0.14em;
        padding: 5px 10px; border-radius: 5px; border: 1px solid rgba(127, 212, 255, 0.5);
        background: rgba(127, 212, 255, 0.12); color: #bfeaff;
      }
      button.act:hover { background: rgba(127, 212, 255, 0.25); }
      button.act:disabled { opacity: 0.45; cursor: default; }
      button.deny { border-color: rgba(255, 120, 120, 0.4); background: rgba(255, 120, 120, 0.08); color: #ffb4b4; }
      .status { font-size: 10px; letter-spacing: 0.1em; }
      .status.ok { color: #8be28b; }
      .status.err { color: #ffb4b4; }
    `;
    shadow.appendChild(style);

    const panel = document.createElement("div");
    panel.className = "panel";

    const head = document.createElement("div");
    head.className = "head";
    head.innerHTML = `<span>◉ <b>JARVIS</b> · CAPTURE PROPOSALS</span>`;
    const close = document.createElement("button");
    close.className = "close";
    close.textContent = "✕";
    close.addEventListener("click", closeHud);
    head.appendChild(close);
    panel.appendChild(head);

    const body = document.createElement("div");
    body.className = "body";

    const note = document.createElement("div");
    note.className = "note";
    note.textContent =
      proposals.length === 0
        ? "Nothing capturable found. Select text and summon again."
        : "Nothing is read until you approve it. ESC to dismiss.";
    body.appendChild(note);

    proposals.forEach((proposal) => {
      const item = document.createElement("div");
      item.className = proposal.privateWarning ? "item private" : "item";

      const label = document.createElement("div");
      label.className = "label";
      label.textContent = proposal.label;
      if (proposal.privateWarning) {
        const tag = document.createElement("span");
        tag.className = "private-tag";
        tag.textContent = " · PRIVATE CONVERSATION";
        label.appendChild(tag);
      }
      item.appendChild(label);

      const preview = document.createElement("div");
      preview.className = "preview";
      preview.textContent = proposal.preview || "(no preview)";
      item.appendChild(preview);

      const row = document.createElement("div");
      row.className = "row";
      const approve = document.createElement("button");
      approve.className = "act";
      approve.textContent = "APPROVE";
      const deny = document.createElement("button");
      deny.className = "act deny";
      deny.textContent = "DENY";
      const status = document.createElement("span");
      status.className = "status";
      row.append(approve, deny, status);
      item.appendChild(row);

      deny.addEventListener("click", () => item.remove());

      if (proposal.kind === "listen") {
        approve.textContent = "◉ START LISTENING";
        approve.addEventListener("click", () => {
          if (listenState.active) {
            // Second click = stop & transcribe.
            approve.disabled = true;
            status.textContent = "TRANSCRIBING…";
            chrome.runtime.sendMessage({ type: "jarvis:listen-stop" }, () => {});
            stopRecTimer();
            listenState.active = false;
            return;
          }
          status.textContent = "ARMING RECORDER…";
          const metadata = {
            url: location.href,
            title: clean(document.title),
            platform: detectPlatform()
          };
          chrome.runtime.sendMessage({ type: "jarvis:listen-start", metadata }, (result) => {
            if (result?.ok) {
              listenState.active = true;
              listenState.statusEl = status;
              listenState.buttonEl = approve;
              deny.disabled = true;
              approve.textContent = "■ STOP & TRANSCRIBE";
              startRecTimer(status);
            } else {
              status.className = "status err";
              status.textContent = `✕ ${result?.error || "Could not start"}`.slice(0, 70);
            }
          });
        });
      } else {
        approve.addEventListener("click", () => {
          approve.disabled = true;
          deny.disabled = true;
          status.textContent = "CAPTURING…";
          const payload = proposal.extract();
          chrome.runtime.sendMessage({ type: "jarvis:capture", payload }, (result) => {
            if (result?.ok) {
              status.className = "status ok";
              status.textContent = result.body?.duplicate ? "✓ ALREADY KNOWN" : "✓ SAVED TO JARVIS";
            } else {
              status.className = "status err";
              status.textContent = `✕ ${result?.body?.error || "FAILED"}`.slice(0, 60);
              approve.disabled = false;
              deny.disabled = false;
            }
          });
        });
      }

      body.appendChild(item);
    });

    panel.appendChild(body);
    shadow.appendChild(panel);
    document.documentElement.appendChild(host);
    document.addEventListener("keydown", onKeydown, true);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "jarvis:summon") {
      render(collectProposals(message.mode));
    }
    if (message?.type === "jarvis:listen-result") {
      handleListenResult(message.result);
    }
  });
})();
