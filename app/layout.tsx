import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizSim — AI 기반 경영 시뮬레이션',
  description: 'AI 소비자와 대화하고, 의사결정하고, 재무제표로 결과를 확인하세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="font-[Inter]">
      <body className="bg-[#041329] text-[#d6e3ff] font-[Inter] antialiased">
        <div className="min-h-screen">
          <header className="border-b border-[#3c4a45]/20 bg-[#041329]">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
              <a href="/" className="text-lg font-[Manrope] font-bold tracking-tight text-[#38debb]">
                BizSim
              </a>
              <span className="text-xs text-[#bacac3]">AI 기반 경영 시뮬레이션</span>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}


