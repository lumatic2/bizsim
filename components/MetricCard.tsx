type Props = {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
};

export function MetricCard({ label, value, delta, deltaUp }: Props) {
  return (
    <div className="text-center p-4 border border-[#3c4a45] rounded-lg bg-[#112036]">
      <div className="text-2xl font-[Manrope] font-bold text-[#d6e3ff]">{value}</div>
      <div className="text-xs text-[#bacac3] mt-1">{label}</div>
      {delta && (
        <div className={`text-xs mt-1 ${deltaUp ? 'text-[#38debb]' : 'text-red-400'}`}>
          {deltaUp ? '▲' : '▼'} {delta}
        </div>
      )}
    </div>
  );
}


