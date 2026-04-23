# Phase D — 재무·세무회계 완성

완료일: 2026-04-23
커밋: `a3d7498` (묶음1~3: 법인세/R&D 세액공제/CAPEX/결손금 이월), `2704ae5` (묶음4: 배당/이연법인세/원가배분 정교화)

## 구현 항목

- **법인세** — 한국 누진세율표(9/19/21/24%) 분기 단위 연환산 적용
- **R&D 세액공제** — 조특법 §10 중소기업 25%, 산출세액 50% 한도
- **감가상각 + CAPEX** — 회계상 8분기 정액법, 세법상 4분기 가속상각, ppe 500,000원당 1대 capacity
- **자본잉여금 분리** — 증자 시 capitalSurplus에 계상
- **결손금 이월공제** — 게임 전체 기간 이월 (실제 15년 단순화)
- **배당** — 배당가능이익(상법 §462) 한도 내 현금 배당, BS·CF 반영
- **이연법인세** — 세법·회계 감가상각 일시차이에서 DTL 누적, PnL에 currentTax/deferredTaxExpense 분리
- **원가배분 정교화** — ProductResult에 cogs/grossProfit/allocatedOverhead/segmentProfit, 매출 비중 기반 배분. 재무제표 "제품별 손익" 탭 추가

## 주요 신규 파일

- `lib/tax.ts` — 한국 법인세 누진세율, R&D 세액공제, 이월결손금 공제 헬퍼

## PnL / BS / CF 확장 요약

- PnL: `pretaxIncome` · `currentTax` · `deferredTaxExpense` · `rdTaxCredit` · `incomeTax`(총세금비용) · `depreciationExpense` 추가
- BS: `ppe` · `taxPpe`(내부) · `taxPayable` · `deferredTaxLiability` · `capitalSurplus` 추가
- CF: 간접법 강화 — 영업CF에 감가상각 가산, 투자CF에 CAPEX 유출, 재무CF에 배당·신규조달·이자 반영

## 남은 보강 후보 (다음 기회에)

- **이연법인세자산(DTA) 명시화** — 현재 DTL만 있고 이월결손금 미래 공제액은 DTA로 계상해야 정확
- **세법상 이월결손금 정밀화** — 현재 이월결손금 갱신은 회계상 pretax 기준. 세법상 과세표준(depDiff 반영 후) 기반으로 정밀화
- **소득세액공제 확대** — 투자세액공제, 고용증대 세액공제 등 조특법 다른 항목
- **간접법 CF 정식화** — 매출채권·재고·매입채무 등 운전자본 증감을 기초/기말 차이 기반으로 정식 반영 (현재 단순화 상태)
- **세율 구간 자동 적용** — 현재 이연세 계산은 유효세율 19% 고정 가정. 실제 과세표준에 맞춰 동적 계산

## 테스트

46/46 pass (financial-mapper 21, game-engine 15, queueing-sim 10)
