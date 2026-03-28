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
        <tr className="text-xs text-[#bacac3] border-b border-[#3c4a45]">
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
                ? 'font-bold border-t-2 border-[#38debb] text-[#d6e3ff]'
                : row.isHeader
                  ? 'text-[#bacac3] font-semibold'
                  : 'border-b border-[#3c4a45]/20 text-[#d6e3ff]'
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


