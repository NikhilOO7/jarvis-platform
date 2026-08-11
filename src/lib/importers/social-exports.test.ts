import { describe, expect, it } from "vitest";
import { parseSocialExport } from "@/lib/importers/social-exports";

function mojibake(text: string): string {
  return Buffer.from(text, "utf8").toString("latin1");
}

describe("Instagram saved posts", () => {
  it("parses saves with author, permalink, and timestamp", () => {
    const json = JSON.stringify({
      saved_saved_media: [
        {
          title: "fitcoach_dan",
          string_map_data: {
            "Saved on": { href: "https://www.instagram.com/reel/ABC/", timestamp: 1722902400 }
          }
        }
      ]
    });
    const result = parseSocialExport("saved_posts.json", json);
    expect(result.detected).toBe("Instagram saved posts");
    expect(result.platform).toBe("instagram");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].url).toBe("https://www.instagram.com/reel/ABC/");
    expect(result.items[0].author).toBe("fitcoach_dan");
  });
});

describe("Meta chat threads", () => {
  const thread = {
    participants: [{ name: "Nikhil" }, { name: mojibake("José") }],
    title: mojibake("José"),
    thread_path: "inbox/jose_1",
    messages: [
      { sender_name: mojibake("José"), timestamp_ms: 2000, content: mojibake("café tomorrow — let’s go") },
      { sender_name: "Nikhil", timestamp_ms: 1000, content: "Sure", share: { link: "https://example.com/doc" } }
    ]
  };

  it("repairs mojibake and builds a chronological transcript", () => {
    const result = parseSocialExport("message_1.json", JSON.stringify(thread));
    expect(result.detected).toBe("Chat thread (Meta export)");
    expect(result.items).toHaveLength(1);
    const text = result.items[0].text ?? "";
    expect(text).toContain("café tomorrow — let’s go");
    expect(text).not.toContain("cafÃ©");
    // export order is newest-first; transcript must be chronological
    expect(text.indexOf("Sure")).toBeLessThan(text.indexOf("café"));
    expect(text).toContain("[shared: https://example.com/doc]");
  });

  it("keeps participants and shared links as metadata", () => {
    const result = parseSocialExport("message_1.json", JSON.stringify(thread));
    const metadata = result.items[0].metadata as { participants: string[]; sharedLinks: string[] };
    expect(metadata.participants).toContain("José");
    expect(metadata.sharedLinks).toContain("https://example.com/doc");
  });
});

describe("LinkedIn CSVs", () => {
  it("groups messages.csv into one item per conversation", () => {
    const csv = [
      "CONVERSATION ID,FROM,TO,DATE,CONTENT",
      'conv-1,Priya,Nikhil,2026-08-01,"Congrats, really!"',
      "conv-1,Nikhil,Priya,2026-08-01,Thanks",
      "conv-2,Sam,Nikhil,2026-08-02,Ping"
    ].join("\n");
    const result = parseSocialExport("messages.csv", csv);
    expect(result.detected).toBe("LinkedIn messages");
    expect(result.items).toHaveLength(2);
    expect(result.items[0].text).toContain("Priya: Congrats, really!");
    expect(result.items[0].text).toContain("Nikhil: Thanks");
  });

  it("parses saved-item CSVs by sniffing the link column", () => {
    const csv = ["Date,Link,Title", "2026-07-30,https://linkedin.com/posts/x,Great role"].join("\n");
    const result = parseSocialExport("Saved_Items.csv", csv);
    expect(result.detected).toBe("LinkedIn saved items");
    expect(result.items[0].url).toBe("https://linkedin.com/posts/x");
    expect(result.items[0].title).toBe("Great role");
  });

  it("handles quoted fields with embedded commas and quotes", () => {
    const csv = ['Date,Link,Title', '2026-01-01,https://a.com,"Say ""hi"", then leave"'].join("\n");
    const result = parseSocialExport("Saved_Items.csv", csv);
    expect(result.items[0].title).toBe('Say "hi", then leave');
  });
});

describe("fallbacks", () => {
  it("extracts links from unknown JSON shapes", () => {
    const json = JSON.stringify({ stuff: [{ name: "A save", url: "https://x.com/1", extra: 1 }] });
    const result = parseSocialExport("mystery.json", json);
    expect(result.detected).toContain("Generic");
    expect(result.items[0].url).toBe("https://x.com/1");
  });

  it("reports unreadable input honestly instead of throwing", () => {
    expect(parseSocialExport("broken.json", "{not json").detected).toBe("Unreadable JSON");
    expect(parseSocialExport("notes.txt", "just some text").detected).toBe("Unrecognized file format");
  });
});
