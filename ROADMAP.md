# BizSim Roadmap

마지막 업데이트: 2026-04-17
비전: Markstrat의 무료·한국어·AI 네이티브 업그레이드판

---

## 트랙 구조 (2026-04-17 확정)

- **메인 트랙**: 마케팅 시뮬 `/play/*` (홈 `/`는 이리로 리다이렉트)
- **보류 트랙**: 큐잉 시뮬 `/lab/queue` — 활용 계획 생기면 재활성화. 루트 레이아웃에서 분리 완료

---

## 이미 완료 (참고)

PRD v2.0까지 핵심 기능 구현됨:
- 6개 레버, 수요 모델, 3 페르소나 인터뷰 (스트리밍)
- 멀티 라운드 6분기, BS carry-forward, R&D 누적 → quality cap
- 동적 경쟁사 AI (`lib/competitor-ai.ts`)
- 대시보드: 아이콘 그리드, 포지셔닝 맵, 경쟁사 인텔
- 재무제표 3종 (P&L, BS, CF) + 유닛 테스트

---

## 다음 스텝 후보 (마케팅 시뮬)

상단일수록 ROI 높음:

- [x] **게임 종료 화면** — `/play/end`에 누적 매출/이익, 점유율 추이 차트, A/B/C/D 등급
- [x] **AI 디브리프** — 라운드별 + 게임 종료 총평. 로컬 Ollama(`qwen3:14b`) 기반, 스트리밍
- [x] **저장/복원** — Zustand persist 미들웨어, localStorage에 게임 상태 지속. `/play` 레이아웃에서 skipHydration + 수동 rehydrate로 SSR 미스매치 회피. 결정 페이지에 "게임 초기화" 버튼
- [x] **라운드별 디브리프 품질 튜닝** — 판단 원칙 주입(적자 시 지출 증액 금지, 제안 1개, 수치 인용 의무), 상황 태그 사전 계산(재고과잉/품절/점유율변화). Before/After 비교 시 수치 인용 2배 증가
- [x] **인터뷰도 로컬 AI로** — `/api/chat` Gemini → Ollama gemma4-ko:26b-q8
- [x] **미사용 SDK 제거** — `@google/genai`, `@anthropic-ai/sdk` uninstall
- [x] **서버 다운 시 통일된 에러 메시지** — `서버 연결 실패. "yusung@askewly.com"으로 문의` 로 통일 (`lib/errors.ts`)
- [ ] **배포용 LAN/tunnel 문서화** — Tailscale·Cloudflare Tunnel 설정 가이드

## PRD 보류 항목 (장기)

## PRD 보류 항목 (장기)

- [ ] 팀 멀티플레이어
- [ ] 모바일 최적화
- [ ] 회원/저장 서버 사이드
- [ ] 큐잉 시뮬 활용 계획 구체화 후 `/lab/queue` 재가동

---

## 진행 로그

- 2026-04-17 미사용 SDK 제거, 서버 에러 메시지 통일(`lib/errors.ts`), 디브리프 프롬프트에 판단 원칙 + 상황 태그 주입
- 2026-04-17 인터뷰 경로도 로컬 Ollama로 전환 → 외부 API 의존 0
- 2026-04-17 디브리프 모델 `gemma4-ko:26b-q8`로 업그레이드, localStorage 게임 상태 저장/복원 (Zustand persist)
- 2026-04-17 게임 종료 화면(`/play/end`) + AI 디브리프 (로컬 Ollama 스트리밍). 결과 페이지의 하드코딩 디브리프도 교체
- 2026-04-17 큐잉 시뮬을 `/lab/queue`로 격리, 루트 레이아웃 BizSim 복귀, `/` → `/play` 리다이렉트
- 2026-04-08 `0acc4bf` 큐잉 시뮬레이터 + 카페테리아 보딩 씬
- 2026-04-?? `ebce8ca` 멀티 라운드 6분기, 동적 경쟁사, BS carry-forward, R&D 누적
- 2026-03-?? `35a5ba7` 대시보드 아이콘 그리드, 포지셔닝 맵, 경쟁사 인텔
- 2026-03-31 `8119b30` page.tsx 정리
- 2026-03-?? `17d6eb0` Markstrat 스타일 UI 리스타일
- 2026-03-?? `121eb04` BizSim MVP 초기 구현
