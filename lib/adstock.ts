// Adstock (광고 carryover) — Koyck geometric lag 모델
// 광고의 시차 효과: 이번 분기에 뿌린 광고가 다음·다다음 분기에도 부분적으로 남아 수요에 영향.
//
// 공식 (Koyck, 1954):
//   adstock_t = X_t + λ × adstock_{t-1}
// 여기서 X_t = 이번 분기 광고비, λ = 분기 간 carryover 비율.
//
// λ = 0.5 (분기당 50% 이월) — 업계 경험치 중간값.
//   광고비 1B를 한 번 쓰면 이번 1.0B + 다음 0.5B + 그 다음 0.25B + ... ≈ 2.0B 누적 효과.
//   λ 높을수록 광고의 장기 지속성(브랜드성)이 커지고, 낮을수록 단기 전환성만 강조.
//
// brandEquity와 분리:
//   brandEquity = 심리적 자산 stock (가격 저항 완화, 재구매 확률)
//   adstock = 노출 자산 stock (이번 분기 수요 반응 함수의 입력)
//   둘은 상호작용하지만 모델상 별개 stock으로 관리.

import type { AdMix } from './types';

export const ADSTOCK_DECAY = 0.5;

export function combineAdstock(current: AdMix, prev: AdMix, decay: number = ADSTOCK_DECAY): AdMix {
  return {
    search: current.search + decay * prev.search,
    display: current.display + decay * prev.display,
    influencer: current.influencer + decay * prev.influencer,
  };
}

export const EMPTY_ADSTOCK: AdMix = { search: 0, display: 0, influencer: 0 };
