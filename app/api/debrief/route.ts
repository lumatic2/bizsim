import type { Decisions, SimulationResults, RoundSnapshot } from '@/lib/types';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4-ko:26b-q8';

type RoundBody = {
  mode: 'round';
  round: number;
  decisions: Decisions;
  results: SimulationResults;
  previousResults?: SimulationResults | null;
};

type FinalBody = {
  mode: 'final';
  history: RoundSnapshot[];
};

type DebriefBody = RoundBody | FinalBody;

function fmtKRW(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B원`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M원`;
  return `${v.toLocaleString()}원`;
}

function buildRoundPrompt(body: RoundBody): string {
  const { round, decisions, results, previousResults } = body;
  const competitorAvgPrice = Math.round(
    results.competitors.reduce((s, c) => s + c.price, 0) / Math.max(1, results.competitors.length),
  );
  const leader = results.competitors.reduce(
    (best, c) => (c.marketShare > best.share ? { name: c.name, share: c.marketShare } : best),
    { name: '우리회사', share: results.marketShare },
  );

  const delta = previousResults
    ? `이전 분기 대비: 점유율 ${(results.marketShare - previousResults.marketShare).toFixed(1)}%p, 영업이익 ${fmtKRW(results.operatingProfit - previousResults.operatingProfit)}`
    : '첫 분기';

  return [
    `BizSim 경영 시뮬레이션 ${round}분기 결과를 플레이어에게 2-3문장으로 해설해줘.`,
    `숫자 해석 1개 + 다음 분기 개선 제안 1개를 꼭 포함할 것. 해설만 한국어로 출력, 서론이나 마무리 인사 없이.`,
    ``,
    `[우리회사 의사결정]`,
    `가격 ${fmtKRW(decisions.price)}, 품질 ${decisions.quality}/5, R&D ${fmtKRW(decisions.rdBudget)}, 광고 ${fmtKRW(decisions.adBudget)}, 생산 ${decisions.production.toLocaleString()}대`,
    `채널 온라인 ${decisions.channels.online}% / 마트 ${decisions.channels.mart}% / 직영 ${decisions.channels.direct}%`,
    ``,
    `[성과]`,
    `판매 ${results.unitsSold.toLocaleString()}대 / 매출 ${fmtKRW(results.revenue)} / 영업이익 ${fmtKRW(results.operatingProfit)}`,
    `시장점유율 ${results.marketShare}%, 고객만족도 ${results.satisfaction}`,
    `${delta}`,
    ``,
    `[경쟁 구도]`,
    `경쟁사 평균가 ${fmtKRW(competitorAvgPrice)}, 점유율 1위: ${leader.name} (${leader.share}%)`,
  ].join('\n');
}

function buildFinalPrompt(body: FinalBody): string {
  const { history } = body;
  const totalRevenue = history.reduce((s, r) => s + r.results.revenue, 0);
  const totalProfit = history.reduce((s, r) => s + r.results.operatingProfit, 0);
  const avgShare = history.reduce((s, r) => s + r.results.marketShare, 0) / Math.max(1, history.length);
  const lines = history.map(
    (r) =>
      `R${r.round}: 점유 ${r.results.marketShare}%, 매출 ${fmtKRW(r.results.revenue)}, 영업이익 ${fmtKRW(r.results.operatingProfit)}`,
  );

  return [
    `BizSim 6분기 전체 경영 성과를 플레이어에게 총평해줘. 4-5문장 한국어.`,
    `다음을 모두 포함: (1) 전반적 평가, (2) 가장 잘한 전략, (3) 아쉬운 점, (4) 실무 인사이트 1개.`,
    `해설만 출력, 서론이나 마무리 인사 없이.`,
    ``,
    `[누적 성과]`,
    `총매출 ${fmtKRW(totalRevenue)} / 총 영업이익 ${fmtKRW(totalProfit)} / 평균 점유율 ${avgShare.toFixed(1)}%`,
    ``,
    `[분기별 추이]`,
    ...lines,
  ].join('\n');
}

export async function POST(req: Request) {
  let body: DebriefBody;
  try {
    body = (await req.json()) as DebriefBody;
  } catch {
    return new Response('잘못된 요청 본문입니다.', { status: 400 });
  }

  const prompt = body.mode === 'final' ? buildFinalPrompt(body) : buildRoundPrompt(body);

  let upstream: Response;
  try {
    upstream = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: true,
        think: false,
        options: {
          temperature: body.mode === 'final' ? 0.5 : 0.4,
          num_predict: body.mode === 'final' ? 500 : 300,
        },
      }),
    });
  } catch {
    return new Response(
      `로컬 AI(${OLLAMA_HOST})에 연결할 수 없습니다. Ollama가 실행 중인지 확인하세요.`,
      { status: 503 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(`로컬 AI 오류 (${upstream.status})`, { status: 502 });
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
              if (typeof json.response === 'string' && json.response) {
                controller.enqueue(encoder.encode(json.response));
              }
              if (json.done) {
                controller.close();
                return;
              }
            } catch {
              // Malformed line from Ollama — skip silently
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
