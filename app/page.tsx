import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { signOut } from "@/app/login/actions"
import { GenerateBriefButton } from "@/app/components/GenerateBriefButton"
import { SyncPricesButton } from "@/app/components/SyncPricesButton"
import { SyncSchwabButton } from "@/app/components/SyncSchwabButton"
import { TickerTape } from "@/app/components/TickerTape"
import { AutoSync } from "@/app/components/AutoSync"

type Status = "GREEN" | "AMBER" | "RED"

function statusDot(status: Status) {
  if (status === "GREEN") return "bg-emerald-400"
  if (status === "AMBER") return "bg-amber-400"
  return "bg-rose-400"
}

function statusBadge(status: Status) {
  if (status === "GREEN") return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  if (status === "AMBER") return "bg-amber-50 text-amber-700 ring-amber-200"
  return "bg-rose-50 text-rose-700 ring-rose-200"
}

function fmt$(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
  return `$${n.toFixed(2)}`
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`
}

// Placeholder seed data — replaced when DB has real records
const SEED_IDEAS = [
  { name: "Power & Grid Basket", ticker: null, conviction: 84, note: "Second-derivative AI capex beneficiaries.", nextAction: "Promote to research", status: "new", age: "3d" },
  { name: "Payments Quality Screen", ticker: "V", conviction: 76, note: "Cross-border network quality with compounding traits.", nextAction: "Watch", status: "watch", age: "7d" },
  { name: "Small-Cap Special Sit", ticker: null, conviction: 63, note: "Variant perception real but catalyst map needs proof.", nextAction: "Hold", status: "hold", age: "14d" },
]

const SEED_CATALYSTS = [
  { ticker: "DKNG", title: "Re-underwrite after operating update", urgency: "today", action: "Review sizing" },
  { ticker: "CEG", title: "Pressure-test policy & regulatory sensitivity", urgency: "high", action: "Reassess thesis" },
  { ticker: "CING", title: "Finalize catalyst prep and sizing memo", urgency: "normal", action: "Prepare position" },
  { ticker: "MACRO", title: "Refresh deployable-cash map for contributions", urgency: "low", action: "Capital allocation" },
]

const SEED_THESES = [
  { ticker: "DKNG", title: "Thesis Drift", body: "Still a category winner but sizing should reflect slower near-term momentum.", mustRemainTrue: "Market share trajectory holds in core states", reviewCadence: "Weekly", confidence: 6 },
  { ticker: "ALL", title: "Kill Criteria Framework", body: "Every position needs a clear non-price invalidation condition so exits are driven by process.", mustRemainTrue: "PM discipline on thesis documentation", reviewCadence: "Monthly", confidence: 9 },
  { ticker: "ROTH", title: "Roth Capital Mandate", body: "Roth capital stays concentrated in long-duration compounders and structural winners.", mustRemainTrue: "Positions have >5yr runway and structural tailwinds", reviewCadence: "Quarterly", confidence: 10 },
]

function urgencyDot(u: string) {
  if (u === "today") return "bg-rose-400"
  if (u === "high") return "bg-amber-400"
  if (u === "normal") return "bg-sky-400"
  return "bg-slate-300"
}

function urgencyLabel(u: string) {
  if (u === "today") return "Today"
  if (u === "high") return "High"
  if (u === "normal") return "This week"
  return "Low"
}

function convictionColor(c: number) {
  if (c >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  if (c >= 70) return "bg-sky-50 text-sky-700 ring-sky-200"
  return "bg-amber-50 text-amber-700 ring-amber-200"
}

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [holdingsRes, balanceRes, accountsRes, briefRes, catalystsRes, ideasRes, thesesRes] = await Promise.all([
    supabase
      .from("holdings")
      .select("id, account_id, ticker, theme, weight_pct, market_value, cost_basis, shares, pnl_pct, status, last_synced, accounts(name)")
      .eq("is_active", true)
      .order("market_value", { ascending: false }),
    supabase
      .from("balances")
      .select("account_id, value, cash_available, date")
      .order("date", { ascending: false })
      .limit(50),
    supabase
      .from("accounts")
      .select("id, name, type, institution"),
    supabase
      .from("morning_briefs")
      .select("market_summary, portfolio_notes, flight_plan, market_context, watchpoints, generated_at")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("catalyst_events")
      .select("ticker, title, urgency, due_date, type")
      .eq("is_complete", false)
      .order("due_date", { ascending: true })
      .limit(6),
    supabase
      .from("ideas")
      .select("name, ticker, note, score, status, created_at")
      .in("status", ["new", "watch", "promote"])
      .order("score", { ascending: false })
      .limit(5),
    supabase
      .from("theses")
      .select("ticker, title, body, kill_criteria, conviction, status, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(4),
  ])


  const holdings = holdingsRes.data ?? []
  const allBalances = balanceRes.data ?? []
  const allAccounts = accountsRes.data ?? []

  // Most recent balance per account
  const latestBalanceByAccount = new Map<string, { value: number; cash_available: number }>()
  for (const b of allBalances) {
    if (b.account_id && !latestBalanceByAccount.has(b.account_id)) {
      latestBalanceByAccount.set(b.account_id, {
        value: Number(b.value ?? 0),
        cash_available: Number(b.cash_available ?? 0),
      })
    }
  }

  // Accounts that have active holdings = equity accounts (use account_id directly)
  const equityAccountIds = new Set(holdings.map(h => h.account_id).filter(Boolean))

  // Cash-only accounts = have a balance but no active equity holdings
  const cashAccounts = allAccounts
    .filter(a => latestBalanceByAccount.has(a.id) && !equityAccountIds.has(a.id))
    .map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      institution: a.institution,
      value: latestBalanceByAccount.get(a.id)!.value,
    }))
    .sort((a, b) => b.value - a.value)

  const brief = briefRes.data
  const dbCatalysts = catalystsRes.data ?? []
  const dbIdeas = ideasRes.data ?? []
  const dbTheses = thesesRes.data ?? []

  // Derived metrics
  const totalEquityValue = holdings.reduce((s, h) => s + Number(h.market_value ?? 0), 0)
  const totalCashAccounts = cashAccounts.reduce((s, a) => s + a.value, 0)
  const totalCashInBrokerageAccts = Array.from(latestBalanceByAccount.values()).reduce((s, b) => s + b.cash_available, 0)
  const totalCash = totalCashInBrokerageAccts + totalCashAccounts
  // Net worth = sum of all account liquidation values (equity accounts include their internal cash)
  const totalNetWorth = Array.from(latestBalanceByAccount.values()).reduce((s, b) => s + b.value, 0)
  const totalUnrealizedPL = holdings.reduce((s, h) => {
    const mv = Number(h.market_value ?? 0)
    const cb = Number(h.cost_basis ?? 0)
    const shares = Number(h.shares ?? 0)
    return s + (mv - cb * shares)
  }, 0)
  const totalCostBasis = holdings.reduce((s, h) => s + Number(h.cost_basis ?? 0) * Number(h.shares ?? 0), 0)
  const unrealizedPct = totalCostBasis > 0 ? (totalUnrealizedPL / totalCostBasis) * 100 : 0

  const lastSynced = holdings.reduce((latest, h) => {
    if (!h.last_synced) return latest
    return !latest || h.last_synced > latest ? h.last_synced : latest
  }, null as string | null)

  const riskPosture: Status = holdings.some(h => h.status === "red") ? "RED"
    : holdings.some(h => h.status === "amber") ? "AMBER"
    : "GREEN"

  const riskLabel = { GREEN: "Constructive", AMBER: "Cautious", RED: "Elevated" }[riskPosture]

  const ideas = dbIdeas.length ? dbIdeas.map(i => ({
    name: i.name,
    ticker: i.ticker,
    conviction: i.score ?? 0,
    note: i.note ?? "",
    nextAction: i.status === "promote" ? "Promote" : i.status === "watch" ? "Watch" : "Hold",
    status: i.status,
    age: i.created_at ? `${Math.floor((Date.now() - new Date(i.created_at).getTime()) / 86400000)}d` : "—",
  })) : SEED_IDEAS

  const catalysts = dbCatalysts.length ? dbCatalysts.map(c => ({
    ticker: c.ticker ?? "MACRO",
    title: c.title,
    urgency: c.urgency,
    action: c.type === "earnings" ? "Review earnings" : "Review position",
  })) : SEED_CATALYSTS

  const theses = dbTheses.length ? dbTheses.map(t => ({
    ticker: t.ticker,
    title: t.title,
    body: t.body,
    mustRemainTrue: t.kill_criteria ?? "—",
    reviewCadence: "—",
    confidence: t.conviction ?? 0,
  })) : SEED_THESES

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-900">
      <AutoSync />
      <TickerTape />

      {/* Nav */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Klingensmith Capital</p>
            <h1 className="text-base font-semibold tracking-tight text-slate-900">Portfolio Manager Cockpit</h1>
          </div>
          <div className="flex items-center gap-2">
            <SyncSchwabButton />
            <SyncPricesButton />
            <GenerateBriefButton />
            <form action={signOut}>
              <button type="submit" className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-rose-200 hover:text-rose-500">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">

        {/* Zone 1 — Executive Snapshot */}
        <section className="panel-shell reveal-fade rounded-2xl px-6 py-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Executive Snapshot</p>
            <div className="flex items-center gap-2">
              {lastSynced ? (
                <span className="text-[11px] text-slate-400">
                  Synced {new Date(lastSynced).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
              ) : (
                <span className="text-[11px] text-amber-500">No data synced yet</span>
              )}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] ring-1 ${statusBadge(riskPosture)}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusDot(riskPosture)}`} />
                {riskLabel}
              </span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "Net Worth", value: fmt$(totalNetWorth), sub: "Equity + all cash", tone: "text-slate-900" },
              { label: "Total Equity", value: fmt$(totalEquityValue), sub: "Invested positions", tone: "text-sky-700" },
              { label: "Total Cash", value: fmt$(totalCash), sub: "Brokerage + savings", tone: "text-emerald-700" },
              { label: "Unrealized P/L", value: fmt$(totalUnrealizedPL), sub: fmtPct(unrealizedPct), tone: totalUnrealizedPL >= 0 ? "text-emerald-700" : "text-rose-600" },
              { label: "Realized P/L", value: "—", sub: "YTD — not tracked yet", tone: "text-slate-500" },
              { label: "Risk Posture", value: riskLabel, sub: `${holdings.filter(h => h.status !== "green").length} positions flagged`, tone: riskPosture === "GREEN" ? "text-emerald-700" : riskPosture === "AMBER" ? "text-amber-700" : "text-rose-600" },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                <p className={`mt-2 text-xl font-semibold tracking-tight ${card.tone}`}>{card.value}</p>
                <p className="mt-1 text-[11px] text-slate-400">{card.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Zone 2 — Consolidated Portfolio Table */}
        <section className="panel-shell reveal-fade rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Portfolio</p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">Consolidated book · all accounts</h2>
            </div>
            <p className="text-[11px] text-slate-400">{holdings.length} positions · sorted by size</p>
          </div>

          {holdings.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_1fr_1fr_5rem] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                <div />
                <div>Ticker · Account</div>
                <div className="text-right">Market Value</div>
                <div className="text-right">Cost Basis</div>
                <div className="text-right">Unrealized P/L</div>
                <div className="text-right">P/L %</div>
                <div className="text-right">Weight</div>
                <div className="text-center">Status</div>
              </div>
              {holdings.map((h) => {
                const mv = Number(h.market_value ?? 0)
                const cb = Number(h.cost_basis ?? 0)
                const shares = Number(h.shares ?? 0)
                const totalCb = cb * shares
                const upl = mv - totalCb
                const uplPct = Number(h.pnl_pct ?? 0)
                const status = (h.status?.toUpperCase() ?? "GREEN") as Status
                const acctName = (Array.isArray(h.accounts) ? h.accounts[0]?.name : (h.accounts as { name: string } | null)?.name) ?? "—"

                return (
                  <div key={h.id} className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_1fr_1fr_5rem] gap-3 border-b border-slate-50 px-4 py-3.5 text-sm last:border-b-0 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center">
                      <span className={`h-2 w-2 rounded-full ${statusDot(status)}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{h.ticker}</p>
                      <p className="text-[11px] text-slate-400">{acctName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{fmt$(mv)}</p>
                      <p className="text-[11px] text-slate-400">{shares > 0 ? `${shares} sh` : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-700">{totalCb > 0 ? fmt$(totalCb) : "—"}</p>
                      <p className="text-[11px] text-slate-400">{cb > 0 ? `${fmt$(cb)}/sh` : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${upl >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{totalCb > 0 ? fmt$(upl) : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${uplPct >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{fmtPct(uplPct)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-700">{Number(h.weight_pct ?? 0).toFixed(1)}%</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ring-1 ${statusBadge(status)}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                )
              })}
              {/* Equity totals row */}
              {(() => {
                const totalMV = holdings.reduce((s, h) => s + Number(h.market_value ?? 0), 0)
                const totalCB = holdings.reduce((s, h) => s + Number(h.cost_basis ?? 0) * Number(h.shares ?? 0), 0)
                const totalUPL = totalMV - totalCB
                const totalUPLPct = totalCB > 0 ? (totalUPL / totalCB) * 100 : 0
                const totalWeight = holdings.reduce((s, h) => s + Number(h.weight_pct ?? 0), 0)
                return (
                  <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_1fr_1fr_5rem] gap-3 border-t-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm">
                    <div />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Total Equity</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{fmt$(totalMV)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">{totalCB > 0 ? fmt$(totalCB) : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${totalUPL >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{fmt$(totalUPL)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${totalUPLPct >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{fmtPct(totalUPLPct)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">{totalWeight.toFixed(1)}%</p>
                    </div>
                    <div />
                  </div>
                )
              })()}
              {/* Cash & savings accounts */}
              {cashAccounts.length > 0 && (
                <>
                  <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_1fr_1fr_5rem] gap-3 border-t border-slate-100 bg-slate-50/40 px-4 py-2">
                    <div />
                    <div className="col-span-7">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">Cash &amp; Savings</p>
                    </div>
                  </div>
                  {cashAccounts.map((acct) => (
                    <div key={acct.id} className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_1fr_1fr_5rem] gap-3 border-b border-slate-50 bg-slate-50/40 px-4 py-3 text-sm last:border-b-0">
                      <div className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-sky-300" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{acct.name}</p>
                        <p className="text-[11px] text-slate-400">{acct.institution ?? acct.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-700">{fmt$(acct.value)}</p>
                      </div>
                      <div className="text-right"><p className="text-slate-400">—</p></div>
                      <div className="text-right"><p className="text-slate-400">—</p></div>
                      <div className="text-right"><p className="text-slate-400">—</p></div>
                      <div className="text-right"><p className="text-slate-400">—</p></div>
                      <div className="flex items-center justify-center">
                        <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-sky-600 ring-1 ring-sky-200">Cash</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {/* Net Worth total */}
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_1fr_1fr_5rem] gap-3 border-t-2 border-slate-300 bg-slate-100 px-4 py-4 text-sm">
                <div />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">Net Worth</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-slate-900">{fmt$(totalNetWorth)}</p>
                </div>
                <div className="col-span-5" />
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <p className="text-sm text-slate-500">No positions synced yet.</p>
              <p className="mt-1 text-xs text-slate-400">Hit Sync Schwab in the nav to pull your live holdings.</p>
            </div>
          )}
        </section>

        {/* Zone 3 — Decision Zone: Catalysts · Ideas · Operations */}
        <div className="grid gap-5 lg:grid-cols-3">

          {/* Catalyst Radar */}
          <section className="panel-shell reveal-fade rounded-2xl p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Catalyst Radar</p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight text-slate-900">What requires action</h2>
            <div className="mt-4 space-y-2.5">
              {catalysts.map((c, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${urgencyDot(c.urgency)}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-900">{c.ticker}</span>
                        <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{urgencyLabel(c.urgency)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{c.title}</p>
                      <p className="mt-1 text-[11px] text-sky-600">{c.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Idea Pipeline */}
          <section className="panel-shell reveal-fade rounded-2xl p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Idea Pipeline</p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight text-slate-900">Candidates for PM judgment</h2>
            <div className="mt-4 space-y-2.5">
              {ideas.map((idea, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 truncate">{idea.name}</p>
                        {idea.ticker && <span className="text-[10px] text-slate-400">{idea.ticker}</span>}
                      </div>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500 line-clamp-2">{idea.note}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${convictionColor(idea.conviction)}`}>
                      {idea.conviction}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{idea.age} old</span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium">{idea.nextAction}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Operations Strip */}
          <section className="panel-shell reveal-fade rounded-2xl p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Operations</p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight text-slate-900">Status · actions · data</h2>

            <div className="mt-4 space-y-2.5">
              {[
                { label: "Data Freshness", value: lastSynced ? new Date(lastSynced).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Not synced", ok: !!lastSynced },
                { label: "Cash Floor", value: totalCash >= 20000 ? "Maintained" : "Below floor", ok: totalCash >= 20000 },
                { label: "Positions Loaded", value: `${holdings.length} active`, ok: holdings.length > 0 },
                { label: "Morning Brief", value: brief?.generated_at ? new Date(brief.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Not generated", ok: !!brief },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <span className={`text-xs font-medium ${item.ok ? "text-emerald-700" : "text-amber-600"}`}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Morning Brief</p>
              {brief && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                  {brief.market_summary}
                </div>
              )}
              {brief != null && brief?.watchpoints?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(brief.watchpoints as string[]).map((w) => (
                    <span key={w} className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">{w}</span>
                  ))}
                </div>
              )}
              <GenerateBriefButton />
            </div>
          </section>
        </div>

        {/* Zone 4 — Thesis Memory */}
        <section className="panel-shell reveal-fade rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Thesis Memory</p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">Why each position is owned · what must remain true</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {theses.map((t, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t.ticker}</span>
                    <p className="mt-0.5 font-semibold text-slate-900">{t.title}</p>
                  </div>
                  {t.confidence > 0 && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${convictionColor(t.confidence * 10)}`}>
                      {t.confidence}/10
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t.body}</p>
                {t.mustRemainTrue && t.mustRemainTrue !== "—" && (
                  <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-rose-400">Must remain true</p>
                    <p className="mt-0.5 text-xs text-rose-700">{t.mustRemainTrue}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
