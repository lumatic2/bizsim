type Props = {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
};

export function MetricCard({ label, value, delta, deltaUp }: Props) {
  return (
    <div className="text-center p-4 border border-gray-200 rounded-lg bg-white">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
      {delta && (
        <div className={`text-xs mt-1 ${deltaUp ? 'text-green-600' : 'text-red-500'}`}>
          {deltaUp ? '▲' : '▼'} {delta}
        </div>
      )}
    </div>
  );
}
