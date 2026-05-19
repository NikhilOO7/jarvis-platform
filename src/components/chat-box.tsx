"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Good evening. The knowledge base is standing by. Ask what you want to plan, compare, learn, or remember."
    }
  ]);
  const [input, setInput] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;

    setInput("");
    setMessages((current) => [...current, { role: "user", content: question }]);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    const data = await response.json();
    setMessages((current) => [...current, { role: "assistant", content: data.answer || data.error || "I could not answer that yet." }]);
  }

  return (
    <div className="grid">
      <div className="terminal">
        <div className="list">
          {messages.map((message, index) => (
            <div className="list-item" key={`${message.role}-${index}`}>
              <div className="label">{message.role === "user" ? "You" : "Jarvis"}</div>
              <div>{message.content}</div>
            </div>
          ))}
        </div>
      </div>
      <form className="button-row" onSubmit={submit}>
        <input
          className="input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about saved recipes, jobs, products, workouts, or tech..."
          style={{ flex: 1, minWidth: 240 }}
        />
        <button className="button" type="submit" aria-label="Send">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
