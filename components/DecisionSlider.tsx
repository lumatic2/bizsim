'use client';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
};

export function DecisionSlider({ label, value, min, max, step, unit, formatValue, onChange }: Props) {
  const display = formatValue ? formatValue(value) : value.toLocaleString();
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="border border-[#334155] rounded-lg p-4 bg-[#1e293b]">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-xl font-bold text-white">
        {display} <span className="text-sm font-normal text-slate-400">{unit}</span>
      </div>
      <div className="relative mt-3">
        <div className="h-1 bg-[#334155] rounded-full">
          <div
            className="h-1 bg-teal-400 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer"
        />
      </div>
    </div>
  );
}
