# BizSim — AI 기반 경영 시뮬레이션

## Tech Stack
- Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- Zustand (client state), Recharts (charts)
- Claude API (@anthropic-ai/sdk) — server-side only

## Commands
- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm test` — Vitest 유닛 테스트
- `npm run test:watch` — 테스트 워치 모드

## Testing
- Vitest
- 테스트 파일: `lib/__tests__/*.test.ts`

## Architecture
- 게임 엔진 (수요 모델, 재무제표): 클라이언트 사이드 (lib/)
- Claude API 호출: 서버 사이드 (app/api/chat/)
- 상태 관리: Zustand (stores/)

## Key Files
- `lib/game-engine.ts` — 수요 모델 + 시뮬레이션
- `lib/financial-mapper.ts` — 레버 → 재무제표 매핑
- `lib/personas.ts` — AI 소비자 페르소나 정의
- `stores/game-store.ts` — 게임 상태 (Zustand)
