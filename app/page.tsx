import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { signOut } from "@/app/login/actions"
import { GenerateBriefButton } from "@/app/components/GenerateBriefButton"
import { SyncPricesButton } from "@/app/components/SyncPricesButton"
import { SyncSchwabButton } from "@/app/components/SyncSchwabButton"
import { TickerTape } from "@/app/components/TickerTape"
import { AutoSync } from "@/app/components/AutoSync"

type Status = "GREEN" | "AMBER" | "RED"


const priorities = [
  { label: "Portfolio", value: "Concentrated", detail: "NVDA + CEG driving the tape" },
  { label: "Risk", value: "Controlled", detail: "Cash and thesis guardrails respected" },
  { label: "Ops", value: "Current", detail: "Expense ingestion up to date" },
]

const briefItems = [
  "Indices remain constructive pre-open as rates ease and AI leadership broadens.",
  "Balance-sheet posture is healthy. The deployable cash floor remains intact with room to add.",
  "Primary watchpoints are DKNG thesis drift, CING catalyst timing, and any reversal in long-duration beta.",
]

const flightPlan = [
  "Review held-name overnight moves and clear the alert queue before the open.",
  "Decide whether DKNG moves from watch to active thesis review.",
  "Promote one idea from the queue into formal research coverage.",
  "Confirm personal expense ingestion is current before weekly capital allocation.",
]

const positions = [
  { ticker: "NVDA", theme: "AI Infrastructure", account: "Roth IRA", weight: "31.4%", value: "$188,400", pnl: "+18.2%", status: "GREEN" as Status },
  { ticker: "CEG", theme: "Nuclear demand supercycle", account: "Roth IRA", weight: "12.7%", value: "$34,900", pnl: "+9.7%", status: "GREEN" as Status },
  { ticker: "DKNG", theme: "Operating leverage + state optionality", account: "Taxable", weight: "4.1%", value: "$11,240", pnl: "-3.1%", status: "AMBER" as Status },
  { ticker: "CING", theme: "Binary catalyst sizing discipline", account: "Taxable", weight: "2.2%", value: "$6,110", pnl: "+4.6%", status: "AMBER" as Status },
]

const allocation = [
  { name: "AI / Semis", weight: 38, change: "+240 bps" },
  { name: "Power & Utilities", weight: 17, change: "+60 bps" },
  { name: "Consumer Internet", weight: 11, change: "-35 bps" },
  { name: "Speculative Event", weight: 5, change: "Flat" },
]

const movers = [
  { ticker: "NVDA", driver: "Leadership broadening with rates tailwind", move: "+2.4%", tone: "text-emerald-600" },
  { ticker: "CEG", driver: "Utility / AI power narrative holding firm", move: "+1.1%", tone: "text-emerald-600" },
  { ticker: "DKNG", driver: "Momentum cooling after operating update", move: "-1.6%", tone: "text-amber-600" },
]

const catalysts = [
  { when: "Today", item: "Re-underwrite DKNG after recent operating update", dot: "bg-amber-400" },
  { when: "2D", item: "Pressure-test CEG policy and regulatory sensitivity", dot: "bg-sky-400" },
  { when: "6D", item: "Finalize CING catalyst prep and sizing memo", dot: "bg-rose-400" },
  { when: "9D", item: "Refresh deployable-cash map for May contributions", dot: "bg-emerald-400" },
]

const ideas = [
  { name: "Power & Grid Basket", score: 84, note: "Second-derivative AI capex beneficiaries with improving utility demand setup.", action: "Promote to research" },
  { name: "Payments Quality Screen", score: 76, note: "Cross-border and network-quality basket with cleaner downside and compounding traits.", action: "Watch" },
  { name: "Small-Cap Special Sit", score: 63, note: "Variant perception could be real, but the catalyst map still needs proof.", action: "Hold" },
]

const memory = [
  { title: "Thesis Drift", body: "DKNG is still a category winner, but the sizing should reflect slower near-term momentum and less obvious upside skew." },
  { title: "Kill Criteria", body: "Every position needs a clear non-price invalidation condition so exits are driven by process rather than emotion." },
  { title: "PM Preference", body: "Roth capital should stay concentrated in long-duration compounders and structural winners with real runway." },
]

const opsRail = [
  { label: "Statement Ingestion", value: "Current", sub: "Latest card review absorbed" },
  { label: "Expense Runway", value: "Healthy", sub: "Savings rate still supports deployment" },
  { label: "Document Queue", value: "2 Pending", sub: "One report, one statement" },
]

const agents = [
  { name: "Morning Brief Agent", role: "Builds the pre-market setup, PM agenda, and catalyst framing." },
  { name: "Portfolio Monitor", role: "Flags concentration, sharp moves, and thesis risk in held names." },
  { name: "Idea Scout", role: "Surfaces new longs and watchlist candidates for PM approval." },
  { name: "Memory Agent", role: "Stores why positions are owned, what changed, and what breaks them." },
]

function statusClasses(status: Status) {
  if (status === "GREEN") return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  if (status === "AMBER") return "bg-amber-50 text-amber-700 ring-amber-200"
  return "bg-rose-50 text-rose-700 ring-rose-200"
}

function scoreClasses(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  if (score >= 70) return "bg-sky-50 text-sky-700 ring-sky-200"
  return "bg-amber-50 text-amber-700 ring-amber-200"
}

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [holdingsRes, balanceRes, briefRes] = await Promise.all([
    supabase
      .from("holdings")
      .select("ticker, theme, weight_pct, market_value, pnl_pct, status, accounts(name)")
      .eq("is_active", true)
      .order("weight_pct", { ascending: false }),
    supabase
      .from("balances")
      .select("value, cash_available")
      .is("account_id", null)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("morning_briefs")
      .select("market_summary, portfolio_notes, flight_plan, market_context, watchpoints, generated_at")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const holdings = holdingsRes.data
  const balance = balanceRes.data
  const brief = briefRes.data

  const livePositions = (holdings ?? []).map((h) => ({
    ticker: h.ticker,
    theme: h.theme ?? "",
    account: (Array.isArray(h.accounts) ? h.accounts[0]?.name : (h.accounts as { name: string } | null)?.name) ?? "",
    weight: `${h.weight_pct}%`,
    value: `$${Number(h.market_value).toLocaleString()}`,
    pnl: `${h.pnl_pct > 0 ? "+" : ""}${h.pnl_pct}%`,
    status: (h.status.toUpperCase()) as Status,
  }))

  const netWorth = balance ? `$${Number(balance.value).toLocaleString()}` : "$742,900"
  const cashAvailable = balance ? `$${Number(balance.cash_available).toLocaleString()}` : "$28,400"

  const commandDeck = [
    { label: "Total Net Worth", value: netWorth, delta: "+$6,420 day", note: "+0.87% move", tone: "text-slate-900" },
    { label: "Deployable Cash", value: cashAvailable, delta: "$20K floor", note: "Safety discipline intact", tone: "text-emerald-700" },
    { label: "Open Alerts", value: "3", delta: "1 thesis", note: "2 catalysts need review", tone: "text-amber-700" },
    { label: "Morning Brief", value: "06:20 CT", delta: "Complete", note: "Agent sweep delivered", tone: "text-sky-700" },
    { label: "Idea Queue", value: "4", delta: "2 high-conviction", note: "1 ready to promote", tone: "text-violet-700" },
    { label: "Flight Status", value: "Ready", delta: "No stress signal", note: "Portfolio posture constructive", tone: "text-emerald-700" },
  ]

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-900">
      <AutoSync />
      <TickerTape />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">

        {/* Zone 1 — Command Bar */}
        <section className="panel-shell reveal-fade rounded-2xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Klingensmith Capital</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Portfolio Manager Cockpit</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {["Cockpit", "Portfolio", "Morning Brief", "Ideas", "Memory", "Operations"].map((tab, i) => (
                <button key={tab} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${i === 0 ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}>
                  {tab}
                </button>
              ))}
              <form action={signOut}>
                <button type="submit" className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-400 transition hover:border-rose-200 hover:text-rose-500">
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {commandDeck.map((card) => (
              <div key={card.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                <p className={`mt-2 text-xl font-semibold tracking-tight ${card.tone}`}>{card.value}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>{card.delta}</span>
                  <span className="text-right">{card.note}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.55fr_0.9fr]">
          <div className="space-y-5">

            {/* Zone 2 — Morning Brief */}
            <section className="panel-shell reveal-fade rounded-2xl p-6">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Morning Brief</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Pre-market setup · decision support</h2>
                </div>
                <div className="flex items-center gap-3">
                  {brief?.generated_at && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {new Date(brief.generated_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
                    </span>
                  )}
                  <GenerateBriefButton />
                </div>
              </div>

              {brief ? (
                <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-2.5">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600">{brief.market_summary}</div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600">{brief.portfolio_notes}</div>
                    {brief.watchpoints?.length > 0 && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Watchpoints</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {brief.watchpoints.map((w: string) => (
                            <span key={w} className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">{w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {brief.market_context && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Market Context</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          {[
                            { label: "Leadership", note: (brief.market_context as { leadership: string }).leadership },
                            { label: "Rates", note: (brief.market_context as { rates: string }).rates },
                            { label: "Risk Posture", note: (brief.market_context as { risk_posture: string }).risk_posture },
                          ].map((ctx) => (
                            <div key={ctx.label}>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{ctx.label}</p>
                              <p className="mt-1 text-sm text-slate-600">{ctx.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">PM Flight Plan</p>
                    <ul className="mt-3 space-y-3">
                      {(brief.flight_plan as string[]).map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm leading-6 text-slate-600">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-500">{i + 1}</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mt-8 flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <p className="text-sm text-slate-500">No brief generated yet for today.</p>
                  <p className="text-xs text-slate-400">Hit "Generate Brief" to run the Morning Brief Agent against your live portfolio.</p>
                </div>
              )}
            </section>

            {/* Zone 3 — Portfolio Snapshot */}
            <section className="panel-shell reveal-fade rounded-2xl p-6">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Portfolio Snapshot</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Holdings, concentration, and pressure points</h2>
                </div>
                <div className="flex items-center gap-2">
                  <SyncSchwabButton />
                  <SyncPricesButton />
                </div>
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <div className="grid grid-cols-[0.9fr_1.4fr_0.9fr_0.6fr_0.75fr_0.65fr] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    <div>Ticker</div><div>Thesis</div><div>Account</div>
                    <div className="text-right">Weight</div><div className="text-right">Value</div><div className="text-right">Status</div>
                  </div>
                  {(livePositions.length ? livePositions : positions).map((p) => (
                    <div key={p.ticker} className="grid grid-cols-[0.9fr_1.4fr_0.9fr_0.6fr_0.75fr_0.65fr] gap-3 border-b border-slate-50 px-4 py-3.5 text-sm last:border-b-0">
                      <div>
                        <p className="font-semibold text-slate-900">{p.ticker}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{p.pnl}</p>
                      </div>
                      <div className="text-slate-600">{p.theme}</div>
                      <div className="text-slate-500">{p.account}</div>
                      <div className="text-right font-medium text-slate-700">{p.weight}</div>
                      <div className="text-right font-semibold text-slate-900">{p.value}</div>
                      <div className="flex justify-end">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] ring-1 ${statusClasses(p.status)}`}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Top Movers</p>
                    <div className="mt-3 space-y-2">
                      {movers.map((m) => (
                        <div key={m.ticker} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-white p-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{m.ticker}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{m.driver}</p>
                          </div>
                          <span className={`text-sm font-semibold ${m.tone}`}>{m.move}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Concentration Map</p>
                    <div className="mt-3 space-y-3">
                      {allocation.map((b) => (
                        <div key={b.name}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">{b.name}</span>
                            <span className="text-slate-400">{b.weight}% · {b.change}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-slate-200">
                            <div className="h-1.5 rounded-full bg-slate-800" style={{ width: `${b.weight}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Zone 4 — Idea Pipeline + Thesis Memory */}
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="panel-shell reveal-fade rounded-2xl p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Idea Pipeline</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Candidates waiting for PM judgment</h2>
                <div className="mt-5 space-y-3">
                  {ideas.map((idea) => (
                    <div key={idea.name} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{idea.name}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{idea.note}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] ring-1 ${scoreClasses(idea.score)}`}>
                            {idea.score}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
                            {idea.action}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel-shell reveal-fade rounded-2xl p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Thesis Memory</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">What changed and what must remain true</h2>
                <div className="mt-5 space-y-3">
                  {memory.map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{item.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Zone 5 — Memory & Ops Rail (sidebar) */}
          <aside className="space-y-5">
            <section className="panel-shell reveal-fade rounded-2xl p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Catalyst Radar</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Upcoming events</h2>
              <div className="mt-5 space-y-2.5">
                {catalysts.map((c) => (
                  <div key={c.item} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{c.when}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{c.item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-shell reveal-fade rounded-2xl p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Operations Rail</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Cash discipline and document flow</h2>
              <div className="mt-5 space-y-2.5">
                {opsRail.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                    <p className="mt-1.5 text-lg font-semibold text-slate-900">{item.value}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{item.sub}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-shell reveal-fade rounded-2xl p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Agent Crew</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Embedded agents</h2>
              <div className="mt-5 space-y-2.5">
                {agents.map((agent) => (
                  <div key={agent.name} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{agent.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{agent.role}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
