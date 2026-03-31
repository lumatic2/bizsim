type Props = {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
};

export function MetricCard({ label, value, delta, deltaUp }: Props) {
  const deltaColor = deltaUp ? 'var(--biz-success)' : 'var(--biz-danger)';

  return (
    <div
      style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }}
      className="border rounded-lg p-4 relative"
    >
      {/* Top color accent bar */}
      <div
        style={{ background: deltaUp ? 'var(--biz-success)' : 'var(--biz-danger)' }}
        className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
      />

      <div className="text-2xl font-[Manrope] font-bold" style={{ color: 'var(--biz-text)' }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--biz-text-muted)' }}>
        {label}
      </div>
      {delta && (
        <div className="text-xs mt-2" style={{ color: deltaColor }}>
          {deltaUp ? '▲' : '▼'} {delta}
        </div>
      )}
    </div>
  );
}


