import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-[Manrope] font-bold tracking-tight mb-4">
        BizSim
      </h1>
      <p className="text-lg text-gray-500 mb-2">AI 기반 경영 시뮬레이션</p>
      <p className="text-sm text-gray-500 max-w-md mb-8">
        AI 소비자와 대화하고, 마케팅 의사결정을 내리고, 재무제표로 결과를 확인하세요.
        한국 스마트홈 가전 시장에서 당신의 경영 능력을 시험해보세요.
      </p>

      <Link
        href="/play"
        className="bg-gray-900 text-white px-8 py-3 rounded-lg text-sm font-bold hover:brightness-110  transition-colors"
      >
        시뮬레이션 시작하기
      </Link>

      <div className="mt-12 grid grid-cols-4 gap-6 text-center text-xs text-gray-500">
        <div>
          <div className="text-2xl mb-1">📊</div>
          <div>의사결정</div>
        </div>
        <div>
          <div className="text-2xl mb-1">💬</div>
          <div>AI 인터뷰</div>
        </div>
        <div>
          <div className="text-2xl mb-1">📈</div>
          <div>결과 분석</div>
        </div>
        <div>
          <div className="text-2xl mb-1">📋</div>
          <div>재무제표</div>
        </div>
      </div>
    </div>
  );
}


