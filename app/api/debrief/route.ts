import type { Decisions, SimulationResults, RoundSnapshot, RoundEvent, ProductId } from '@/lib/types';
import { SERVER_ERROR_MESSAGE } from '@/lib/errors';
import { learningCurveMultiplier } from '@/lib/learning-curve';
import { classifyPressure, PRESSURE_LABELS } from '@/lib/supply';
import { exploreBoostFrom } from '@/lib/ansoff';
import { classifyQuadrant, computeMarketGrowth, QUADRANT_LABELS } from '@/lib/bcg';
import { matchFrameworkTags } from '@/lib/framework-tags';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4-ko:26b-q8';

type RoundBody = {
  mode: 'round';
  round: number;
  decisions: Decisions;
  results: SimulationResults;
  previousResults?: SimulationResults | null;
  event?: RoundEvent | null;
  brandEquity?: number;
  supplyIndex?: number;
  cumulativeProduction?: Record<ProductId, number>;
  cumulativeImproveRd?: number;
  cumulativeExploreRd?: number;
  roundHistory?: RoundSnapshot[];
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
  const { round, decisions, results, previousResults, event, brandEquity, supplyIndex, cumulativeProduction, cumulativeImproveRd, cumulativeExploreRd, roundHistory } = body;
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

  const totalProduction = decisions.products.reduce((s, p) => s + p.production, 0);
  const avgPrice = decisions.products.reduce((s, p) => s + p.price, 0) / decisions.products.length;
  const avgQuality = decisions.products.reduce((s, p) => s + p.quality, 0) / decisions.products.length;

  // BCG 분면 계산
  const topCompetitorShare = results.competitors.reduce((max, c) => (c.marketShare > max ? c.marketShare : max), 0);
  const safeTop = Math.max(topCompetitorShare, 0.1);
  const marketGrowth = computeMarketGrowth(results, roundHistory ?? []);
  const bcgPositions = decisions.products.map((p) => {
    const pr = results.perProduct[p.id];
    const totalMarket = results.marketShare > 0 && results.unitsSold > 0
      ? results.unitsSold / (results.marketShare / 100)
      : Math.max(results.marketSize, 1);
    const productShare = totalMarket > 0 ? (pr.unitsSold / totalMarket) * 100 : 0;
    const relativeShare = productShare / safeTop;
    return { id: p.id, name: p.name, relativeShare, quadrant: classifyQuadrant(relativeShare, marketGrowth) };
  });

  const tags: string[] = [];
  if (results.operatingProfit < 0) tags.push('영업적자');
  else if (results.operatingProfit > results.revenue * 0.1) tags.push('영업흑자 양호');
  if (totalProduction > results.unitsSold * 1.1) tags.push('재고과잉');
  if (totalProduction < results.unitsSold * 0.95) tags.push('품절/수요초과');
  if (avgPrice > competitorAvgPrice * 1.05) tags.push('가격 프리미엄');
  else if (avgPrice < competitorAvgPrice * 0.95) tags.push('저가전략');
  if (previousResults) {
    const shareDelta = results.marketShare - previousResults.marketShare;
    if (shareDelta > 1) tags.push('점유율상승');
    else if (shareDelta < -1) tags.push('점유율하락');
  }
  for (const p of decisions.products) {
    const pr = results.perProduct[p.id];
    if (pr && pr.unitsSold === 0 && p.production > 0) tags.push(`${p.name} 전혀 안 팔림`);
  }
  if (results.serviceQueue.overflow > 0) tags.push(`서비스 overflow ${results.serviceQueue.overflow.toLocaleString()}대`);
  else if (results.serviceQueue.utilization >= 0.9 && results.serviceQueue.utilization !== Infinity) tags.push(`서비스 부하 높음 ρ ${results.serviceQueue.utilization.toFixed(2)}`);
  if (typeof supplyIndex === 'number') {
    const pressure = classifyPressure(supplyIndex);
    if (pressure === 'crisis' || pressure === 'tight') tags.push(`원자재 ${PRESSURE_LABELS[pressure]} (SPI ×${supplyIndex.toFixed(2)})`);
    else if (pressure === 'favorable') tags.push('원자재 약세 호기');
  }
  for (const bcg of bcgPositions) {
    tags.push(`${bcg.id} ${QUADRANT_LABELS[bcg.quadrant]}`);
  }

  const eventLine = event && event.id !== 'calm'
    ? `[이번 분기 이벤트] ${event.title} (${event.severity === 'good' ? '기회' : '리스크'}) — ${event.description}`
    : '[이번 분기 이벤트] 특이사항 없음';
  const brandLine = typeof brandEquity === 'number'
    ? `[브랜드 에쿼티] ${brandEquity.toFixed(0)} / 100 (100에 가까울수록 가격 저항 완화)`
    : null;

  // 전략 레버 상태 라인
  const supplyLine = typeof supplyIndex === 'number'
    ? `[공급자 교섭력] SPI ×${supplyIndex.toFixed(3)} (${PRESSURE_LABELS[classifyPressure(supplyIndex)]}) — 이벤트 costMultiplier와 곱셈으로 원가 반영`
    : null;
  const learningLine = cumulativeProduction
    ? `[학습곡선] A 누적 ${cumulativeProduction.A.toLocaleString()}대 (원가 ×${learningCurveMultiplier(cumulativeProduction.A).toFixed(3)}) · B 누적 ${cumulativeProduction.B.toLocaleString()}대 (원가 ×${learningCurveMultiplier(cumulativeProduction.B).toFixed(3)}) — Wright's Law`
    : null;
  const ansoffBoost = typeof cumulativeExploreRd === 'number' ? exploreBoostFrom(cumulativeExploreRd) : 0;
  const ansoffLine = typeof cumulativeImproveRd === 'number' && typeof cumulativeExploreRd === 'number'
    ? `[Ansoff R&D] 이번 분기 개선/탐색 ${decisions.rdAllocation.improve}/${decisions.rdAllocation.explore}% · 누적 개선 ${fmtKRW(cumulativeImproveRd)} 탐색 ${fmtKRW(cumulativeExploreRd)} → 플레이어 전용 시장 +${(ansoffBoost * 100).toFixed(1)}%`
    : null;
  const queueLine = `[서비스 큐] 용량 ${decisions.serviceCapacity.toLocaleString()}대 · ρ ${results.serviceQueue.utilization === Infinity ? '∞' : results.serviceQueue.utilization.toFixed(2)} · 만족도 델타 ${results.serviceQueue.satisfactionDelta >= 0 ? '+' : ''}${results.serviceQueue.satisfactionDelta}${results.serviceQueue.overflow > 0 ? ` · overflow ${results.serviceQueue.overflow.toLocaleString()}대 판매손실` : ''}`;
  const bcgLine = `[BCG 분면] ${bcgPositions.map((b) => `${b.id} ${QUADRANT_LABELS[b.quadrant]} (상대점유 ${b.relativeShare.toFixed(2)})`).join(' · ')} · 시장성장률 ${marketGrowth.toFixed(1)}%`;

  // 프레임워크 태그 자동 매칭 — 상위 5개. AI가 이를 해설로 변환할 수 있도록 프롬프트에 주입.
  const frameworkTags = (typeof supplyIndex === 'number' && cumulativeProduction && typeof cumulativeExploreRd === 'number' && roundHistory)
    ? matchFrameworkTags({
        decisions, results, roundHistory,
        brandEquity: brandEquity ?? 50,
        supplyIndex,
        cumulativeProduction,
        cumulativeExploreRd,
      }).slice(0, 5)
    : [];
  const frameworkLine = frameworkTags.length > 0
    ? `[경영학 프레임워크 자동 매칭] ${frameworkTags.map((t) => `${t.label}(${t.category})`).join(' · ')}`
    : null;
  const frameworkDetails = frameworkTags.length > 0
    ? frameworkTags.map((t) => `- ${t.label}: ${t.insight}`).join('\n')
    : null;

  const lines: (string | null)[] = [
    `BizSim 경영 시뮬레이션 ${round}분기 결과를 플레이어에게 2-3문장으로 해설해줘.`,
    ``,
    `[판단 원칙]`,
    `- 영업적자 상태면 광고·R&D 증액은 제안 금지. 가격·비용·생산량 조정을 우선 검토.`,
    `- 재고과잉이면 다음 분기 생산 축소 또는 할인 프로모션 제안.`,
    `- 품절/수요초과면 생산 증대 또는 가격 인상 제안.`,
    `- 서비스 overflow가 있으면 serviceCapacity 확충 또는 판매량 조절을 우선 제안.`,
    `- SPI가 crisis/tight일 때 광고 증액 금지, 가격 인상 또는 탐색 R&D 이전 검토.`,
    `- BCG 분면(Star/Cash Cow/Question Mark/Dog)에 맞는 전략 언급 가능 — Star는 공격투자, Cash Cow는 현금창출, Question Mark는 선택집중, Dog는 퇴출검토.`,
    `- 학습곡선 원가계수가 유의미(<0.9)하면 규모경제 기회로 해석.`,
    `- 이벤트가 있으면 해당 이벤트가 성과에 어떻게 작용했는지 한 번 언급.`,
    `- 제안은 정확히 하나만 (여러 개 나열 금지).`,
    `- 구체적인 숫자(%, 금액, 또는 증감폭) 최소 1개를 본문에 인용.`,
    `- "경영학 프레임워크 자동 매칭" 섹션에 이미 상황이 분류되어 있다. 그 중 가장 위에 있는 프레임워크(최고 priority) 하나를 본문에 인용.`,
    `- 해설만 한국어로 출력, 서론이나 마무리 인사 없이.`,
    ``,
    `[상황 태그] ${tags.length > 0 ? tags.join(' · ') : '특이사항 없음'}`,
    eventLine,
    brandLine,
    supplyLine,
    learningLine,
    ansoffLine,
    queueLine,
    bcgLine,
    frameworkLine,
    frameworkDetails ? `\n[프레임워크 상세]\n${frameworkDetails}` : null,
    ``,
    `[우리회사 의사결정]`,
    ...decisions.products.map((p) => {
      const pr = results.perProduct[p.id];
      return `- ${p.name} (${p.id}): 가격 ${fmtKRW(p.price)} 품질 ${p.quality}/5 생산 ${p.production.toLocaleString()}대 → 판매 ${pr ? pr.unitsSold.toLocaleString() : 0}대 / 매출 ${fmtKRW(pr?.revenue ?? 0)}`;
    }),
    `공유: R&D ${fmtKRW(decisions.rdBudget)} (개선 ${decisions.rdAllocation.improve}% / 탐색 ${decisions.rdAllocation.explore}%), 광고 합계 ${fmtKRW(decisions.adBudget.search + decisions.adBudget.display + decisions.adBudget.influencer)} (검색 ${fmtKRW(decisions.adBudget.search)}/디스플레이 ${fmtKRW(decisions.adBudget.display)}/인플루언서 ${fmtKRW(decisions.adBudget.influencer)})`,
    `채널 온라인 ${decisions.channels.online}% / 마트 ${decisions.channels.mart}% / 직영 ${decisions.channels.direct}% · 서비스 capacity ${decisions.serviceCapacity.toLocaleString()}대 · CAPEX ${fmtKRW(decisions.capexInvestment)}`,
    `평균가 ${fmtKRW(avgPrice)} · 평균 품질 ${avgQuality.toFixed(1)}/5`,
    ``,
    `[성과]`,
    `판매 ${results.unitsSold.toLocaleString()}대 / 매출 ${fmtKRW(results.revenue)} / 영업이익 ${fmtKRW(results.operatingProfit)}`,
    `시장점유율 ${results.marketShare}%, 고객만족도 ${results.satisfaction}`,
    `${delta}`,
    ``,
    `[경쟁 구도]`,
    `경쟁사 평균가 ${fmtKRW(competitorAvgPrice)}, 점유율 1위: ${leader.name} (${leader.share}%)`,
  ];
  return lines.filter((l): l is string => l !== null).join('\n');
}

function buildFinalPrompt(body: FinalBody): string {
  const { history } = body;
  const totalRevenue = history.reduce((s, r) => s + r.results.revenue, 0);
  const totalProfit = history.reduce((s, r) => s + r.results.operatingProfit, 0);
  const avgShare = history.reduce((s, r) => s + r.results.marketShare, 0) / Math.max(1, history.length);
  const lines = history.map(
    (r) => {
      const eventTag = r.event && r.event.id !== 'calm' ? ` [${r.event.title}]` : '';
      const spiTag = typeof r.supplyIndex === 'number' ? ` SPI×${r.supplyIndex.toFixed(2)}` : '';
      return `R${r.round}: 점유 ${r.results.marketShare}%, 매출 ${fmtKRW(r.results.revenue)}, 영업이익 ${fmtKRW(r.results.operatingProfit)}, 만족도 ${r.results.satisfaction}${eventTag}${spiTag}`;
    },
  );

  const profitableRounds = history.filter((r) => r.results.operatingProfit > 0).length;
  const peakShare = Math.max(...history.map((r) => r.results.marketShare));
  const peakRound = history.find((r) => r.results.marketShare === peakShare)?.round;
  const overflowRounds = history.filter((r) => r.results.serviceQueue?.overflow > 0).length;
  const finalBrand = history[history.length - 1]?.brandEquity ?? 0;
  const firstBrand = history[0]?.brandEquity ?? 0;

  return [
    `BizSim ${history.length}분기 전체 경영 성과를 플레이어에게 총평해줘. 4-5문장 한국어.`,
    ``,
    `[판단 원칙]`,
    `- 네 가지를 모두 포함: (1) 전반 평가, (2) 가장 잘한 전략, (3) 아쉬운 점, (4) 실무 인사이트 1개.`,
    `- 일반론("가격 경쟁력 강화" 같은 뻔한 말) 금지. 분기별 실제 숫자에 기반한 구체 분석.`,
    `- 전략 프레임워크(BCG, Ansoff, Porter, Wright's Law 중 하나)를 1회 이상 언급해 분석을 뒷받침.`,
    `- 구체 수치 최소 2개 인용 (예: "R${peakRound}에서 점유율 ${peakShare}% 정점", "6분기 중 ${profitableRounds}분기 흑자").`,
    `- 해설만 출력, 서론이나 마무리 인사 없이.`,
    ``,
    `[누적 성과]`,
    `총매출 ${fmtKRW(totalRevenue)} / 총 영업이익 ${fmtKRW(totalProfit)} / 평균 점유율 ${avgShare.toFixed(1)}% / 흑자분기 ${profitableRounds}/${history.length} / 최고 점유율 ${peakShare}% (R${peakRound})`,
    `브랜드 에쿼티 ${firstBrand.toFixed(0)} → ${finalBrand.toFixed(0)}${overflowRounds > 0 ? ` · 서비스 overflow 발생 ${overflowRounds}회` : ''}`,
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
