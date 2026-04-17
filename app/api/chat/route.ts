import { getPersona, buildSystemPrompt } from '@/lib/personas';
import type { PersonaId, Decisions, ChatMessage } from '@/lib/types';
import { SERVER_ERROR_MESSAGE } from '@/lib/errors';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4-ko:26b-q8';

export async function POST(req: Request) {
  let body: { messages: ChatMessage[]; personaId: PersonaId; decisions: Decisions };
  try {
    body = await req.json();
  } catch {
    return new Response('잘못된 요청 본문입니다.', { status: 400 });
  }

  const { messages, personaId, decisions } = body;

  if (!messages || messages.length === 0) {
    return new Response('메시지가 비어있습니다.', { status: 400 });
  }

  const persona = getPersona(personaId);
  if (!persona) {
    return new Response('잘못된 페르소나입니다.', { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(persona, decisions);

  const ollamaMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let upstream: Response;
  try {
    upstream = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: ollamaMessages,
        stream: true,
        think: false,
        options: { temperature: 0.7, num_predict: 300 },
      }),
    });
  } catch {
    return new Response(SERVER_ERROR_MESSAGE, { status: 503 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(SERVER_ERROR_MESSAGE, { status: 502 });
  }

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = upstream.body!.getReader();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              const chunk = json?.message?.content;
              if (typeof chunk === 'string' && chunk) {
                controller.enqueue(encoder.encode(chunk));
              }
              if (json.done) {
                controller.close();
                return;
              }
            } catch {
              // Malformed line — skip
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
