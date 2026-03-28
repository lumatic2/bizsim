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
        <tr className="text-xs text-slate-400 border-b border-[#334155]">
          <th className="text-left py-2 font-medium">계정</th>
          <th className="text-right py-2 font-medium">금액 (₩)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            className={
              row.isTotal
                ? 'font-bold border-t-2 border-teal-400 text-slate-100'
                : row.isHeader
                  ? 'text-slate-300 font-semibold'
                  : 'border-b border-[#1e293b] text-slate-200'
            }
          >
            <td className={`py-1.5 ${row.isHeader ? 'pt-3' : ''}`}>{row.label}</td>
            <td className={`py-1.5 text-right tabular-nums ${row.value < 0 ? 'text-red-400' : ''}`}>
              {row.isHeader ? '' : `₩${formatKRW(row.value)}`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
