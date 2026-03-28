import { GoogleGenAI } from '@google/genai';
import { getPersona, buildSystemPrompt } from '@/lib/personas';
import type { PersonaId, Decisions, ChatMessage } from '@/lib/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : ('user' as 'user' | 'model'),
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 300,
      },
      contents,
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of response) {
          const text = chunk.text ?? '';
          if (text) {
            controller.enqueue(encoder.encode(text));
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
