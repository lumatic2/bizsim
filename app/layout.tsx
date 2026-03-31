import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizSim — AI 기반 경영 시뮬레이션',
  description: 'AI 소비자와 대화하고, 의사결정하고, 재무제표로 결과를 확인하세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="font-[Inter]">
      <body style={{ background: 'var(--biz-bg)', color: 'var(--biz-text)' }} className="text-gray-900 font-[Inter] antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <header style={{ background: 'white', borderBottomColor: 'var(--biz-border)' }} className="border-b">
              <div className="px-6 py-4 flex items-center justify-between">
                <h1 className="text-lg font-[Manrope] font-bold" style={{ color: 'var(--biz-text)' }}>
                  경영 시뮬레이션
                </h1>
                <span className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>
                  Round 1 · 2026년 1분기
                </span>
              </div>
            </header>
            <main style={{ background: 'var(--biz-bg)' }} className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}


