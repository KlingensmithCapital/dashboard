"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "../lib/supabase"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Holding {
  ticker: string
  name: string
  sector: string
  shares: number
  costBasis: number
  price: number
  change: number
  changePct: number
  value: number
  pnl: number
  pnlPct: number
}

interface Transaction {
  id: number
  date: string
  merchant: string
  category: string
  card: string
  amount: number
}

interface WatchlistItem {
  ticker: string
  name: string
  price: number
  change: number
  changePct: number
  marketCap: string
  pe: number | null
  note: string
}

interface NetWorthAccount {
  name: string
  institution: string
  type: "brokerage" | "retirement" | "cash" | "other"
  value: number
  change: number
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

const HOLDINGS: Holding[] = [
  { ticker: "SPY",  name: "SPDR S&P 500 ETF",     sector: "ETF",        shares: 312,  costBasis: 401.12, price: 524.18, change: -11.42, changePct: -2.13, value: 163544,  pnl: 38413,  pnlPct: 30.7 },
  { ticker: "QQQ",  name: "Invesco QQQ Trust",      sector: "ETF",        shares: 280,  costBasis: 338.11, price: 441.32, change: -14.87, changePct: -3.26, value: 123570,  pnl: 28906,  pnlPct: 30.5 },
  { ticker: "PLTR", name: "Palantir Technologies",  sector: "Technology", shares: 2400, costBasis: 40.57,  price: 89.74,  change:  -4.21, changePct: -4.48, value: 215376,  pnl: 117528, pnlPct: 121.2 },
  { ticker: "TSLA", name: "Tesla Inc.",             sector: "Auto",       shares: 180,  costBasis: 287.00, price: 241.37, change:  -9.63, changePct: -3.84, value: 43447,   pnl: -8213,  pnlPct: -15.9 },
]

const TRANSACTIONS: Transaction[] = [
  { id: 1, date: "Apr 8",  merchant: "Whole Foods Market",      category: "Groceries", card: "Amex Blue Business Plus", amount: 127.43 },
  { id: 2, date: "Apr 7",  merchant: "Delta Air Lines",         category: "Travel",    card: "Amex Blue Business Plus", amount: 892.00 },
  { id: 3, date: "Apr 6",  merchant: "Lemon Squeezy",           category: "Software",  card: "Amex Blue Business Plus", amount: 31.58  },
  { id: 4, date: "Apr 5",  merchant: "Intuit Quickbooks",       category: "Software",  card: "Amex Blue Business Plus", amount: 41.37  },
  { id: 5, date: "Apr 4",  merchant: "Uber",                    category: "Transport", card: "Amex Blue Business Plus", amount: 6.95   },
  { id: 6, date: "Apr 3",  merchant: "Foreign Transaction Fee", category: "Fees",      card: "Amex Blue Business Plus", amount: 0.10   },
  { id: 7, date: "Apr 2",  merchant: "AWS",                     category: "Software",  card: "Amex Blue Business Plus", amount: 214.88 },
  { id: 8, date: "Apr 1",  merchant: "United Airlines",         category: "Travel",    card: "Amex Blue Business Plus", amount: 547.20 },
]

const WATCHLIST: WatchlistItem[] = [
  { ticker: "NVDA", name: "NVIDIA Corporation",    price: 875.39, change:  -32.14, changePct: -3.54, marketCap: "2.15T", pe: 68.2, note: "AI infrastructure play — watching for sub-$800 entry" },
  { ticker: "MSFT", name: "Microsoft Corporation", price: 378.85, change:   -8.22, changePct: -2.12, marketCap: "2.81T", pe: 34.1, note: "Copilot monetization ramp Q3 earnings" },
  { ticker: "META", name: "Meta Platforms",        price: 511.20, change:  -19.87, changePct: -3.74, marketCap: "1.30T", pe: 26.8, note: "Reality Labs losses narrowing; Llama moat" },
  { ticker: "BRK.B",name: "Berkshire Hathaway B",  price: 440.62, change:   +2.18, changePct: +0.50, marketCap: "963B",  pe: 21.4, note: "Cash hoard optionality if market dislocates" },
  { ticker: "V",    name: "Visa Inc.",             price: 274.33, change:   -3.91, changePct: -1.41, marketCap: "559B",  pe: 29.5, note: "Cross-border volume recovery thesis" },
]

const NET_WORTH_ACCOUNTS: NetWorthAccount[] = [
  { name: "Taxable Brokerage",  institution: "Fidelity", type: "brokerage",  value: 545937, change:  14832 },
  { name: "401(k)",             institution: "Fidelity", type: "retirement", value: 184200, change:   2100 },
  { name: "Roth IRA",           institution: "Fidelity", type: "retirement", value:  62400, change:    840 },
  { name: "High-Yield Savings", institution: "Marcus",   type: "cash",       value:  48000, change:    192 },
  { name: "Checking",           institution: "Chase",    type: "cash",       value:  12750, change:      0 },
]

const MONTHLY_SPEND = [
  { month: "Nov", amount: 2840 },
  { month: "Dec", amount: 4120 },
  { month: "Jan", amount: 3210 },
  { month: "Feb", amount: 2980 },
  { month: "Mar", amount: 3640 },
  { month: "Apr", amount: 1861 },
]

const CATEGORY_META: Record<string, { color: string; bg: string; icon: string }> = {
  Groceries:  { color: "text-emerald-700", bg: "bg-emerald-50 ring-emerald-200",  icon: "🛒" },
  Travel:     { color: "text-sky-700",     bg: "bg-sky-50 ring-sky-200",          icon: "✈️" },
  Software:   { color: "text-violet-700",  bg: "bg-violet-50 ring-violet-200",    icon: "💻" },
  Transport:  { color: "text-amber-700",   bg: "bg-amber-50 ring-amber-200",      icon: "🚗" },
  Fees:       { color: "text-rose-700",    bg: "bg-rose-50 ring-rose-200",        icon: "📋" },
  Dining:     { color: "text-orange-700",  bg: "bg-orange-50 ring-orange-200",    icon: "🍽️" },
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = {
  usd: (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toFixed(2)}`,
  usdFull: (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n),
  pct: (n: number, sign = true) => `${sign && n > 0 ? "+" : ""}${n.toFixed(2)}%`,
  delta: (n: number) => `${n >= 0 ? "+" : ""}${Math.abs(n).toFixed(2)}`,
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset", className)}>
      {children}
    </span>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/60", className)}>
      {children}
    </div>
  )
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-50">
      <div>
        <h2 className="text-[13px] font-semibold text-gray-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="mt-0.5">{action}</div>}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  sub: string
  trend?: "up" | "down" | "neutral"
  accent?: string
}

function StatCard({ label, value, sub, trend, accent }: StatCardProps) {
  const trendColor =
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-500" : "text-gray-400"
  return (
    <Card className="p-5">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">{label}</p>
      <p className={cn("text-2xl font-semibold mt-1.5 tracking-tight", accent ?? "text-gray-900")}>
        {value}
      </p>
      <p className={cn("text-xs mt-1 font-medium", trendColor)}>{sub}</p>
    </Card>
  )
}

function DeltaCell({ value, pct }: { value: number; pct: number }) {
  const pos = value >= 0
  return (
    <span className={cn("font-medium tabular-nums", pos ? "text-emerald-600" : "text-rose-500")}>
      {fmt.delta(value)} ({fmt.pct(pct)})
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

function LoginScreen() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: process.env.NEXT_PUBLIC_DASHBOARD_EMAIL!,
      password,
    })
    if (authError) {
      setError("Incorrect password.")
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%)" }}
    >
      <div className="w-full max-w-[360px] px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gray-900 shadow-lg shadow-gray-900/20 mb-4">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Klingensmith Capital</h1>
          <p className="text-sm text-gray-400 mt-1">Private Dashboard</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900/20 transition-all placeholder-gray-300"
              />
            </div>
            {error && (
              <p className="text-xs text-rose-500 flex items-center gap-1.5">
                <span>⚠</span> {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white font-medium py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO TAB
// ─────────────────────────────────────────────────────────────────────────────

function PortfolioTab() {
  const totalValue  = useMemo(() => HOLDINGS.reduce((s, h) => s + h.value, 0), [])
  const totalPnl    = useMemo(() => HOLDINGS.reduce((s, h) => s + h.pnl, 0), [])
  const totalCost   = totalValue - totalPnl
  const totalPnlPct = (totalPnl / totalCost) * 100
  const dayChange   = HOLDINGS.reduce((s, h) => s + h.change * h.shares, 0)
  const dayChangePct = (dayChange / totalValue) * 100
  const winners     = HOLDINGS.filter(h => h.pnl > 0).length
  const winRate     = (winners / HOLDINGS.length) * 100

  const ALLOC_COLORS = ["#111827", "#3b82f6", "#8b5cf6", "#f59e0b"]

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Portfolio Value"
          value={fmt.usd(totalValue)}
          sub="As of today"
          trend="neutral"
        />
        <StatCard
          label="Total P&L"
          value={fmt.usd(Math.abs(totalPnl))}
          sub={`${fmt.pct(totalPnlPct)} all time`}
          trend={totalPnl >= 0 ? "up" : "down"}
          accent={totalPnl >= 0 ? "text-emerald-600" : "text-rose-500"}
        />
        <StatCard
          label="Day Change"
          value={`${dayChange >= 0 ? "+" : "-"}${fmt.usd(Math.abs(dayChange))}`}
          sub={`${fmt.pct(dayChangePct)} today`}
          trend={dayChange >= 0 ? "up" : "down"}
          accent={dayChange >= 0 ? "text-emerald-600" : "text-rose-500"}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate.toFixed(0)}%`}
          sub={`${winners} of ${HOLDINGS.length} positions`}
          trend="up"
        />
      </div>

      {/* Holdings table + Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2 overflow-hidden">
          <CardHeader
            title="Holdings"
            subtitle={`${HOLDINGS.length} positions · updated live`}
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Asset", "Price", "24h", "Shares", "Value", "P&L"].map(h => (
                    <th
                      key={h}
                      className={cn(
                        "py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider",
                        h === "Asset" ? "pl-6 text-left" : "pr-5 text-right"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOLDINGS.map((h, i) => (
                  <tr
                    key={h.ticker}
                    className={cn(
                      "transition-colors hover:bg-gray-50/80",
                      i < HOLDINGS.length - 1 && "border-b border-gray-50/80"
                    )}
                  >
                    <td className="pl-6 pr-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                          <span className="text-white text-[9px] font-bold tracking-tight">
                            {h.ticker.slice(0, 3)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{h.ticker}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">{h.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="pr-5 py-4 text-right text-sm font-medium text-gray-900 tabular-nums">
                      ${h.price.toFixed(2)}
                    </td>
                    <td className="pr-5 py-4 text-right text-sm tabular-nums">
                      <DeltaCell value={h.change} pct={h.changePct} />
                    </td>
                    <td className="pr-5 py-4 text-right text-sm text-gray-500 tabular-nums">
                      {h.shares.toLocaleString()}
                    </td>
                    <td className="pr-5 py-4 text-right text-sm font-medium text-gray-900 tabular-nums">
                      {fmt.usdFull(h.value)}
                    </td>
                    <td className="pr-5 py-4 text-right text-sm tabular-nums">
                      <DeltaCell value={h.pnl} pct={h.pnlPct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Allocation */}
        <Card>
          <CardHeader title="Allocation" subtitle="By position value" />
          <div className="p-6 space-y-4">
            {HOLDINGS.map((h, i) => {
              const pct = (h.value / totalValue) * 100
              return (
                <div key={h.ticker}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{h.ticker}</span>
                    <span className="text-gray-400 tabular-nums">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: ALLOC_COLORS[i] }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="pt-3 border-t border-gray-50">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total</span>
                <span className="font-semibold text-gray-900">{fmt.usdFull(totalValue)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPENSES TAB
// ─────────────────────────────────────────────────────────────────────────────

function ExpensesTab() {
  const totalSpend    = useMemo(() => TRANSACTIONS.reduce((s, t) => s + t.amount, 0), [])
  const travelSpend   = useMemo(() => TRANSACTIONS.filter(t => t.category === "Travel").reduce((s, t) => s + t.amount, 0), [])
  const softwareSpend = useMemo(() => TRANSACTIONS.filter(t => t.category === "Software").reduce((s, t) => s + t.amount, 0), [])
  const maxSpend      = Math.max(...MONTHLY_SPEND.map(m => m.amount))

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {}
    TRANSACTIONS.forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount })
    return Object.entries(map)
      .map(([cat, amount]) => ({ cat, amount, pct: (amount / totalSpend) * 100 }))
      .sort((a, b) => b.amount - a.amount)
  }, [totalSpend])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="April Spend"      value={`$${totalSpend.toFixed(0)}`}    sub="Month to date"         trend="neutral" />
        <StatCard label="Travel"           value={`$${travelSpend.toFixed(0)}`}   sub="This month"            trend="neutral" />
        <StatCard label="Software / SaaS"  value={`$${softwareSpend.toFixed(0)}`} sub="This month"            trend="neutral" />
        <StatCard label="vs Last Month"    value="-$1,779"                         sub="48.8% less than March" trend="up"      />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar chart */}
        <Card>
          <CardHeader title="Monthly Spend" subtitle="6-month trend" />
          <div className="px-6 pb-6 pt-4">
            <div className="flex items-end gap-2" style={{ height: 100 }}>
              {MONTHLY_SPEND.map(m => {
                const isCurrent = m.month === "Apr"
                const h = (m.amount / maxSpend) * 100
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end" style={{ height: 84 }}>
                      <div
                        className="w-full rounded-t-lg"
                        style={{
                          height: `${h}%`,
                          backgroundColor: isCurrent ? "#111827" : "#e5e7eb",
                        }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        isCurrent ? "text-gray-900" : "text-gray-400"
                      )}
                    >
                      {m.month}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-3">Amex Blue Business Plus</p>
          </div>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader title="By Category" subtitle="April MTD" />
          <div className="px-6 pb-6 pt-4 space-y-4">
            {categoryTotals.map(row => {
              const meta = CATEGORY_META[row.cat]
              return (
                <div key={row.cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{meta?.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{row.cat}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      ${row.amount.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Connected cards */}
        <Card>
          <CardHeader title="Connected Cards" />
          <div className="px-6 pb-6 pt-4 space-y-3">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">AX</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">Amex Blue Business Plus</p>
                <p className="text-xs text-gray-400 mt-0.5">•••• •••• •••• 1004</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Active</Badge>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-gray-200">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Connect via Plaid</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader
          title="Recent Transactions"
          subtitle="Amex Blue Business Plus · April 2025"
        />
        <div>
          {TRANSACTIONS.map((t, i) => {
            const meta = CATEGORY_META[t.category]
            return (
              <div
                key={t.id}
                className={cn(
                  "flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/80 transition-colors",
                  i < TRANSACTIONS.length - 1 && "border-b border-gray-50"
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-sm">{meta?.icon ?? "💳"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.merchant}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.date}</p>
                </div>
                <Badge className={cn(meta?.bg, meta?.color)}>{t.category}</Badge>
                <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                  ${t.amount.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WATCHLIST TAB
// ─────────────────────────────────────────────────────────────────────────────

function WatchlistTab() {
  return (
    <div className="space-y-3">
      {WATCHLIST.map(w => (
        <Card key={w.ticker} className="hover:shadow-md hover:shadow-gray-100 transition-shadow">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                <span className="text-white text-[9px] font-bold tracking-tight text-center leading-tight">
                  {w.ticker}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-900">{w.ticker}</h3>
                  <span className="text-xs text-gray-400">{w.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{w.note}</p>
                <div className="flex items-center gap-2 mt-2.5">
                  <Badge className="bg-gray-50 text-gray-500 ring-gray-200">Cap {w.marketCap}</Badge>
                  {w.pe && (
                    <Badge className="bg-gray-50 text-gray-500 ring-gray-200">P/E {w.pe}</Badge>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900 tabular-nums">${w.price.toFixed(2)}</p>
                <p
                  className={cn(
                    "text-xs font-medium mt-0.5 tabular-nums",
                    w.change >= 0 ? "text-emerald-600" : "text-rose-500"
                  )}
                >
                  {fmt.delta(w.change)} ({fmt.pct(w.changePct)})
                </p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NET WORTH TAB
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<NetWorthAccount["type"], { label: string; color: string }> = {
  brokerage:  { label: "Brokerage",  color: "#111827" },
  retirement: { label: "Retirement", color: "#3b82f6" },
  cash:       { label: "Cash",       color: "#10b981" },
  other:      { label: "Other",      color: "#9ca3af" },
}

function NetWorthTab() {
  const totalNetWorth = useMemo(() => NET_WORTH_ACCOUNTS.reduce((s, a) => s + a.value, 0), [])
  const totalChange   = useMemo(() => NET_WORTH_ACCOUNTS.reduce((s, a) => s + a.change, 0), [])

  const byType = useMemo(() => {
    const map: Record<string, number> = {}
    NET_WORTH_ACCOUNTS.forEach(a => { map[a.type] = (map[a.type] ?? 0) + a.value })
    return Object.entries(map).map(([type, value]) => ({
      type: type as NetWorthAccount["type"],
      value,
      pct: (value / totalNetWorth) * 100,
    }))
  }, [totalNetWorth])

  return (
    <div className="space-y-5">
      {/* Hero */}
      <Card className="p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
              Total Net Worth
            </p>
            <p className="text-4xl font-semibold text-gray-900 tracking-tight mt-2">
              {fmt.usdFull(totalNetWorth)}
            </p>
            <p
              className={cn(
                "text-sm font-medium mt-2",
                totalChange >= 0 ? "text-emerald-600" : "text-rose-500"
              )}
            >
              {totalChange >= 0 ? "+" : ""}
              {fmt.usdFull(totalChange)} today
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
              Accounts
            </p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{NET_WORTH_ACCOUNTS.length}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Type breakdown */}
        <Card>
          <CardHeader title="By Account Type" />
          <div className="px-6 pb-6 pt-4 space-y-4">
            {byType.map(({ type, value, pct }) => {
              const meta = TYPE_LABELS[type]
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{meta.label}</span>
                    <span className="text-gray-400 tabular-nums">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 tabular-nums">{fmt.usdFull(value)}</p>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Accounts list */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader title="All Accounts" />
          <div>
            {NET_WORTH_ACCOUNTS.map((a, i) => {
              const meta = TYPE_LABELS[a.type]
              return (
                <div
                  key={a.name}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors",
                    i < NET_WORTH_ACCOUNTS.length - 1 && "border-b border-gray-50"
                  )}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.institution} · {meta.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">
                      {fmt.usdFull(a.value)}
                    </p>
                    <p
                      className={cn(
                        "text-xs mt-0.5 tabular-nums",
                        a.change > 0
                          ? "text-emerald-600"
                          : a.change < 0
                          ? "text-rose-500"
                          : "text-gray-400"
                      )}
                    >
                      {a.change === 0
                        ? "—"
                        : `${a.change > 0 ? "+" : "-"}${fmt.usdFull(Math.abs(a.change))}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR NAV CONFIG
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "portfolio" | "expenses" | "watchlist" | "networth"

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "portfolio",
    label: "Portfolio",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    id: "networth",
    label: "Net Worth",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    id: "watchlist",
    label: "Watchlist",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SHELL
// ─────────────────────────────────────────────────────────────────────────────

function Dashboard({ onLogout }: { onLogout: () => Promise<void> }) {
  const [tab, setTab] = useState<Tab>("portfolio")

  const totalPortfolio = HOLDINGS.reduce((s, h) => s + h.value, 0)
  const dayChange      = HOLDINGS.reduce((s, h) => s + h.change * h.shares, 0)

  const tabTitle: Record<Tab, string> = {
    portfolio: "Portfolio",
    networth:  "Net Worth",
    expenses:  "Expenses",
    watchlist: "Watchlist",
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-white border-r border-gray-100 flex flex-col fixed top-0 left-0 h-full z-20">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-900 leading-tight tracking-tight">
                Klingensmith
              </p>
              <p className="text-[10px] text-gray-400 leading-tight tracking-wide uppercase">
                Capital
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                tab === n.id
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-2.5 py-3 border-t border-gray-50">
          <button
            onClick={() => void onLogout()}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 ml-52">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">
              {tabTitle[tab]}
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 tabular-nums">
                {fmt.usdFull(totalPortfolio)}
              </p>
              <p
                className={cn(
                  "text-xs tabular-nums font-medium",
                  dayChange >= 0 ? "text-emerald-600" : "text-rose-500"
                )}
              >
                {dayChange >= 0 ? "+" : ""}
                {fmt.usdFull(dayChange)} today
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
              <span className="text-white text-[11px] font-semibold">JK</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6">
          {tab === "portfolio" && <PortfolioTab />}
          {tab === "networth"  && <NetWorthTab />}
          {tab === "expenses"  && <ExpensesTab />}
          {tab === "watchlist" && <WatchlistTab />}
        </main>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function FinancialDashboard() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  if (loggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!loggedIn) return <LoginScreen />
  return <Dashboard onLogout={handleLogout} />
}
