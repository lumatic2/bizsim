'use client';

import Link from 'next/link';
import { Calculator, ChefHat, ScanLine, Users } from 'lucide-react';

export function Sidebar() {
  return (
    <aside style={{ background: 'var(--biz-sidebar)', borderColor: 'var(--biz-border)' }} className="hidden w-56 border-r xl:block">
      <div className="flex h-full flex-col p-6">
        <div className="mb-8">
          <Link href="/" className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Queue Lab
          </Link>
          <div className="mt-2 text-xs leading-5 text-white/68">
            학생 유입, 결제, 배식, 착석 병목을 한 화면에서 검증합니다.
          </div>
        </div>

        <nav className="flex-1 space-y-6">
          <div>
            <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-wider text-white/50">Sections</div>
            <Link href="/" className="block rounded-lg bg-white/8 px-3 py-2 text-sm text-white transition-colors hover:bg-white/12">
              대시보드
            </Link>
            <a href="#simulator" className="mt-1 block rounded-lg px-3 py-2 text-sm text-white/72 transition-colors hover:bg-white/8 hover:text-white">
              캔버스
            </a>
            <a href="#controls" className="mt-1 block rounded-lg px-3 py-2 text-sm text-white/72 transition-colors hover:bg-white/8 hover:text-white">
              제어 패널
            </a>
            <a href="#theory" className="mt-1 block rounded-lg px-3 py-2 text-sm text-white/72 transition-colors hover:bg-white/8 hover:text-white">
              대기행렬 이론
            </a>
          </div>

          <div>
            <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-wider text-white/50">System</div>
            <div className="space-y-3 rounded-[22px] bg-white/8 p-4">
              <SidebarFact icon={Users} title="입장" body="포아송 유입 λ" />
              <SidebarFact icon={ScanLine} title="결제" body="지수 서비스 μ₁" />
              <SidebarFact icon={ChefHat} title="배식" body="지수 서비스 μ₂" />
              <SidebarFact icon={Calculator} title="분석" body="L = λW 추적" />
            </div>
          </div>
        </nav>

        <div className="border-t pt-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="mb-2 text-[10px] text-white/50">Focus Metric</div>
          <div className="inline-block rounded-full px-2 py-1 text-[10px] font-semibold text-white" style={{ background: 'var(--biz-sidebar-active)' }}>
            병목 위치 실시간 탐지
          </div>
          <div className="mt-2 text-[11px] leading-5 text-white/68">
            키오스크 수, 배식원 수, 유입 속도를 바꾸면 대기열의 길이와 평균 체류 시간이 즉시 변합니다.
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarFact({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Users;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-white/12 p-2 text-white">
        <Icon size={16} />
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-white/62">{body}</div>
      </div>
    </div>
  );
}
