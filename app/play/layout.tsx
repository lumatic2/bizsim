'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/game-store';

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useGameStore.persist.rehydrate()?.finally(() => setHydrated(true));
  }, []);

  if (!hydrated) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh] text-sm"
        style={{ color: 'var(--biz-text-muted)' }}
      >
        저장된 게임 상태를 불러오는 중…
      </div>
    );
  }

  return <div className="px-3 sm:px-4 md:px-6 pb-8">{children}</div>;
}
