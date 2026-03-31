# BizSim UI/UX 구현 가이드

> Markstrat 레퍼런스 기반 BizSim 디자인 시스템 구축

---

## 1. 레이아웃 구조 (Next.js App Router)

### 1.1 파일 구조

```
app/
├── layout.tsx              (루트 레이아웃 + 사이드바)
├── dashboard/
│   ├── page.tsx           (대시보드 페이지)
│   ├── layout.tsx
│   └── components/
│       ├── KPICard.tsx
│       ├── TrendChart.tsx
│       └── CompetitorWidget.tsx
├── decisions/
│   ├── page.tsx           (의사결정 선택)
│   ├── marketing/page.tsx  (마케팅 믹스)
│   ├── rd/page.tsx         (R&D)
│   ├── production/page.tsx (생산)
│   └── layout.tsx
├── reports/
│   ├── market/page.tsx
│   ├── financial/page.tsx
│   └── competitors/page.tsx
└── api/
    └── [API 라우트들]

components/
├── Layout/
│   ├── Sidebar.tsx        (좌측 내비게이션)
│   ├── Header.tsx         (상단 헤더)
│   ├── SidebarNav.tsx     (사이드바 메뉴)
│   └── MobileNav.tsx      (모바일 메뉴)
├── Common/
│   ├── Card.tsx           (카드 패널)
│   ├── Button.tsx
│   ├── Slider.tsx         (범위 슬라이더)
│   ├── Alert.tsx          (경고/성공 메시지)
│   └── LoadingSpinner.tsx
├── Chart/
│   ├── LineChart.tsx      (시계열)
│   ├── BarChart.tsx       (비교)
│   ├── PositioningMap.tsx (산점도)
│   └── ChartLegend.tsx
├── Decision/
│   ├── DecisionForm.tsx   (의사결정 폼)
│   ├── BudgetSlider.tsx   (예산 슬라이더)
│   ├── ValidationError.tsx
│   └── DecisionPreview.tsx (변경 예측)
└── Reports/
    ├── ReportPanel.tsx
    ├── DataTable.tsx
    └── ExportButton.tsx
```

### 1.2 Tailwind CSS 설정 (tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Markstrat 레퍼런스 색상
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          500: '#007bff',  // 주 강조색
          600: '#0056b3',
          700: '#004085',
        },
        success: {
          50: '#f1f8f5',
          500: '#28a745',  // 이익/성공
          600: '#1e7e34',
        },
        danger: {
          50: '#fdf8f7',
          500: '#dc3545',  // 손실/경고
          600: '#bd2130',
        },
        neutral: {
          50: '#f8f9fa',   // 밝은 배경
          100: '#e9ecef',
          200: '#dee2e6',
          400: '#adb5bd',
          600: '#6c757d',  // 약한 텍스트
          900: '#343a40',  // 본문 텍스트
        },
      },
      fontSize: {
        xs: ['11px', { lineHeight: '14px' }],
        sm: ['12px', { lineHeight: '16px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['32px', { lineHeight: '40px' }],
      },
      spacing: {
        // 일관된 간격
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '6px',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 2. 핵심 컴포넌트 구현

### 2.1 레이아웃: Sidebar

```tsx
// components/Layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Settings,
  TrendingUp,
  ClipboardList,
  FileText,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  children?: NavItem[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Decisions',
    href: '/decisions',
    icon: <TrendingUp className="w-5 h-5" />,
    children: [
      { label: 'Marketing Mix', href: '/decisions/marketing' },
      { label: 'R&D & Product', href: '/decisions/rd' },
      { label: 'Production', href: '/decisions/production' },
      { label: 'Pricing', href: '/decisions/pricing' },
    ],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: <FileText className="w-5 h-5" />,
    children: [
      { label: 'Market Analysis', href: '/reports/market' },
      { label: 'Financial Statements', href: '/reports/financial' },
      { label: 'Competitor Analysis', href: '/reports/competitors' },
    ],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>(null)

  return (
    <aside className="w-64 bg-neutral-50 border-r border-neutral-200 h-screen sticky top-0 overflow-y-auto">
      {/* 헤더 */}
      <div className="p-6 border-b border-neutral-200">
        <h1 className="text-2xl font-bold text-primary-500">BizSim</h1>
        <p className="text-xs text-neutral-600 mt-1">Business Simulation</p>
      </div>

      {/* 라운드 정보 */}
      <div className="px-6 py-4 bg-primary-50 border-b border-neutral-200">
        <p className="text-xs text-neutral-600 font-semibold uppercase">Current Round</p>
        <p className="text-2xl font-bold text-primary-700 mt-1">3 / 10</p>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const hasChildren = item.children && item.children.length > 0

          return (
            <div key={item.href}>
              {/* 메인 메뉴 항목 */}
              <button
                onClick={() => hasChildren && setExpandedMenu(
                  expandedMenu === item.href ? null : item.href
                )}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md transition ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {hasChildren && (
                  <span className={`text-sm transition ${expandedMenu === item.href ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                )}
              </button>

              {/* 서브 메뉴 */}
              {hasChildren && expandedMenu === item.href && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`block px-4 py-2 text-sm rounded-md transition ${
                        pathname === child.href
                          ? 'bg-primary-200 text-primary-700 font-semibold'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
```

### 2.2 핵심 컴포넌트: Card (패널)

```tsx
// components/Common/Card.tsx
import React from 'react'

interface CardProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  footer?: React.ReactNode
  actionButton?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
}

export default function Card({
  title,
  description,
  children,
  className = '',
  footer,
  actionButton,
}: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-neutral-200 shadow-sm ${className}`}>
      {/* 헤더 */}
      {title && (
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          {description && (
            <p className="text-sm text-neutral-600 mt-1">{description}</p>
          )}
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="px-6 py-4">
        {children}
      </div>

      {/* 액션 버튼 */}
      {actionButton && (
        <div className="px-6 py-3 border-t border-neutral-200">
          <button
            onClick={actionButton.onClick}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
              actionButton.variant === 'secondary'
                ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {actionButton.label}
          </button>
        </div>
      )}

      {/* 푸터 */}
      {footer && (
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-600">
          {footer}
        </div>
      )}
    </div>
  )
}
```

### 2.3 입력 컴포넌트: BudgetSlider

```tsx
// components/Decision/BudgetSlider.tsx
'use client'

import React, { useState } from 'react'

interface BudgetSliderProps {
  label: string
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  unit?: string
  description?: string
  warning?: string
}

export default function BudgetSlider({
  label,
  min,
  max,
  value,
  onChange,
  unit = '$',
  description,
  warning,
}: BudgetSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-3">
      {/* 레이블 */}
      <div>
        <label className="block text-sm font-semibold text-neutral-900">
          {label}
        </label>
        {description && (
          <p className="text-xs text-neutral-600 mt-1">{description}</p>
        )}
      </div>

      {/* 슬라이더 + 값 입력 */}
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #007bff 0%, #007bff ${percentage}%, #e9ecef ${percentage}%, #e9ecef 100%)`,
          }}
        />
        <div className="flex items-baseline gap-2 w-24">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
            className="w-16 px-2 py-1 text-right text-sm font-semibold border border-neutral-200 rounded-md"
          />
          <span className="text-sm text-neutral-600">{unit}</span>
        </div>
      </div>

      {/* 범위 표시 */}
      <div className="flex justify-between text-xs text-neutral-500">
        <span>
          Min: {unit}
          {min.toLocaleString()}
        </span>
        <span>
          Max: {unit}
          {max.toLocaleString()}
        </span>
      </div>

      {/* 경고 메시지 */}
      {warning && (
        <div className="px-3 py-2 bg-danger-50 border border-danger-200 rounded-md text-xs text-danger-700">
          ⚠️ {warning}
        </div>
      )}
    </div>
  )
}
```

### 2.4 차트: PositioningMap (산점도)

```tsx
// components/Chart/PositioningMap.tsx
'use client'

import React from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ProductData {
  id: string
  name: string
  x: number // 예: 가격
  y: number // 예: 품질
  size: number // 시장점유율
  company: string
  color: string
}

interface PositioningMapProps {
  data: ProductData[]
  xLabel: string
  yLabel: string
  title?: string
}

export default function PositioningMap({
  data,
  xLabel,
  yLabel,
  title,
}: PositioningMapProps) {
  // 회사별로 데이터 그룹화
  const companiesData = React.useMemo(() => {
    const grouped = new Map<string, ProductData[]>()
    data.forEach((product) => {
      if (!grouped.has(product.company)) {
        grouped.set(product.company, [])
      }
      grouped.get(product.company)!.push(product)
    })
    return Array.from(grouped.entries())
  }, [data])

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>}

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
          <XAxis
            dataKey="x"
            label={{ value: xLabel, position: 'insideBottomRight', offset: -10 }}
            type="number"
            stroke="#6c757d"
          />
          <YAxis
            dataKey="y"
            label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
            type="number"
            stroke="#6c757d"
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'size') return [value.toLocaleString(), 'Market Share %']
              return [value.toLocaleString(), name]
            }}
          />
          <Legend />

          {companiesData.map(([company, products]) => (
            <Scatter
              key={company}
              name={company}
              data={products}
              fill={products[0]?.color || '#007bff'}
              shape="circle"
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      {/* 범례 (회사별 색상) */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {companiesData.map(([company, products]) => (
          <div key={company} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: products[0]?.color }}
            />
            <span className="text-neutral-700">{company}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 3. 의사결정 입력 검증 (lib/validation.ts)

```typescript
// lib/decision-validation.ts
export interface DecisionValidationResult {
  valid: boolean
  errors: { [key: string]: string }
  warnings: { [key: string]: string }
}

export function validateMarketingDecision(decision: any): DecisionValidationResult {
  const errors: { [key: string]: string } = {}
  const warnings: { [key: string]: string } = {}

  // 예산 검증
  const totalBudget = (decision.adSpend || 0) + (decision.promotionBudget || 0)
  const maxBudget = 1000000 // 예시

  if (totalBudget > maxBudget) {
    errors.budget = `총 마케팅 예산(${totalBudget.toLocaleString()})이 한도(${maxBudget.toLocaleString()})를 초과합니다.`
  }

  // 가격 검증
  if (decision.price < 10 || decision.price > 1000) {
    warnings.price = '설정된 가격이 일반적인 범위를 벗어났습니다.'
  }

  // 세그먼트 선택 검증
  if (!decision.targetSegment) {
    errors.targetSegment = '최소 하나의 타겟 세그먼트를 선택해야 합니다.'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
  }
}
```

---

## 4. 라운드 진행 상태 관리 (Zustand)

```typescript
// stores/round-store.ts
import { create } from 'zustand'

interface RoundState {
  currentRound: number
  totalRounds: number
  phase: 'input' | 'simulation' | 'results'
  decisionsSubmitted: boolean
  results: any | null

  setCurrentRound: (round: number) => void
  setPhase: (phase: 'input' | 'simulation' | 'results') => void
  submitDecisions: () => Promise<void>
  advanceRound: () => Promise<void>
}

export const useRoundStore = create<RoundState>((set) => ({
  currentRound: 1,
  totalRounds: 10,
  phase: 'input',
  decisionsSubmitted: false,
  results: null,

  setCurrentRound: (round) => set({ currentRound: round }),

  setPhase: (phase) => set({ phase }),

  submitDecisions: async () => {
    set({ phase: 'simulation' })
    // API 호출로 시뮬레이션 실행
    await new Promise((resolve) => setTimeout(resolve, 2000))
    set({ phase: 'results', decisionsSubmitted: true })
  },

  advanceRound: async () => {
    const { currentRound, totalRounds } = useRoundStore.getState()
    if (currentRound < totalRounds) {
      set({
        currentRound: currentRound + 1,
        phase: 'input',
        decisionsSubmitted: false,
      })
    }
  },
}))
```

---

## 5. 대시보드 페이지 (app/dashboard/page.tsx)

```tsx
// app/dashboard/page.tsx
'use client'

import { useRoundStore } from '@/stores/round-store'
import Card from '@/components/Common/Card'
import LineChart from '@/components/Chart/LineChart'
import PositioningMap from '@/components/Chart/PositioningMap'

export default function DashboardPage() {
  const { currentRound } = useRoundStore()

  // 샘플 데이터
  const kpiData = [
    { round: 1, revenue: 1000000, marketShare: 15, profit: 150000 },
    { round: 2, revenue: 1200000, marketShare: 18, profit: 180000 },
    { round: 3, revenue: 1100000, marketShare: 16, profit: 160000 },
  ]

  const positioningData = [
    {
      id: 'p1',
      name: 'Product A',
      x: 5,
      y: 8,
      size: 25,
      company: 'Company 1',
      color: '#007bff',
    },
    {
      id: 'p2',
      name: 'Product B',
      x: 7,
      y: 6,
      size: 18,
      company: 'Competitor A',
      color: '#ffc107',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-2">Round {currentRound} Overview</p>
      </div>

      {/* KPI 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Revenue" className="bg-gradient-to-br from-primary-50 to-white">
          <div className="text-3xl font-bold text-primary-600">$1.1M</div>
          <div className="text-sm text-neutral-600 mt-2">
            <span className="text-danger-500">↓ -8.3%</span> vs Previous Round
          </div>
        </Card>

        <Card title="Market Share" className="bg-gradient-to-br from-success-50 to-white">
          <div className="text-3xl font-bold text-success-600">16.2%</div>
          <div className="text-sm text-neutral-600 mt-2">
            <span className="text-success-500">↑ +1.2%</span> vs Previous Round
          </div>
        </Card>

        <Card title="Net Profit" className="bg-gradient-to-br from-primary-50 to-white">
          <div className="text-3xl font-bold text-primary-600">$160k</div>
          <div className="text-sm text-neutral-600 mt-2">
            <span className="text-danger-500">↓ -11.1%</span> vs Previous Round
          </div>
        </Card>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시계열 차트 */}
        <Card title="Revenue Trend" description="Historical performance">
          <LineChart
            data={kpiData}
            dataKeys={[
              { key: 'revenue', stroke: '#007bff', name: 'Revenue' },
            ]}
            xDataKey="round"
            yLabel="Revenue ($)"
          />
        </Card>

        {/* 포지셔닝 맵 */}
        <Card title="Product Positioning" description="Market perception map">
          <PositioningMap
            data={positioningData}
            xLabel="Price"
            yLabel="Quality"
          />
        </Card>
      </div>
    </div>
  )
}
```

---

## 6. 의사결정 페이지 예시 (app/decisions/marketing/page.tsx)

```tsx
// app/decisions/marketing/page.tsx
'use client'

import { useState } from 'react'
import Card from '@/components/Common/Card'
import BudgetSlider from '@/components/Decision/BudgetSlider'
import { validateMarketingDecision } from '@/lib/decision-validation'

export default function MarketingDecisionPage() {
  const [decision, setDecision] = useState({
    adSpend: 500000,
    promotionBudget: 200000,
    price: 49.99,
    targetSegment: ['premium', 'mainstream'],
  })

  const [validationResult, setValidationResult] = useState<any>(null)

  const handleSubmit = () => {
    const result = validateMarketingDecision(decision)
    setValidationResult(result)

    if (result.valid) {
      // API로 의사결정 제출
      console.log('Submitting decision:', decision)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Marketing Mix Decision</h1>
        <p className="text-neutral-600 mt-2">Define your marketing strategy for this round</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 입력 카드 */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Budget Allocation">
            <div className="space-y-6">
              <BudgetSlider
                label="Advertising Spend"
                min={0}
                max={1000000}
                value={decision.adSpend}
                onChange={(value) => setDecision({ ...decision, adSpend: value })}
                unit="$"
              />

              <BudgetSlider
                label="Promotion Budget"
                min={0}
                max={500000}
                value={decision.promotionBudget}
                onChange={(value) => setDecision({ ...decision, promotionBudget: value })}
                unit="$"
              />
            </div>
          </Card>

          <Card title="Pricing Strategy">
            <BudgetSlider
              label="Product Price"
              min={10}
              max={200}
              value={decision.price}
              onChange={(value) => setDecision({ ...decision, price: value })}
              unit="$"
            />
          </Card>

          {/* 검증 오류 */}
          {validationResult && !validationResult.valid && (
            <div className="px-4 py-3 bg-danger-50 border border-danger-200 rounded-lg">
              <h4 className="font-semibold text-danger-700">Validation Errors:</h4>
              <ul className="text-sm text-danger-600 mt-2 list-disc list-inside">
                {Object.entries(validationResult.errors).map(([key, message]) => (
                  <li key={key}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            className="w-full px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition"
          >
            Submit Decisions
          </button>
        </div>

        {/* 미리보기 패널 */}
        <div>
          <Card title="Preview" description="Estimated impact">
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-neutral-600">Total Marketing Budget</p>
                <p className="text-2xl font-bold text-primary-600">
                  ${(decision.adSpend + decision.promotionBudget).toLocaleString()}
                </p>
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <p className="text-neutral-600">Estimated Market Share Impact</p>
                <p className="text-lg font-semibold text-success-600">+2.3%</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

---

## 7. 모바일 반응형 고려사항

```css
/* 모바일 태블릿 */
@media (max-width: 768px) {
  /* 사이드바를 하단 탭 네비로 변경 */
  aside.sidebar {
    display: none;
  }

  nav.bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 64px;
  }

  main {
    padding-bottom: 80px; /* 하단 네비 공간 */
  }

  /* 카드 그리드를 단일 열로 */
  .grid-cols-3 {
    @apply grid-cols-1;
  }

  /* 텍스트 크기 축소 */
  h1 {
    @apply text-2xl;
  }

  /* 슬라이더 풀 너비 */
  input[type='range'] {
    width: 100%;
  }
}
```

---

## 8. 색상 및 폰트 일관성 체크리스트

- [ ] 모든 버튼이 Tailwind 색상 클래스 사용
- [ ] 텍스트 크기가 정의된 스케일 준수
- [ ] 간격(padding, margin)이 `spacing` 토큰 사용
- [ ] 모든 카드에 일관된 border-radius (md)
- [ ] 차트 색상이 색상팔레트 준수
- [ ] 다크 모드 미지원 (Light 테마만)
- [ ] 폰트: Roboto 또는 시스템 San-serif
- [ ] 경고/성공/오류 메시지 색상 일관성

---

**참고**: 이 가이드는 Markstrat 레퍼런스 기반으로, BizSim의 구체적인 구현 방법을 제시합니다.  
필요에 따라 색상, 컴포넌트 구조를 조정하세요.
