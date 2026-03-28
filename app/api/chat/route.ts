import Anthropic from '@anthropic-ai/sdk';
import { getPersona, buildSystemPrompt } from '@/lib/personas';
import type { PersonaId, Decisions, ChatMessage } from '@/lib/types';

const anthropic = new Anthropic();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, personaId, decisions } = body as {
      messages: ChatMessage[];
      personaId: PersonaId;
      decisions: Decisions;
    };

    if (!messages || messages.length === 0) {
      return new Response('메시지가 비어있습니다.', { status: 400 });
    }

    const persona = getPersona(personaId);
    if (!persona) {
      return new Response('잘못된 페르소나입니다.', { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(persona, decisions);

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('API 오류가 발생했습니다.', { status: 500 });
  }
}
