'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';

export function Sidebar() {
  const pathname = usePathname();
  const { currentRound, maxRounds } = useGameStore();

  const isActive = (href: string) => pathname === href;

  return (
    <aside style={{ background: 'var(--biz-sidebar)', borderColor: 'var(--biz-border)' }} className="w-56 border-r">
      <div className="p-6 flex flex-col h-full">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="text-xl font-[Manrope] font-bold text-white">
            BizSim
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {/* Dashboard Section */}
          <div>
            <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-3 px-3">
              대시보드
            </div>
            <Link
              href="/"
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive('/')
                  ? 'bg-[var(--biz-primary)] text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              대시보드
            </Link>
          </div>

          {/* Decisions Section */}
          <div className="mt-6">
            <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-3 px-3">
              의사결정
            </div>
            <div className="space-y-1">
              <Link
                href="/play"
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive('/play')
                    ? 'bg-[var(--biz-primary)] text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                의사결정
              </Link>
              <Link
                href="/play/interview"
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive('/play/interview')
                    ? 'bg-[var(--biz-primary)] text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                AI 인터뷰
              </Link>
            </div>
          </div>

          {/* Reports Section */}
          <div className="mt-6">
            <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-3 px-3">
              보고서
            </div>
            <div className="space-y-1">
              <Link
                href="/play/results"
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive('/play/results')
                    ? 'bg-[var(--biz-primary)] text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                결과 분석
              </Link>
              <Link
                href="/play/financials"
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive('/play/financials')
                    ? 'bg-[var(--biz-primary)] text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                재무제표
              </Link>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} className="border-t pt-4">
          <div className="text-[10px] text-white/50 mb-2">경영 시뮬레이션</div>
          <div style={{ background: 'var(--biz-primary)' }} className="inline-block rounded-full px-2 py-1 text-[10px] font-semibold text-white">
            Round {currentRound}
          </div>
          <div className="text-[10px] text-white/50 mt-1">
            {currentRound} / {maxRounds}
          </div>
        </div>
      </div>
    </aside>
  );
}
