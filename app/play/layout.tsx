'use client';

import { usePathname } from 'next/navigation';

const steps = [
  { path: '/play', label: '1. 의사결정' },
  { path: '/play/interview', label: '2. 인터뷰' },
  { path: '/play/results', label: '3. 결과' },
  { path: '/play/financials', label: '4. 재무제표' },
];

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeIndex = steps.findIndex((step) => pathname === step.path);

  return (
    <div className="space-y-6">
      <nav className="rounded-xl border border-[#334155] bg-[#111827] px-4 py-3">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {steps.map((step, index) => {
            const stateClass =
              index < activeIndex
                ? 'text-teal-400'
                : index === activeIndex
                  ? 'text-white font-bold'
                  : 'text-slate-500';

            return (
              <li key={step.path} className={`flex items-center gap-2 ${stateClass}`}>
                <span>{step.label}</span>
                {index < steps.length - 1 && <span className="text-slate-600">{'>'}</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-4 md:p-6">{children}</div>
    </div>
  );
}
