type Props = {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
};

export function MetricCard({ label, value, delta, deltaUp }: Props) {
  return (
    <div className="text-center p-4 border border-[#334155] rounded-lg bg-[#1e293b]">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
      {delta && (
        <div className={`text-xs mt-1 ${deltaUp ? 'text-teal-400' : 'text-red-400'}`}>
          {deltaUp ? '▲' : '▼'} {delta}
        </div>
      )}
    </div>
  );
}
