import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizSim — AI 기반 경영 시뮬레이션',
  description: 'AI 소비자와 대화하고, 의사결정하고, 재무제표로 결과를 확인하세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#0d1117] text-slate-100 antialiased">
        <div className="min-h-screen">
          <header className="border-b border-[#1e293b] bg-[#111827]">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
              <a href="/" className="text-lg font-bold tracking-tight text-teal-400">
                BizSim
              </a>
              <span className="text-xs text-slate-400">AI 기반 경영 시뮬레이션</span>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
