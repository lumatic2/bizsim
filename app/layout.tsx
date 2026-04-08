import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Campus Queue Lab',
  description: '대학교 식당 병목을 대기행렬 이론과 캔버스 시뮬레이션으로 시각화합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          background: '#f4ecdf',
          color: '#2f1c12',
          fontFamily: '"Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
        }}
      >
        <div style={{ minHeight: '100vh' }}>
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 20,
              borderBottom: '1px solid #decfbe',
              background: 'rgba(255, 250, 244, 0.94)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                maxWidth: 1400,
                margin: '0 auto',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>Queue Lab</div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#6b5a4f' }}>
                  범용 큐잉 이론 시뮬레이터
                </div>
              </div>
              <div
                style={{
                  borderRadius: 999,
                  padding: '8px 12px',
                  background: '#eef5ff',
                  color: '#2156c6',
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                React · Canvas · Queueing Theory
              </div>
            </div>
          </header>

          <main style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
