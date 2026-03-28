# BizSim — Technical Requirements Document

**Version**: 0.1 (MVP)
**Date**: 2026-03-28
**Author**: 전유성 (luma)

---

## 1. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend Framework | Next.js 15 (App Router) | SSR + API Routes in one |
| Language | TypeScript | Type safety for game logic |
| Styling | Tailwind CSS v4 | Utility-first, fast iteration |
| State Management | Zustand | Lightweight, no boilerplate |
| Charts | Recharts | React-native, sufficient for MVP |
| AI (인터뷰) | Google Gemini Flash (`gemini-2.0-flash`) | 무료 티어, 충분한 품질 |
| Testing | Vitest | ESM-native, fast |
| Deployment | Vercel | Zero-config Next.js |

---

## 2. Architecture

```
Browser
  └─ Zustand Store (decisions, results, financials, chatHistories)
       ├─ /play          → Decision sliders
       ├─ /play/interview → ChatInterface → POST /api/chat (streaming)
       ├─ /play/results   → Recharts + metrics
       └─ /play/financials → P&L / BS / CF tables

Server (Next.js API Routes)
  └─ /api/chat
       ├─ Input: messages[], personaId, decisions
       ├─ Builds system prompt (persona + decisions context)
       └─ Streams Gemini Flash response → ReadableStream
```

### 클라이언트 전용 로직
- `lib/game-engine.ts` — 수요 모델, 시뮬레이션
- `lib/financial-mapper.ts` — 레버 → 재무제표 매핑
- `stores/game-store.ts` — 전체 게임 상태

### 서버 전용 로직
- `app/api/chat/route.ts` — AI API 호출 (키 보호)

---

## 3. Data Models

### Decisions
```typescript
type Decisions = {
  price: number;          // 원 단위 (100,000 ~ 500,000)
  rdBudget: number;       // 연간 R&D 예산 (0 ~ 5,000,000,000)
  adBudget: number;       // 분기 광고 예산 (0 ~ 2,000,000,000)
  production: number;     // 생산 대수 (0 ~ 30,000)
  channels: {
    online: number;       // % (합계 100)
    mart: number;
    direct: number;
  };
  quality: number;        // 1~5
};
```

### SimulationResults
```typescript
type SimulationResults = {
  unitsSold: number;
  revenue: number;
  marketShare: number;
  satisfaction: number;
  segmentDemand: { budget: number; mainstream: number; premium: number };
};
```

### FinancialStatements
```typescript
type FinancialStatements = {
  pnl: PnL;               // 손익계산서
  bs: BalanceSheet;       // 재무상태표
  cf: CashFlow;           // 현금흐름표
};
```

---

## 4. Demand Model

### 시장 규모
- 총 시장: 100,000 유닛/분기
- 세그먼트: 가성비(40%), 일반(40%), 프리미엄(20%)
- 고정 경쟁사 3개 (총 점유율 ~60% 차지)

### 수요 함수
```
demand = baseShare × priceEffect × qualityEffect × adEffect × channelEffect
```

| 효과 | 계산 방식 |
|---|---|
| 가격 탄력성 | `(300,000 / price)^elasticity` — 세그먼트별 elasticity 다름 |
| 품질 효과 | `(quality / 3)^qualityWeight` |
| 광고 효과 | `1 + log(1 + adBudget/maxAd) × adWeight` |
| 채널 효과 | 채널 배분 × 세그먼트 채널 선호도 내적 |

---

## 5. Financial Mapping

### P&L 항목
| 항목 | 계산 |
|---|---|
| 매출 | unitsSold × price |
| 매출원가 | unitsSold × unitCost (= 120,000 + (quality-1) × 25,000) |
| 매출총이익 | 매출 - 매출원가 |
| 광고비 | adBudget |
| R&D비 | rdBudget / 4 (분기화) |
| 기타비용 | 매출 × 5% |
| 영업이익 | 매출총이익 - 운영비 합계 |
| 이자비용 | 고정 50,000,000 |
| 순이익 | 영업이익 - 이자비용 |

---

## 6. AI Persona System

### 페르소나 정의
| ID | 이름 | 나이 | 세그먼트 | 핵심 성향 |
|---|---|---|---|---|
| `budget` | 김지현 | 32 | 가성비 | 가격 민감, 실용적 |
| `early-adopter` | 박민수 | 45 | 얼리어답터 | 기술/품질 중시, 가격 둔감 |
| `brand-loyal` | 이순자 | 58 | 브랜드충성 | 신뢰/AS 중시, 보수적 |

### System Prompt 구조
```
[페르소나 프로필]
[현재 결정 컨텍스트: 가격, 품질, 광고 채널]
[응답 규칙: 300자 이내, 1인칭, 자연스러운 소비자 언어]
```

### API 사양 (POST /api/chat)
```typescript
// Request
{ messages: ChatMessage[], personaId: PersonaId, decisions: Decisions }

// Response
ReadableStream<text/plain; charset=utf-8>  // streaming
```

---

## 7. Environment Variables

| 변수 | 용도 | 필수 |
|---|---|---|
| `GEMINI_API_KEY` | Gemini Flash API 인증 | Yes |

`.env.local` (로컬), Vercel Environment Variables (프로덕션)

---

## 8. Testing Strategy

- **단위 테스트**: `lib/__tests__/` — 게임 엔진 + 재무 매퍼 (14개 통과)
- **통합 테스트**: 미구현 (v1.0에서 `/api/chat` 모킹 테스트 추가 예정)
- **E2E**: 미구현

---

## 9. Performance Requirements

| 항목 | 목표 |
|---|---|
| 시뮬레이션 실행 | < 50ms |
| AI 첫 토큰 | < 2s |
| Vercel Cold Start | < 3s |
| Lighthouse Score | > 80 |

---

## 10. Known Issues / Tech Debt

- SSR에서 Zustand `window` 접근 → `ReferenceError: location is not defined` (비차단, 브라우저에서 정상 작동)
- `channels` 슬라이더가 합계 100% 강제하지 않음 (현재 UI에서 자유 입력)
- 재무제표 현금흐름표 일부 항목 추정값 사용
