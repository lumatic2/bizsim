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
- LLM 호출: 서버 사이드
  - `app/api/chat/` — 페르소나 인터뷰 (Gemini 2.5 Flash)
  - `app/api/debrief/` — 라운드/게임 종료 AI 총평 (로컬 Ollama, gemma4-ko:26b-q8, 스트리밍)
- 상태 관리: Zustand (stores/)

## Runtime Requirements
- 디브리프 기능은 로컬 Ollama 서버(`http://localhost:11434`) + `gemma4-ko:26b-q8` 모델 필요
- 재정의: `OLLAMA_HOST`, `OLLAMA_MODEL` 환경변수 (프로젝트 루트 `.env.local` 권장, 셸 export는 피할 것 — 다른 Ollama 프로젝트와 섞임)

## Key Files
- `lib/game-engine.ts` — 수요 모델 + 시뮬레이션
- `lib/financial-mapper.ts` — 레버 → 재무제표 매핑
- `lib/personas.ts` — AI 소비자 페르소나 정의
- `stores/game-store.ts` — 게임 상태 (Zustand)
