import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-[Manrope] font-bold mb-2" style={{ color: 'var(--biz-text)' }}>
        대시보드
      </h1>
      <p style={{ color: 'var(--biz-text-muted)' }} className="text-sm mb-6">
        2026년 1분기 경영 시뮬레이션에 오신 것을 환영합니다.
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-sm" style={{ color: 'var(--biz-text-muted)' }}>시장점유율</div>
          <div className="text-2xl font-[Manrope] font-bold mt-2" style={{ color: 'var(--biz-primary)' }}>0%</div>
          <div className="text-xs mt-1" style={{ color: 'var(--biz-text-muted)' }}>신규 진입</div>
        </div>

        <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-sm" style={{ color: 'var(--biz-text-muted)' }}>예상매출</div>
          <div className="text-2xl font-[Manrope] font-bold mt-2" style={{ color: 'var(--biz-primary)' }}>-</div>
          <div className="text-xs mt-1" style={{ color: 'var(--biz-text-muted)' }}>시뮬레이션 후</div>
        </div>

        <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4">
          <div className="text-2xl mb-1">🏢</div>
          <div className="text-sm" style={{ color: 'var(--biz-text-muted)' }}>경쟁사</div>
          <div className="text-2xl font-[Manrope] font-bold mt-2" style={{ color: 'var(--biz-primary)' }}>3개</div>
          <div className="text-xs mt-1" style={{ color: 'var(--biz-text-muted)' }}>글로벌테크 등</div>
        </div>

        <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4">
          <div className="text-2xl mb-1">🎮</div>
          <div className="text-sm" style={{ color: 'var(--biz-text-muted)' }}>현재 라운드</div>
          <div className="text-2xl font-[Manrope] font-bold mt-2" style={{ color: 'var(--biz-primary)' }}>1</div>
          <div className="text-xs mt-1" style={{ color: 'var(--biz-text-muted)' }}>2026년 1분기</div>
        </div>
      </div>

      {/* CTA Card */}
      <div style={{ background: 'var(--biz-primary)' }} className="rounded-lg p-8 text-center mb-8">
        <h2 className="text-2xl font-[Manrope] font-bold text-white mb-2">
          시뮬레이션 시작
        </h2>
        <p className="text-sm text-white/80 mb-6">
          의사결정을 내리고, AI 소비자와 대화하고, 재무 결과를 확인하세요.
        </p>
        <Link
          href="/play"
          className="inline-block text-white px-8 py-3 rounded-lg text-sm font-bold transition-all hover:opacity-90"
          style={{ background: 'rgba(255, 255, 255, 0.2)' }}
        >
          시뮬레이션 시작 →
        </Link>
      </div>

      {/* Game Flow */}
      <div>
        <h3 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'var(--biz-text-muted)' }}>
          게임 플로우
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { num: '1', title: '의사결정', desc: '가격, 광고, R&D 결정' },
            { num: '2', title: 'AI 인터뷰', desc: '소비자와 대화' },
            { num: '3', title: '결과 분석', desc: '매출, 점유율 확인' },
            { num: '4', title: '재무제표', desc: '손익계산서, 재무상태표' },
          ].map((step) => (
            <div key={step.num} style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-[Manrope] font-bold mb-2" style={{ color: 'var(--biz-primary)' }}>
                {step.num}
              </div>
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--biz-text)' }}>
                {step.title}
              </div>
              <div className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


