"use client"

import { useState } from "react"

// ── Types ──────────────────────────────────────────────────────────────────

interface Holding {
  ticker: string
  name: string
  shares: number
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

// ── Static Data ────────────────────────────────────────────────────────────

const HOLDINGS: Holding[] = [
  { ticker: "SPY",  name: "SPDR S&P 500 ETF",       shares: 312,  price: 524.18, change: -11.42, changePct: -2.13, value: 163544,  pnl: 41200,  pnlPct: 33.7 },
  { ticker: "QQQ",  name: "Invesco QQQ Trust",        shares: 280,  price: 441.32, change: -14.87, changePct: -3.26, value: 123570,  pnl: 28900,  pnlPct: 30.5 },
  { ticker: "PLTR", name: "Palantir Technologies",    shares: 2400, price: 89.74,  change:  -4.21, changePct: -4.48, value: 215376,  pnl: 118000, pnlPct: 121.2 },
  { ticker: "TSLA", name: "Tesla Inc.",               shares: 180,  price: 241.37, change:  -9.63, changePct: -3.84, value: 43447,   pnl: -8200,  pnlPct: -15.9 },
]

const TRANSACTIONS: Transaction[] = [
  { id: 1, date: "Apr 8",  merchant: "Whole Foods Market",   category: "Groceries",   card: "Amex Blue Business Plus", amount: 127.43 },
  { id: 2, date: "Apr 7",  merchant: "Delta Air Lines",      category: "Travel",      card: "Amex Blue Business Plus", amount: 892.00 },
  { id: 3, date: "Apr 6",  merchant: "Lemon Squeezy",        category: "Software",    card: "Amex Blue Business Plus", amount: 31.58 },
  { id: 4, date: "Apr 5",  merchant: "Intuit Quickbooks",    category: "Software",    card: "Amex Blue Business Plus", amount: 41.37 },
  { id: 5, date: "Apr 4",  merchant: "Uber",                 category: "Transport",   card: "Amex Blue Business Plus", amount: 6.95 },
  { id: 6, date: "Apr 3",  merchant: "Foreign Transaction Fee", category: "Fees",     card: "Amex Blue Business Plus", amount: 0.10 },
  { id: 7, date: "Apr 2",  merchant: "AWS",                  category: "Software",    card: "Amex Blue Business Plus", amount: 214.88 },
  { id: 8, date: "Apr 1",  merchant: "United Airlines",      category: "Travel",      card: "Amex Blue Business Plus", amount: 547.20 },
]

const CATEGORY_COLORS: Record<string, string> = {
  Groceries:  "bg-emerald-100 text-emerald-700",
  Travel:     "bg-blue-100 text-blue-700",
  Software:   "bg-purple-100 text-purple-700",
  Transport:  "bg-amber-100 text-amber-700",
  Fees:       "bg-red-100 text-red-700",
  Dining:     "bg-orange-100 text-orange-700",
}

const MONTHLY_SPEND = [
  { month: "Nov", amount: 2840 },
  { month: "Dec", amount: 4120 },
  { month: "Jan", amount: 3210 },
  { month: "Feb", amount: 2980 },
  { month: "Mar", amount: 3640 },
  { month: "Apr", amount: 1861 },
]

const MAX_SPEND = Math.max(...MONTHLY_SPEND.map(m => m.amount))

// ── Subcomponents ──────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email && password) {
      onLogin()
    } else {
      setError("Please enter your credentials.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Klingensmith Capital</h1>
          <p className="text-sm text-gray-500 mt-1">Private Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub: string; positive?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      <p className={`text-sm mt-0.5 ${positive === undefined ? "text-gray-500" : positive ? "text-emerald-600" : "text-red-500"}`}>{sub}</p>
    </div>
  )
}

function PortfolioTab() {
  const totalValue = HOLDINGS.reduce((s, h) => s + h.value, 0)
  const totalPnl   = HOLDINGS.reduce((s, h) => s + h.pnl, 0)
  const totalPnlPct = (totalPnl / (totalValue - totalPnl)) * 100

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Portfolio Value"  value={`$${(totalValue / 1e6).toFixed(2)}M`}   sub="As of today"           />
        <StatCard label="Total P&L"        value={`$${(totalPnl / 1e3).toFixed(1)}K`}      sub={`+${totalPnlPct.toFixed(1)}% all time`} positive={totalPnl > 0} />
        <StatCard label="Day Change"       value="-$14,832"  sub="-2.71% today"  positive={false} />
        <StatCard label="Win Rate"         value="78.4%"     sub="Positions profitable"  positive={true} />
      </div>

      {/* Holdings table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Holdings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Ticker</th>
                <th className="text-right px-5 py-3 font-medium">Price</th>
                <th className="text-right px-5 py-3 font-medium">24h Change</th>
                <th className="text-right px-5 py-3 font-medium">Shares</th>
                <th className="text-right px-5 py-3 font-medium">Position Value</th>
                <th className="text-right px-5 py-3 font-medium">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {HOLDINGS.map(h => (
                <tr key={h.ticker} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900">{h.ticker}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{h.name}</div>
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-gray-900">
                    ${h.price.toFixed(2)}
                  </td>
                  <td className={`px-5 py-4 text-right font-medium ${h.change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {h.change >= 0 ? "+" : ""}{h.change.toFixed(2)} ({h.changePct >= 0 ? "+" : ""}{h.changePct.toFixed(2)}%)
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600">
                    {h.shares.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-gray-900">
                    ${h.value.toLocaleString()}
                  </td>
                  <td className={`px-5 py-4 text-right font-medium ${h.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {h.pnl >= 0 ? "+" : ""}${h.pnl.toLocaleString()} ({h.pnlPct >= 0 ? "+" : ""}{h.pnlPct.toFixed(1)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ExpensesTab() {
  const totalSpend = TRANSACTIONS.reduce((s, t) => s + t.amount, 0)
  const travelSpend = TRANSACTIONS.filter(t => t.category === "Travel").reduce((s, t) => s + t.amount, 0)
  const softwareSpend = TRANSACTIONS.filter(t => t.category === "Software").reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="April Spend"    value={`$${totalSpend.toFixed(0)}`}    sub="Month to date" />
        <StatCard label="Travel"         value={`$${travelSpend.toFixed(0)}`}    sub="This month" />
        <StatCard label="Software / SaaS" value={`$${softwareSpend.toFixed(0)}`} sub="This month" />
        <StatCard label="vs Last Month"  value="-$1,779"  sub="48.8% less than March" positive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spend bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Spend</h2>
          <div className="flex items-end gap-2 h-36">
            {MONTHLY_SPEND.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-blue-500"
                  style={{ height: `${(m.amount / MAX_SPEND) * 100}%`, opacity: m.month === "Apr" ? 1 : 0.4 }}
                />
                <span className="text-xs text-gray-400">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="text-xs text-gray-500">Monthly card spend (Amex BBP)</span>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">By Category</h2>
          <div className="space-y-3">
            {[
              { cat: "Travel",    amount: travelSpend,   pct: Math.round(travelSpend / totalSpend * 100) },
              { cat: "Software",  amount: softwareSpend, pct: Math.round(softwareSpend / totalSpend * 100) },
              { cat: "Groceries", amount: 127,           pct: 7 },
              { cat: "Transport", amount: 7,             pct: 0 },
              { cat: "Fees",      amount: 0.10,          pct: 0 },
            ].map(row => (
              <div key={row.cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{row.cat}</span>
                  <span className="text-gray-900 font-medium">${row.amount.toFixed(0)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Connected Cards</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">AX</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Amex Blue Business Plus</p>
                <p className="text-xs text-gray-500">••••  ••••  ••••  1004</p>
              </div>
              <span className="ml-auto text-xs text-emerald-600 font-medium shrink-0">Active</span>
            </div>
            <p className="text-xs text-gray-400 text-center pt-1">
              Connect more cards via Plaid integration
            </p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
          <span className="text-xs text-gray-400">Amex Blue Business Plus</span>
        </div>
        <div className="divide-y divide-gray-50">
          {TRANSACTIONS.map(t => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-semibold text-gray-500">
                {t.merchant.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{t.merchant}</p>
                <p className="text-xs text-gray-400">{t.date} · {t.card}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[t.category] ?? "bg-gray-100 text-gray-600"}`}>
                {t.category}
              </span>
              <span className="text-sm font-semibold text-gray-900 shrink-0">${t.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

type Tab = "portfolio" | "expenses"

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "portfolio",
    label: "Portfolio",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
]

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("portfolio")

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Klingensmith</p>
              <p className="text-xs text-gray-400 leading-tight">Capital</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === n.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {tab === "portfolio" ? "Portfolio" : "Expenses"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">$545,937</p>
              <p className="text-xs text-red-500">-$14,832 today</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-700 text-xs font-semibold">JK</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {tab === "portfolio" && <PortfolioTab />}
          {tab === "expenses"  && <ExpensesTab />}
        </main>
      </div>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────

export default function FinancialDashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />
  return <Dashboard onLogout={() => setLoggedIn(false)} />
}
