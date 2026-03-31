import Link from 'next/link';

type DashboardTile = {
  title: string;
  icon: string;
  color: string;
  href: string;
};

const tiles: DashboardTile[] = [
  { title: '대시보드', icon: '🏠', color: '#3b82f6', href: '/' },
  { title: '시장 보고서', icon: '📊', color: '#10b981', href: '/play/results' },
  { title: '의사결정', icon: '🎯', color: '#f59e0b', href: '/play' },
  { title: 'AI 인터뷰', icon: '💬', color: '#8b5cf6', href: '/play/interview' },
  { title: '재무제표', icon: '📋', color: '#ef4444', href: '/play/financials' },
  { title: '경쟁사 분석', icon: '🔍', color: '#06b6d4', href: '/play/results' },
  { title: '포지셔닝 맵', icon: '📍', color: '#ec4899', href: '/play/results' },
  { title: '시뮬레이션 실행', icon: '▶️', color: '#1e2a3a', href: '/play' },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto">
      <div
        className="rounded-xl px-5 py-3 mb-6 text-sm font-semibold"
        style={{
          background: 'var(--biz-card)',
          border: '1px solid var(--biz-border)',
          color: 'var(--biz-text)',
        }}
      >
        Round 1 · 한국 스마트홈 가전 · 경기 보통
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {tiles.map((tile) => (
          <Link
            key={tile.title}
            href={tile.href}
            className="aspect-square rounded-xl p-4 text-white transition-all hover:brightness-90"
            style={{ background: tile.color }}
          >
            <div className="h-full flex flex-col justify-between">
              <div className="text-3xl leading-none">{tile.icon}</div>
              <div className="text-sm font-semibold">{tile.title}</div>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/play"
        className="block w-full rounded-xl px-6 py-4 text-center text-white text-base font-bold transition-opacity hover:opacity-90"
        style={{ background: '#3b82f6' }}
      >
        시뮬레이션 바로 시작
      </Link>
    </div>
  );
}
