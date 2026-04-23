# BizSim Roadmap

마지막 업데이트: 2026-04-24 (2)
정체성: **경영학 이론 기반 심화 시뮬**로서의 완성도 우선 (2026-04-23 재전환, 직전 "포트폴리오·배포 우선" 노선 대체)
비전: 재무·세무회계, 전략론(Porter/BCG/Ansoff), 운영관리(Queueing/EOQ), 고급 마케팅, 조직경제학이 실제 레버·동학으로 녹아있는 시뮬레이션

---

## 트랙 구조

- **메인**: 마케팅 시뮬 `/play/*` (이론 심화 진행 중). 서비스 큐→만족도는 2026-04-24에 analytical 수준으로 흡수됨.
- **교보재**: 큐잉 시뮬 `/lab/queue` — discrete-event 시뮬 엔진은 별도 유지. Phase F 심화 단계에서 results 드릴다운으로 통합 여부 결정.

---

## 이미 완료 (참고)

- PRD v2.0 핵심: 12+ 레버, 3 페르소나, 6 라운드, 재무제표 3종, AI 디브리프(로컬 Ollama), localStorage 저장/복원
- v2.0 엔진 심화 Phase A/B/C `8842731` (2026-04-23): 이벤트 카드 6종·브랜드 에쿼티 stock·마케팅 믹스 3채널·자본 조달(부채/증자)·제품 라인 2개(A/B)
- Phase D 재무·세무회계 완성 (2026-04-23): 법인세·R&D 세액공제·CAPEX·결손금 이월 + 배당·이연법인세·원가배분
- Phase E 전략론 완성 (2026-04-24): 학습곡선·BCG·포터 공급자·경쟁강도·Ansoff

---

## 이어서 할 일

Phase E 5/5 · Phase F 2/4 · Phase G 1/3 완료 + UX 개선 2종. 다음 진입 후보:

- **Phase F 남은 트랙** — EOQ 기반 재고 정책 / Bullwhip 효과 / `/lab/queue` discrete-event 엔진을 results 드릴다운 탭으로 통합 (선택사항)
- **Phase G 남은 트랙** — Adstock carryover 모델 (광고의 시차 효과를 브랜드 에쿼티와 명시 분리) / STP 프레임워크 명시 UI (세분화→타겟팅→포지셔닝)
- **Phase H 진입** — 인사·조직경제학 (인력 규모 레버: 영업팀=직영채널 효과, R&D팀=품질상한 속도 / `otherExpense` 분해: 인건비·설비·일반관리비 3분 / 라운드 누적 학습효과)
- **UX 후속** — 레버 단위 "예상 효과" 인라인 프리뷰 (가격 -1만원 = 수요 +X대), 모바일 탭 레이아웃 최적화

(선택) **Phase D 보강** — `docs/roadmap-archive/phase-d-financial-tax.md`의 "남은 보강 후보". DTA 명시화 / 세법상 이월결손금 정밀화 / 투자세액공제 / 간접법 CF 정식화

---

## 현재 트랙 — 경영학 이론 심화

각 Phase는 리서치 → 모델링 → 구현 사이클 한 번. 순서는 재조정 가능.

- Phase D — 재무·세무회계 완성 ✅ 2026-04-23 · [archive](docs/roadmap-archive/phase-d-financial-tax.md)

### Phase E — 전략론 (Porter·BCG·Ansoff) ✅ 2026-04-24
- 학습곡선 / 경험곡선 ✅ (`lib/learning-curve.ts`, Wright's Law 80% 학습률, 제품별 `cumulativeProduction` stock)
- BCG 매트릭스 시각화 ✅ (`lib/bcg.ts`, 상대점유율×시장성장률 4분면 scatter + 버블 차트)
- 포터 공급자 교섭력 ✅ (`lib/supply.ts`, AR(1) + drift Supply Price Index, 이벤트 costMultiplier와 곱셈 결합)
- 경쟁 강도 보강 ✅ (`lib/competitor-ai.ts`, supplyIndex 가격동조 + Star 광고가속 + 경쟁사별 cumulativeRd 스태미나)
- Ansoff R&D 분배 ✅ (`lib/ansoff.ts`, rdAllocation improve/explore 레버, explore 누적 → 플레이어 전용 유효시장 +25% 상한)

### Phase F — 운영관리 (Queueing + OM)
- 서비스 큐 → 만족도 ✅ 2026-04-24 (`lib/service-queue.ts`, M/M/1 근사로 utilization 기반 만족도 델타·overflow 클램프, `decisions.serviceCapacity` 레버, 대당 50,000원/분기 opex)
- 생산 리드타임 ✅ 2026-04-24 (`GameState.pendingProduction` stock, decisions.products.production → 다음 분기 실현, capacity 제약도 pending 기준으로 재계산)
- EOQ 기반 재고 정책 (발주비용 vs 재고유지비 최적화) — 미착수
- Bullwhip 효과 (주문 변동성 증폭, 제품별 수요 예측 정확도 피드백) — 미착수
- (선택) `/lab/queue` discrete-event 엔진을 results 서비스 드릴다운 탭으로 통합

### Phase G — 고급 마케팅 (CLV, Adstock, STP)
- CLV 대시보드 ✅ 2026-04-24 (`lib/clv.ts`, retention = 0.5×satisfaction + 0.5×brandEquity, CLV = AOV × 1/(1−retention), results 페이지 4-분할 카드 + 전술 코멘트)
- Adstock 모델 (광고 carryover를 브랜드 에쿼티와 명시 분리) — 미착수
- STP 프레임워크 명시 UI (세분화→타겟팅→포지셔닝) — 미착수

### Phase H — 인사·조직경제학
- 인력 규모 레버 (영업팀 크기 → 직영 채널 효과, R&D 팀 → 품질상한 상승 속도)
- 학습효과 (라운드 누적 경험 → 전 부문 효율성 소폭 상승)
- `otherExpense` 분해 (현재 단일 100M → 인건비·설비·일반관리비)

### 배포·공개 (장기 후순위)
- LLM provider 어댑터 (Ollama 외 선택지), Vercel 배포, README + hero GIF, 블로그, v2.0 태그
- Phase D~H 대부분 마친 뒤 진행. 이전 "1주 스프린트" 계획은 폐기됨

## PRD 보류 항목 (장기, 정체성 재전환 시 재개)

- 팀 멀티플레이어 (교수·학교 경로로 피벗 시에만)
- 모바일 최적화
- 회원/저장 서버 사이드

---

## 진행 로그

- 2026-04-24 (2) UX · Phase F 심화 · Phase G 진입: (A) `/play` 의사결정 화면을 5개 탭(제품·마케팅·R&D·운영·자본)으로 재구성 + 탭별 "이 분기 쟁점" 배지 (수요초과·overflow·부채비율 등 실시간 진단) / (D) 디브리프 프롬프트에 BCG 분면·학습곡선·SPI·서비스큐·Ansoff 상태 주입, 최종 총평에 프레임워크 1회 이상 언급 요구 / (B) 생산 리드타임 — `pendingProduction` stock, production 의사결정 → 다음 분기 실현 (R1은 기초재고 기본값) / (C) CLV 대시보드 — retention = 0.5×satisfaction + 0.5×brandEquity, CLV = AOV × 1/(1-retention), 4분할 카드 + 전술 코멘트. store v12, 104/104 테스트 pass
- 2026-04-24 Phase F 첫 트랙(서비스 큐→만족도) 구현: `lib/service-queue.ts` — analytical M/M/1 근사, utilization 구간별 만족도 델타 (+5 / 0 / 선형감소 / -25 최악), ρ≥1.0 overflow 시 판매·매출 비례 클램프. `decisions.serviceCapacity` 레버(기본 20k대), 대당 50,000원 opex가 `otherExpense`에 가산. store v11. 93/93 테스트 pass
- 2026-04-24 Phase E 완료 (5/5): (1) 학습곡선 — Wright's Law 80% 학습률, 제품별 누적생산 stock / (2) BCG 매트릭스 — 상대점유율×성장률 4분면 scatter+버블 / (3) 공급자 교섭력 — AR(1)+drift SPI, 이벤트 costMultiplier와 곱셈 결합 / (4) 경쟁 강도 보강 — 경쟁사 cumulativeRd 스태미나, supplyIndex 가격 동조, 플레이어 Star 시 경쟁사 광고 가속 / (5) Ansoff R&D 분배 — rdAllocation {improve, explore} 레버, explore 누적 → 플레이어 전용 유효시장 최대 +25%. store v10 migration. build ✓
- 2026-04-23 Phase D 확장: 배당(상법 §462) + 이연법인세(세법·회계 일시차이) + 원가배분 정교화(제품별 segmentProfit, 재무제표 제품별 손익 탭). 46/46 테스트 pass
- 2026-04-23 Phase D 재무·세무회계 완성: 법인세·R&D 세액공제·자본잉여금 분리·결손금 이월·CAPEX/감가상각/생산capacity. PnL에 pretaxIncome/incomeTax/rdTaxCredit/depreciationExpense, BS에 taxPayable/capitalSurplus/ppe. 41/41 테스트 pass
- 2026-04-23 정체성 재전환: 포트폴리오·배포 우선 → 경영학 이론 심화 우선. 배포는 Phase D~H 완료 후 장기 후순위로 이동. AGENTS.md(Codex 잔재) 제거, CLAUDE.md의 `@anthropic-ai/sdk` 문구 정정
- 2026-04-23 v2.0 Phase A/B/C 5개 기능 모두 구현 `8842731` (이벤트 카드·브랜드 에쿼티·마케팅 믹스·자본 조달·제품 라인 2개). 33/33 테스트, 빌드 ✓
- 2026-04-23 v1.0 배포 스프린트 보류, v2.0 경영 심화 스프린트로 전환
- 2026-04-18 /office-hours 세션 → 포트폴리오 정체성 확정, 1주 v1.0 스프린트 정의 (→ 2026-04-23 재전환됨)
- 2026-04-17 디브리프 라운드별/최종 캐싱, 재무제표 페이지 디브리프 노출, /play/end 차트 폴리싱
- 2026-04-17 미사용 SDK 제거, 서버 에러 메시지 통일, 디브리프 프롬프트 경영 원칙 주입
- 2026-04-17 인터뷰 경로도 로컬 Ollama 전환 → 외부 API 의존 0
- 2026-04-17 디브리프 모델 `gemma4-ko:26b-q8` 업그레이드, localStorage 게임 상태 저장/복원
- 2026-04-17 게임 종료 화면 + AI 디브리프 (로컬 Ollama 스트리밍)
- 2026-04-17 큐잉 시뮬을 `/lab/queue`로 격리, `/` → `/play` 리다이렉트
- 2026-04-08 `0acc4bf` 큐잉 시뮬레이터 + 카페테리아 보딩 씬
- 2026-04-?? `ebce8ca` 멀티 라운드 6분기, 동적 경쟁사, BS carry-forward, R&D 누적
- 2026-03-?? `35a5ba7` 대시보드 아이콘 그리드, 포지셔닝 맵, 경쟁사 인텔
- 2026-03-31 `8119b30` page.tsx 정리
- 2026-03-?? `17d6eb0` Markstrat 스타일 UI 리스타일
- 2026-03-?? `121eb04` BizSim MVP 초기 구현
