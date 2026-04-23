# BizSim Roadmap

마지막 업데이트: 2026-04-24 (4)
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
- Phase F 운영관리 완성 (2026-04-24): 서비스큐·생산리드타임·EOQ·Bullwhip
- Phase G 고급 마케팅 완성 (2026-04-24): CLV·Adstock·STP
- Phase H 인사·조직경제학 완성 (2026-04-24): 인력 레버·otherExpense 분해·조직 학습효과

---

## 이어서 할 일

Phase E~H 모두 완료 + UX·해설·배포 기반 작업 7종 완료. 남은 가벼운 후보:

- **Phase H 이직률 모델** — 급여 레버 또는 업계평균 비교로 인력 이탈 동학 (현재는 headcount 자유 조정만)
- **v2.5 git 태그 + 공개 배포** — 현재는 개인 프로젝트. Vercel 배포는 로컬 Ollama 의존 때문에 제한적. Tailscale 또는 LLM provider 어댑터 작업 필요
- **도움말/튜토리얼 레이어** — 처음 들어온 사용자를 위한 onboarding 툴팁 (현재는 이론 지식 가정)
- **경쟁사 개별 페르소나화** — 각 경쟁사에 고유 "전략 성향" (텍스트 설명 + AI 해설)

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

### Phase F — 운영관리 (Queueing + OM) ✅ 2026-04-24
- 서비스 큐 → 만족도 ✅ (`lib/service-queue.ts`, M/M/1 근사로 utilization 기반 만족도 델타·overflow 클램프, `decisions.serviceCapacity` 레버, 대당 50,000원/분기 opex)
- 생산 리드타임 ✅ (`GameState.pendingProduction` stock, decisions.products.production → 다음 분기 실현)
- EOQ 기반 재고 정책 ✅ (`lib/eoq.ts`, Q*=√(2DS/H) 공식 권장값 UI 배지, 기말재고 × 5% 재고유지비가 PnL에 반영)
- Bullwhip 효과 ✅ (`lib/bullwhip.ts`, 플레이어 수요 변동률 > 20% 초과분이 경쟁사 광고 증폭 + SPI extra drift로 전달)
- (선택) `/lab/queue` discrete-event 엔진을 results 서비스 드릴다운 탭으로 통합 — 미착수

### Phase G — 고급 마케팅 (CLV, Adstock, STP) ✅ 2026-04-24
- CLV 대시보드 ✅ (`lib/clv.ts`, retention = 0.5×satisfaction + 0.5×brandEquity, CLV = AOV × 1/(1−retention), results 페이지 4-분할 카드 + 전술 코멘트)
- Adstock 모델 ✅ (`lib/adstock.ts`, Koyck geometric lag λ=0.5, effectiveAd = currentAd + λ×prevAdstock, `GameState.adstock` stock 추가)
- STP 프레임워크 UI ✅ (`lib/stp.ts`, 페르소나별 세그먼트 매력도·획득률·광고 도달·topChannel 매칭 카드)

### Phase H — 인사·조직경제학 ✅ 2026-04-24
- 인력 규모 레버 ✅ (`lib/labor.ts`, `Decisions.headcount: {sales, rd}`, 영업팀 → 직영채널 배수, R&D팀 → cumulativeImproveRd 실효 배수)
- `otherExpense` 분해 ✅ (G&A 50M + 인건비 + 설비유지 0.5%/분기 + 서비스 opex + 재고유지비 5%/분기, PnL에 5필드로 가시화)
- 조직 학습효과 ✅ (`lib/org-learning.ts`, 라운드당 +1% 전 부문 원가 효율성, 최대 +30% cap)

### 배포·공개 (장기 후순위)
- LLM provider 어댑터 (Ollama 외 선택지), Vercel 배포, README + hero GIF, 블로그, v2.0 태그
- Phase D~H 대부분 마친 뒤 진행. 이전 "1주 스프린트" 계획은 폐기됨

## PRD 보류 항목 (장기, 정체성 재전환 시 재개)

- 팀 멀티플레이어 (교수·학교 경로로 피벗 시에만)
- 모바일 최적화
- 회원/저장 서버 사이드

---

## 진행 로그

- 2026-04-24 (4) Phase E~H 완결 + 해설·배포 7종 (166/166 테스트):
  - **4 프레임워크 태그** (`lib/framework-tags.ts`) — Porter/BCG/Ansoff/경험곡선/Bullwhip/Overtrading 등 자동 매칭, results 상단 상위 5개 배지
  - **1 STP UI** (`lib/stp.ts`) — 페르소나별 매력도·획득률·광고 도달·topChannel 매칭 (일치/다른 채널 과다 경고)
  - **2 조직 학습** (`lib/org-learning.ts`) — 라운드당 +1% 전 부문 원가 효율성, unit cost 공식에 반영
  - **3 서비스 큐 드릴다운** (`lib/mm1-metrics.ts`) — M/M/1 표준 지표 (ρ, L, Lq, W, Wq) + 시스템 내 인원 확률분포 bar chart, /lab/queue 링크
  - **5 의사결정 타임라인** — /play/end에 분기별 결정·stock·성과 heatmap 테이블, 변경된 결정 하이라이트
  - **6 README** — 경영학 이론 ↔ 게임 레버 대응표 19항목, 구조·커맨드·LLM 요구사항
  - **7 모바일 레이아웃** — 그리드 반응형 (grid-cols-N → grid-cols-1 sm:grid-cols-N md:grid-cols-N), 탭 바 가로 스크롤, /play padding
- 2026-04-24 (3) 이론 심화 7종 일괄 구현 (142/142 테스트, store v14):
  - **5 레버 인라인 프리뷰** — 탭별 민감도 분석 카드 (가격 -1만원, 품질 +1, 서비스 +5k 등 시나리오별 매출·점유·만족도 delta 실시간 계산)
  - **1 Adstock carryover** (`lib/adstock.ts`) — Koyck λ=0.5, effectiveAd = current + λ×prevAdstock, 마케팅 탭에 carryover 뱃지
  - **3 Phase H 진입** (`lib/labor.ts`) — 영업·R&D 인력 레버, 직영채널 배수·R&D 실효성 배수, PnL otherExpense 5필드 분해(G&A·인건비·유지비·서비스·재고유지비)
  - **2 EOQ 재고 정책** (`lib/eoq.ts`) — Harris 1913 공식 Q*=√(2DS/H) 권장값 UI 배지, 기말재고 × 5% 재고유지비가 PnL 반영
  - **4 Bullwhip 효과** (`lib/bullwhip.ts`) — 판매 변동률 20% 초과 시 경쟁사 광고 증폭 + SPI drift 추가, decision 페이지 경고 배지
  - **6 라운드 간 변화 카드** (`lib/round-delta.ts`) — results 상단에 delta 5지표 + 휴리스틱 귀인 (가격/광고/품질/인력/서비스/이벤트/SPI 중 impact 1위)
  - **7 경쟁사 프로파일 드릴다운** (`lib/competitor-trend.ts`) — 경쟁사별 가격·품질·광고·점유 sparkline + 전략 태그 (공격적 가격전략/품질 추격/광고 공세/수비 전환 등)
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
