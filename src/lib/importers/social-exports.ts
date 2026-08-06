/**
 * Parsers for official platform data exports (Meta "Download your information",
 * LinkedIn "Get a copy of your data"). Explicit-capture only — users download
 * their own archives and upload the JSON/CSV files here. No scraping.
 */

export type ParsedItem = {
  title: string | null;
  url?: string | null;
  text?: string | null;
  platform: string;
  author?: string | null;
  metadata?: Record<string, unknown>;
};

export type ParseResult = {
  detected: string;
  platform: string;
  items: ParsedItem[];
  skipped: number;
};

const MAX_ITEMS_PER_FILE = 500;
const MAX_TRANSCRIPT_CHARS = 7000;

/** Meta exports serialize UTF-8 bytes as latin1 escapes (mojibake); re-decode them. */
function fixMojibake(value: string): string {
  if (!/[\u00c2-\u00f4][\u0080-\u00bf]/.test(value)) return value;
  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

function toIso(timestamp: number | undefined): string | undefined {
  if (!timestamp) return undefined;
  const ms = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function isRecord(value: JsonValue | undefined): value is { [key: string]: JsonValue } {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/* ------------------------- Instagram saved posts ------------------------- */

function parseInstagramSaved(root: { [key: string]: JsonValue }): ParseResult | null {
  const list = root.saved_saved_media;
  if (!Array.isArray(list)) return null;

  const items: ParsedItem[] = [];
  for (const entry of list.slice(0, MAX_ITEMS_PER_FILE)) {
    if (!isRecord(entry)) continue;
    const author = typeof entry.title === "string" ? fixMojibake(entry.title) : null;
    let href: string | null = null;
    let savedAt: string | undefined;
    if (isRecord(entry.string_map_data)) {
      for (const value of Object.values(entry.string_map_data)) {
        if (!isRecord(value)) continue;
        if (typeof value.href === "string" && value.href) href = value.href;
        if (typeof value.timestamp === "number") savedAt = toIso(value.timestamp);
      }
    }
    if (!href && !author) continue;
    items.push({
      title: author ? `Instagram save from @${author}` : "Instagram save",
      url: href,
      platform: "instagram",
      author,
      metadata: { exportKind: "instagram_saved", savedAt }
    });
  }

  return { detected: "Instagram saved posts", platform: "instagram", items, skipped: Math.max(0, list.length - items.length) };
}

/* ----------------------- Meta (IG/FB) message thread --------------------- */

function parseMetaMessages(root: { [key: string]: JsonValue }, platformHint: string): ParseResult | null {
  if (!Array.isArray(root.messages) || !Array.isArray(root.participants)) return null;

  const participants = root.participants
    .map((participant) => (isRecord(participant) && typeof participant.name === "string" ? fixMojibake(participant.name) : null))
    .filter((name): name is string => Boolean(name));

  type Message = { sender: string; at?: string; content: string };
  const messages: Message[] = [];
  const sharedLinks: string[] = [];

  for (const message of root.messages) {
    if (!isRecord(message)) continue;
    const sender = typeof message.sender_name === "string" ? fixMojibake(message.sender_name) : "Unknown";
    const at = typeof message.timestamp_ms === "number" ? toIso(message.timestamp_ms) : undefined;
    let content = typeof message.content === "string" ? fixMojibake(message.content) : "";
    if (isRecord(message.share) && typeof message.share.link === "string") {
      sharedLinks.push(message.share.link);
      content = content ? `${content} [shared: ${message.share.link}]` : `[shared: ${message.share.link}]`;
    }
    if (!content) continue;
    messages.push({ sender, at, content });
  }

  if (messages.length === 0) return null;

  // Export order is newest-first; build a chronological transcript of the most recent messages.
  const recent = messages.slice(0, 400).reverse();
  let transcript = "";
  for (const message of recent) {
    const line = `${message.sender}: ${message.content}\n`;
    if (transcript.length + line.length > MAX_TRANSCRIPT_CHARS) break;
    transcript += line;
  }

  const threadTitle =
    typeof root.title === "string" && root.title
      ? fixMojibake(root.title)
      : participants.join(", ") || "Conversation";
  const platform =
    typeof root.thread_path === "string" && root.thread_path.includes("instagram") ? "instagram" : platformHint;

  return {
    detected: "Chat thread (Meta export)",
    platform,
    items: [
      {
        title: `Chat: ${threadTitle}`,
        text: transcript.trim(),
        platform,
        author: participants.join(", ") || null,
        metadata: {
          exportKind: "meta_chat_thread",
          participants,
          messageCount: messages.length,
          sharedLinks: sharedLinks.slice(0, 25)
        }
      }
    ],
    skipped: 0
  };
}

/* ------------------------- Facebook saved items -------------------------- */

function findUrl(value: JsonValue, depth = 0): string | null {
  if (depth > 6) return null;
  if (typeof value === "string") return /^https?:\/\//.test(value) ? value : null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findUrl(entry, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (isRecord(value)) {
    for (const key of ["url", "href", "link", "uri"]) {
      const direct = value[key];
      if (typeof direct === "string" && /^https?:\/\//.test(direct)) return direct;
    }
    for (const entry of Object.values(value)) {
      const found = findUrl(entry, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function parseFacebookSaved(root: { [key: string]: JsonValue }): ParseResult | null {
  const savedKey = Object.keys(root).find((key) => /saved/i.test(key) && Array.isArray(root[key]));
  if (!savedKey) return null;
  const list = root[savedKey] as JsonValue[];

  const items: ParsedItem[] = [];
  for (const entry of list.slice(0, MAX_ITEMS_PER_FILE)) {
    if (!isRecord(entry)) continue;
    const title = typeof entry.title === "string" ? fixMojibake(entry.title) : null;
    const url = findUrl(entry);
    const savedAt = typeof entry.timestamp === "number" ? toIso(entry.timestamp) : undefined;
    if (!title && !url) continue;
    items.push({
      title: title || "Facebook save",
      url,
      platform: "facebook",
      metadata: { exportKind: "facebook_saved", savedAt }
    });
  }

  if (items.length === 0) return null;
  return { detected: "Facebook saved items", platform: "facebook", items, skipped: Math.max(0, list.length - items.length) };
}

/* ------------------------------- CSV (LinkedIn) -------------------------- */

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function parseLinkedInCsv(text: string): ParseResult | null {
  const rows = parseCsv(text);
  if (rows.length < 2) return null;
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const body = rows.slice(1);

  const col = (...names: string[]) => headers.findIndex((header) => names.some((name) => header.includes(name)));

  // messages.csv → one knowledge item per conversation
  const convCol = col("conversation id");
  const fromCol = col("from");
  const contentCol = col("content");
  if (convCol >= 0 && fromCol >= 0 && contentCol >= 0) {
    const threads = new Map<string, string[]>();
    const namesByThread = new Map<string, Set<string>>();
    for (const row of body) {
      const id = row[convCol] || "unknown";
      const line = `${row[fromCol] || "Unknown"}: ${row[contentCol] || ""}`.trim();
      if (!row[contentCol]) continue;
      if (!threads.has(id)) {
        threads.set(id, []);
        namesByThread.set(id, new Set());
      }
      threads.get(id)!.push(line);
      if (row[fromCol]) namesByThread.get(id)!.add(row[fromCol]);
    }
    const items: ParsedItem[] = [];
    for (const [id, lines] of Array.from(threads.entries()).slice(0, MAX_ITEMS_PER_FILE)) {
      const participants = Array.from(namesByThread.get(id) ?? []);
      items.push({
        title: `LinkedIn chat: ${participants.join(", ") || id}`,
        text: lines.join("\n").slice(0, MAX_TRANSCRIPT_CHARS),
        platform: "linkedin",
        author: participants.join(", ") || null,
        metadata: { exportKind: "linkedin_messages", conversationId: id, messageCount: lines.length }
      });
    }
    return { detected: "LinkedIn messages", platform: "linkedin", items, skipped: Math.max(0, threads.size - items.length) };
  }

  // Saved items / shares / any CSV with a link column → one item per row
  const urlCol = headers.findIndex(
    (header, index) =>
      header.includes("link") || header.includes("url") || body.some((row) => /^https?:\/\//.test(row[index] ?? ""))
  );
  if (urlCol >= 0) {
    const titleCol = col("title", "name", "description", "sharecommentary");
    const dateCol = col("date");
    const items: ParsedItem[] = [];
    for (const row of body.slice(0, MAX_ITEMS_PER_FILE)) {
      const url = row[urlCol]?.trim();
      if (!url || !/^https?:\/\//.test(url)) continue;
      items.push({
        title: (titleCol >= 0 && row[titleCol]?.trim()) || "LinkedIn saved item",
        url,
        platform: "linkedin",
        metadata: { exportKind: "linkedin_saved", savedAt: dateCol >= 0 ? row[dateCol] : undefined }
      });
    }
    if (items.length === 0) return null;
    return { detected: "LinkedIn saved items", platform: "linkedin", items, skipped: Math.max(0, body.length - items.length) };
  }

  return null;
}

/* --------------------------- Generic JSON fallback ----------------------- */

function parseGenericJson(root: JsonValue): ParseResult | null {
  const items: ParsedItem[] = [];

  function walk(value: JsonValue, depth: number) {
    if (items.length >= MAX_ITEMS_PER_FILE || depth > 6) return;
    if (Array.isArray(value)) {
      for (const entry of value) walk(entry, depth + 1);
      return;
    }
    if (!isRecord(value)) return;
    const url = findUrl(value, 5);
    const title =
      typeof value.title === "string" ? fixMojibake(value.title) : typeof value.name === "string" ? fixMojibake(value.name) : null;
    if (url && (title || Object.keys(value).length <= 6)) {
      items.push({ title: title || "Imported save", url, platform: "export", metadata: { exportKind: "generic_json" } });
      return;
    }
    for (const entry of Object.values(value)) walk(entry, depth + 1);
  }

  walk(root, 0);
  if (items.length === 0) return null;
  return { detected: "Generic export (auto-extracted links)", platform: "export", items, skipped: 0 };
}

/* --------------------------------- Entry --------------------------------- */

export function parseSocialExport(fileName: string, text: string, platformHint?: string): ParseResult {
  const hint = platformHint?.toLowerCase() || (fileName.toLowerCase().includes("insta") ? "instagram" : "facebook");
  const trimmed = text.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let root: JsonValue;
    try {
      root = JSON.parse(trimmed) as JsonValue;
    } catch {
      return { detected: "Unreadable JSON", platform: hint, items: [], skipped: 0 };
    }
    if (isRecord(root)) {
      const result =
        parseInstagramSaved(root) ?? parseMetaMessages(root, hint) ?? parseFacebookSaved(root) ?? parseGenericJson(root);
      if (result) return result;
    } else {
      const result = parseGenericJson(root);
      if (result) return result;
    }
    return { detected: "Unrecognized JSON export", platform: hint, items: [], skipped: 0 };
  }

  const csv = parseLinkedInCsv(text);
  if (csv) return csv;

  return { detected: "Unrecognized file format", platform: hint, items: [], skipped: 0 };
}
