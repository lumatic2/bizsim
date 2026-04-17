import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizSim',
  description: 'AI 기반 경영 시뮬레이션',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
