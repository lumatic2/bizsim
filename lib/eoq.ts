// EOQ (Economic Order Quantity, Harris 1913)
// 발주비용 S와 단위당 재고유지비 H가 trade-off 되는 상황에서
// 총비용을 최소화하는 1회 주문량.
//
//   Q* = sqrt(2 × D × S / H)
//
// D = 분기 수요, S = 발주/생산 배치 1회당 고정비, H = 단위당 분기 재고유지비
//
// BizSim 단순화:
//   - 분기당 생산은 1배치로 가정 (실무는 다배치 가능)
//   - EOQ는 "수요 대비 권장 생산 배치 크기" 힌트로만 제공
//   - 재고유지비는 PnL에 반영 (기말 재고 × INVENTORY_HOLDING_RATE)
//   - SETUP_COST: 주문·설비 셋업 1회 고정비 (공구 교체·라인 조정 등)

export const SETUP_COST = 50_000_000;             // 생산 배치 1회당 셋업비
export const INVENTORY_HOLDING_RATE = 0.05;       // 분기당 재고유지비율 (= 연 20%: 창고·보험·자본 기회비용)
export const UNIT_HOLDING_COST_PROXY = 120_000 * INVENTORY_HOLDING_RATE;  // 단위당 분기 유지비 (baseline 단가 기준)

export function economicOrderQuantity(
  quarterlyDemand: number,
  setupCost: number = SETUP_COST,
  unitHoldingCost: number = UNIT_HOLDING_COST_PROXY,
): number {
  if (quarterlyDemand <= 0 || unitHoldingCost <= 0) return 0;
  return Math.round(Math.sqrt((2 * quarterlyDemand * setupCost) / unitHoldingCost));
}

export function inventoryHoldingCostOf(inventoryValue: number, rate: number = INVENTORY_HOLDING_RATE): number {
  return Math.round(inventoryValue * rate);
}
