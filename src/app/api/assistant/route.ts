import { NextRequest, NextResponse } from 'next/server';

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

// Very light in-memory knowledge base (can be replaced with Firestore/Vector DB later)
const KNOWLEDGE_SNIPPETS: Array<{ id: string; text: string; tags: string[] }> = [
  { id: 'faq-1', text: 'Typical bathroom remodel timelines range from 2 to 6 weeks depending on scope and materials lead times.', tags: ['timeline', 'bathroom', 'remodel'] },
  { id: 'faq-2', text: 'Labor-only pricing: materials are quoted separately after consultation to match your style and budget.', tags: ['pricing', 'labor', 'materials'] },
  { id: 'faq-3', text: 'We offer consultations Monday–Saturday. You can request a time window and we will confirm availability.', tags: ['consultation', 'schedule', 'appointment'] },
  { id: 'svc-1', text: 'Services include kitchen remodeling, bathroom renovation, home additions, custom carpentry, and project management.', tags: ['services', 'kitchen', 'bathroom', 'additions'] },
];

function simpleRetrieve(query: string, k: number = 3): string[] {
  const q = query.toLowerCase();
  const scored = KNOWLEDGE_SNIPPETS.map((s) => {
    const tagHits = s.tags.reduce((acc, t) => (q.includes(t) ? acc + 1 : acc), 0);
    const textHits = s.text.toLowerCase().includes(q) ? 1 : 0;
    return { id: s.id, score: tagHits * 2 + textHits, text: s.text };
  }).sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map((s) => s.text);
}

async function callOpenAI(messages: ChatMessage[], context: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback: rule-based response
    return `Here is what I can tell you right now: ${context}`;
  }
  const sys: ChatMessage = {
    role: 'system',
    content:
      'You are Full Hundred\'s project assistant. Be concise, friendly, and helpful. Use provided context. Ask 2-3 qualifying questions when appropriate (project type, budget, timeline). Offer to schedule a consultation.',
  };
  const ctx: ChatMessage = { role: 'system', content: `Context:\n${context}` };

  const payload = {
    model: 'gpt-4o-mini',
    messages: [sys, ctx, ...messages],
    temperature: 0.4,
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  return content;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, scheduleRequest } = (await request.json()) as {
      messages: ChatMessage[];
      scheduleRequest?: { name?: string; email?: string; phone?: string; preferredTime?: string };
    };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const query = lastUser?.content || '';
    const retrieved = simpleRetrieve(query, 3).join('\n');

    // Optionally handle scheduling intents (MVP: echo back instructions)
    if (scheduleRequest) {
      const { name, email, phone, preferredTime } = scheduleRequest;
      const ack = `Thanks${name ? `, ${name}` : ''}! I\'ve noted your consultation request${preferredTime ? ` for ${preferredTime}` : ''}. We\'ll confirm by email${email ? ` (${email})` : ''}${phone ? ` or phone (${phone})` : ''}.`;
      return NextResponse.json({ reply: ack, scheduled: true });
    }

    const reply = await callOpenAI(messages, retrieved);
    return NextResponse.json({ reply });
  } catch (e) {
    console.error('Assistant API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


