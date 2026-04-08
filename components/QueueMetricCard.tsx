import type { LucideIcon } from 'lucide-react';

type QueueMetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'blue' | 'orange' | 'teal' | 'slate';
  description: string;
};

const toneMap = {
  blue: {
    bg: 'rgba(79, 140, 255, 0.12)',
    border: 'rgba(79, 140, 255, 0.28)',
    icon: '#4f8cff',
  },
  orange: {
    bg: 'rgba(255, 123, 84, 0.12)',
    border: 'rgba(255, 123, 84, 0.28)',
    icon: '#ff7b54',
  },
  teal: {
    bg: 'rgba(31, 187, 166, 0.12)',
    border: 'rgba(31, 187, 166, 0.28)',
    icon: '#1fbba6',
  },
  slate: {
    bg: 'rgba(65, 90, 119, 0.12)',
    border: 'rgba(65, 90, 119, 0.28)',
    icon: '#415a77',
  },
} as const;

export function QueueMetricCard({ icon: Icon, label, value, tone, description }: QueueMetricCardProps) {
  const palette = toneMap[tone];

  return (
    <div
      style={{
        borderRadius: 24,
        border: `1px solid ${palette.border}`,
        padding: 16,
        background: palette.bg,
      }}
    >
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ color: '#6b5a4f', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
          {label}
        </div>
        <div style={{ borderRadius: 999, padding: 8, background: 'rgba(255,255,255,0.65)' }}>
          <Icon size={18} style={{ color: palette.icon }} />
        </div>
      </div>

      <div style={{ color: '#2f1c12', fontSize: 30, fontWeight: 800, lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ marginTop: 8, color: '#6b5a4f', fontSize: 14, lineHeight: 1.6 }}>
        {description}
      </div>
    </div>
  );
}
