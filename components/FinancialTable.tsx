type Row = {
  label: string;
  value: number;
  isHeader?: boolean;
  isTotal?: boolean;
};

type Props = {
  rows: Row[];
};

function formatKRW(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  return value.toLocaleString();
}

export function FinancialTable({ rows }: Props) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr style={{ background: 'var(--biz-primary)', color: 'white' }}>
          <th className="text-left py-2 font-medium">계정</th>
          <th className="text-right py-2 font-medium">금액 (₩)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const isPositive = row.value >= 0;
          const textColor = row.value < 0 ? 'var(--biz-danger)' : row.value > 0 ? 'var(--biz-success)' : 'var(--biz-text)';

          return (
            <tr
              key={i}
              style={
                row.isTotal
                  ? { background: '#f0f7ff', color: 'var(--biz-text)', borderTop: '2px solid var(--biz-primary)' }
                  : row.isHeader
                    ? { color: 'var(--biz-text-muted)' }
                    : { borderBottom: '1px solid var(--biz-border)', color: 'var(--biz-text)' }
              }
            >
              <td className={`py-1.5 ${row.isHeader ? 'pt-3' : ''} font-medium`}>{row.label}</td>
              <td className={`py-1.5 text-right tabular-nums ${row.isTotal ? 'font-bold' : ''}`} style={{ color: row.isHeader ? 'var(--biz-text-muted)' : textColor }}>
                {row.isHeader ? '' : `₩${formatKRW(row.value)}`}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}


