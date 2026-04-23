# BizSim — AI 기반 경영 시뮬레이션

## Tech Stack
- Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- Zustand (client state), Recharts (charts)
- LLM: 로컬 Ollama (`gemma4-ko:26b-q8`) only — 외부 LLM SDK 의존 0

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
- LLM 호출: 서버 사이드 — 전부 로컬 Ollama
  - `app/api/chat/` — 페르소나 인터뷰 (gemma4-ko:26b-q8, 스트리밍, temp 0.7)
  - `app/api/debrief/` — 라운드/게임 종료 AI 총평 (gemma4-ko:26b-q8, 스트리밍, temp 0.4)
- 상태 관리: Zustand (stores/)

## Runtime Requirements
- 모든 LLM 경로는 로컬 Ollama(`http://localhost:11434`) + `gemma4-ko:26b-q8` 모델 필요 (외부 API 0)
- 재정의: `OLLAMA_HOST`, `OLLAMA_MODEL` 환경변수 (프로젝트 루트 `.env.local` 권장, 셸 export는 피할 것 — 다른 Ollama 프로젝트와 섞임)
- 배포 모델: 로컬 PC 기동 시에만 서비스 가능. 외부 접근은 Tailscale(`100.x.x.x:3000`) 또는 Cloudflare Tunnel로 노출

## Key Files
- `lib/game-engine.ts` — 수요 모델 + 시뮬레이션
- `lib/financial-mapper.ts` — 레버 → 재무제표 매핑
- `lib/personas.ts` — AI 소비자 페르소나 정의
- `stores/game-store.ts` — 게임 상태 (Zustand)
