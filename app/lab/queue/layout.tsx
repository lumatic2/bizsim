import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Queue Lab',
  description: '범용 큐잉 이론 시뮬레이터',
};

export default function QueueLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4ecdf',
        color: '#2f1c12',
        fontFamily: '"Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
      }}
    >
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
  );
}
