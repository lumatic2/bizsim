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
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-[Manrope] font-bold text-gray-900">
        {display} <span className="text-sm font-normal text-gray-500">{unit}</span>
      </div>
      <div className="relative mt-3">
        <div className="h-1 bg-gray-100 rounded-full">
          <div
            className="h-1 bg-gray-900 rounded-full"
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


