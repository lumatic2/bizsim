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
    <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4">
      <div className="text-xs mb-1" style={{ color: 'var(--biz-text-muted)' }}>
        {label}
      </div>
      <div className="text-xl font-[Manrope] font-bold" style={{ color: 'var(--biz-text)' }}>
        {display} <span className="text-sm font-normal" style={{ color: 'var(--biz-text-muted)' }}>{unit}</span>
      </div>
      <div className="relative mt-3">
        <div style={{ background: '#e2e8f0' }} className="h-1 rounded-full">
          <div
            style={{ background: 'var(--biz-primary)', width: `${percent}%` }}
            className="h-1 rounded-full"
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


