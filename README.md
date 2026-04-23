# BizSim — 경영학 이론 기반 심화 시뮬레이션

스마트홈 가전 시장에서 6분기 동안 제품·마케팅·R&D·재무·인력 결정을 내리며 한국 상법·세법까지 반영된 재무제표로 피드백을 받는 경영 시뮬.

**비전**: 재무·세무회계, 전략론(Porter/BCG/Ansoff), 운영관리(Queueing/EOQ), 고급 마케팅(CLV/Adstock/STP), 인사·조직경제학이 **실제 레버·동학으로 녹아있는** 시뮬레이션.

---

## 경영학 이론 ↔ 게임 레버 대응표

| 영역 | 이론 | BizSim 구현 | 관련 파일 |
|------|------|-------------|-----------|
| **재무회계** | 복식부기·재무제표 3종 | 손익·재무상태·현금흐름 완전 통합 | `lib/financial-mapper.ts` |
| **세무회계** | 법인세·R&D 세액공제·이연법인세 | 과세표준·당기 cash tax + 이연법인세·이월결손금 | `lib/tax.ts`, `lib/financial-mapper.ts` |
| **상법** | §462 배당가능이익 | dividendPayout 한도 자동 clamp | `lib/financial-mapper.ts` |
| **Porter 5 Forces — 공급자** | 교섭력 | AR(1)+drift Supply Price Index, 이벤트 cost multiplier와 곱셈 | `lib/supply.ts` |
| **Porter 5 Forces — 경쟁** | 경쟁 강도 | 경쟁사 R&D 스태미나, 플레이어 Star 시 광고 가속, 공급망 동조 | `lib/competitor-ai.ts` |
| **Porter Generic Strategies** | 비용우위 / 차별화 / 집중화 | 자동 프레임워크 태그 매칭 | `lib/framework-tags.ts` |
| **BCG Growth-Share Matrix** | Star · Cash Cow · Question Mark · Dog | 상대점유율×성장률 4분면 차트 | `lib/bcg.ts` |
| **Ansoff Matrix** | 시장침투 · 시장개발 · 제품개발 | rdAllocation {improve, explore}, 탐색 누적 → 플레이어 전용 시장 +25% | `lib/ansoff.ts` |
| **Wright's Law (경험곡선)** | 80% 학습률 | 제품별 `cumulativeProduction` stock → 원가 체감 | `lib/learning-curve.ts` |
| **조직 학습 (Senge)** | 누적 운영 경험 | 라운드당 +1%, 전 부문 원가 효율성 | `lib/org-learning.ts` |
| **운영관리 — Queueing** | M/M/1 대기행렬 | utilization 기반 만족도 델타, overflow 판매 손실 | `lib/service-queue.ts`, `lib/mm1-metrics.ts` |
| **운영관리 — 리드타임** | 생산 lead time | pendingProduction stock — 이번 분기 결정이 다음 분기에 실현 | `lib/game-engine.ts` |
| **운영관리 — EOQ** | Harris 1913 Q*=√(2DS/H) | 권장 배치 UI 배지 + 재고유지비 5%/분기 | `lib/eoq.ts` |
| **운영관리 — Bullwhip** | Forrester·Lee 1997 | 판매 변동률 > 20% 초과분이 경쟁사·SPI에 증폭 전달 | `lib/bullwhip.ts` |
| **STP (Kotler)** | 세분화 → 타겟팅 → 포지셔닝 | 세그먼트 매력도 + 광고 도달 매트릭스 + 포지셔닝 맵 | `lib/stp.ts` |
| **CLV (Customer Lifetime Value)** | retention 기반 생애가치 | AOV × 1/(1−retention), retention = 0.5×sat + 0.5×brand | `lib/clv.ts` |
| **Adstock (Koyck 1954)** | 광고 carryover | λ=0.5, effectiveAd = current + λ×prevAdstock | `lib/adstock.ts` |
| **인사·조직경제학** | 인력 규모가 채널·R&D 실효성 | 영업팀 → 직영채널 배수, R&D팀 → 실효 R&D 배수 | `lib/labor.ts` |

---

## Tech Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- Zustand (client state, localStorage 복원)
- Recharts (차트)
- LLM: 로컬 Ollama (`gemma4-ko:26b-q8`) — 외부 API 의존 0
  - 소비자 인터뷰 (페르소나 대화)
  - 라운드·최종 AI 디브리프 (경영학 프레임워크 주입된 프롬프트)

---

## Commands

```bash
npm install
npm run dev       # 개발 서버 http://localhost:3000
npm run build     # 프로덕션 빌드
npm test          # Vitest (166개 테스트 — lib/__tests__/*.test.ts)
```

### 로컬 LLM 요구사항

- Ollama 설치 후 `gemma4-ko:26b-q8` 모델 필요:
  ```bash
  ollama pull gemma4-ko:26b-q8
  ```
- 기본 엔드포인트: `http://localhost:11434`
- 재정의 환경변수: `OLLAMA_HOST`, `OLLAMA_MODEL` (프로젝트 루트 `.env.local` 권장)

LLM 없이도 게임 진행은 가능하되, 인터뷰·디브리프 기능은 비활성화됩니다.

---

## 구조

```
app/
  api/
    chat/          페르소나 인터뷰 (스트리밍, temp 0.7)
    debrief/       라운드·최종 디브리프 (스트리밍, temp 0.4~0.5)
  play/
    page.tsx       의사결정 — 5탭(제품·마케팅·R&D·운영·자본) + 민감도 패널
    interview/     페르소나 대화
    results/       분기 결과 — 프레임워크 태그·STP·BCG·CLV·서비스큐 드릴다운·경쟁사 추이
    financials/    재무제표 (PnL·BS·CF·제품별 손익)
    end/           게임 종료 — 누적 성과 + 의사결정 타임라인

lib/
  game-engine.ts       수요 모델 + 시뮬레이션 루프
  financial-mapper.ts  레버 → PnL·BS·CF 매핑
  personas.ts          AI 소비자 페르소나 3종
  competitor-ai.ts     경쟁사 3종 반응 모델
  events.ts            분기 이벤트 카드 (원자재·경쟁·규제·호황 등)
  (이론 구현 모듈들)   bcg / ansoff / supply / learning-curve / service-queue /
                       eoq / bullwhip / clv / adstock / labor / stp / mm1-metrics /
                       org-learning / framework-tags / round-delta / competitor-trend
  tax.ts               법인세 · R&D 세액공제 · 이월결손금 · 이연법인세

stores/
  game-store.ts        Zustand 게임 상태 (20+ stock, localStorage 영속화)
```

---

## 개발 메모

- **테스트 철학**: 이론 공식이 게임 레버로 정확히 매핑되는지를 검증 (166 tests, 20 files)
- **정체성**: 경영학 교과서 내용이 UI·숫자로 드러나는 **학습용** 시뮬. 포트폴리오·배포는 후순위
- **로드맵**: `ROADMAP.md` 참조

## 라이선스

개인 프로젝트. 외부 공개·재배포 계획 없음.
