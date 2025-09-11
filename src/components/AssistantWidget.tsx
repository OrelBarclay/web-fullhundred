"use client";

import { useEffect, useRef, useState } from "react";

type ChatItem = { role: 'user' | 'assistant'; content: string };

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<ChatItem[]>([
    { role: 'assistant', content: 'Hi! I\'m your project assistant. Ask me about timelines, costs, or schedule a consultation.' }
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setChat((c) => [...c, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const messages = chat.concat({ role: 'user', content: text }).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      const reply = data.reply || 'Sorry, I could not find the answer right now.';
      setChat((c) => [...c, { role: 'assistant', content: reply }]);
    } catch (e) {
      setChat((c) => [...c, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="w-[320px] h-[420px] bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl shadow-xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-[color:var(--border)] flex items-center justify-between">
            <div className="font-medium">Project Assistant</div>
            <button onClick={() => setOpen(false)} className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]">✕</button>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {chat.map((m, i) => (
              <div key={i} className={m.role === 'assistant' ? 'text-sm p-2 rounded-md bg-[color:var(--muted)]' : 'text-sm p-2 rounded-md border border-[color:var(--border)]'}>
                {m.content}
              </div>
            ))}
            {loading && <div className="text-xs text-[color:var(--muted-foreground)]">Assistant is typing…</div>}
            <div ref={endRef} />
          </div>
          <div className="p-2 border-t border-[color:var(--border)] flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Ask about timelines, costs, materials…"
              className="flex-1 rounded-md border border-[color:var(--border)] bg-[color:var(--popover)] px-2 py-2 text-sm"
            />
            <button onClick={sendMessage} disabled={loading} className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50">Send</button>
          </div>
        </div>
      )}
      {!open && (
        <button onClick={() => setOpen(true)} className="rounded-full h-12 w-12 bg-primary text-primary-foreground shadow-lg hover:opacity-90">💬</button>
      )}
    </div>
  );
}


