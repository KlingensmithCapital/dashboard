import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { cookies } from "next/headers"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const runStart = Date.now()

  // Gather portfolio context
  const [holdingsRes, balanceRes, catalystsRes, ideasRes] = await Promise.all([
    supabase.from("holdings").select("ticker, theme, weight_pct, market_value, pnl_pct, status, cost_basis, shares").eq("is_active", true).order("weight_pct", { ascending: false }),
    supabase.from("balances").select("value, cash_available").is("account_id", null).order("date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("catalyst_events").select("ticker, title, type, urgency, due_date").eq("is_complete", false).order("due_date", { ascending: true }).limit(10),
    supabase.from("ideas").select("name, ticker, note, score, status").in("status", ["new", "watch", "promote"]).order("score", { ascending: false }).limit(6),
  ])

  const holdings = holdingsRes.data ?? []
  const balance = balanceRes.data
  const catalysts = catalystsRes.data ?? []
  const ideas = ideasRes.data ?? []

  const context = `
TODAY: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}

PORTFOLIO SNAPSHOT
Net worth: ${balance ? `$${Number(balance.value).toLocaleString()}` : "unknown"}
Deployable cash: ${balance ? `$${Number(balance.cash_available).toLocaleString()}` : "unknown"}

HOLDINGS (by weight):
${holdings.map(h => `- ${h.ticker}: ${h.weight_pct}% weight, $${Number(h.market_value).toLocaleString()} value, ${h.pnl_pct > 0 ? "+" : ""}${h.pnl_pct}% P&L, status: ${h.status}, theme: ${h.theme ?? "none"}`).join("\n")}

UPCOMING CATALYSTS:
${catalysts.length ? catalysts.map(c => `- ${c.ticker ?? "macro"}: ${c.title} [${c.urgency}] due ${c.due_date ?? "TBD"}`).join("\n") : "None logged"}

IDEA PIPELINE:
${ideas.length ? ideas.map(i => `- ${i.name}${i.ticker ? ` (${i.ticker})` : ""}: score ${i.score}, status ${i.status}. ${i.note ?? ""}`).join("\n") : "None"}
`.trim()

  const userPrompt = `Portfolio context:\n${context}\n\nGenerate the morning brief JSON now.`

  const systemPrompt = `You are the Morning Brief Agent for Klingensmith Capital — a personal portfolio operating system for a solo PM. Generate a concise, institutional-quality pre-market brief. Be direct, opinionated, and PM-grade. No fluff. Every sentence earns its place.

Respond ONLY with valid JSON matching this exact schema — no markdown, no code fences, no explanation, just the JSON object:
{
  "market_summary": "2-3 sentences: macro tape setup, what is driving the market today, rates and risk environment. Be specific about what matters for THIS portfolio.",
  "portfolio_notes": "2-3 sentences: which held names need attention today, any thesis drift or pressure points, concentration commentary.",
  "flight_plan": ["action 1", "action 2", "action 3", "action 4"],
  "market_context": {
    "leadership": "1 sentence on who or what is leading",
    "rates": "1 sentence on rate environment and impact on portfolio",
    "risk_posture": "1 sentence on recommended posture today"
  },
  "watchpoints": ["TICKER_OR_THEME_1", "TICKER_OR_THEME_2", "TICKER_OR_THEME_3"]
}`

  let briefData: {
    market_summary: string
    portfolio_notes: string
    flight_plan: string[]
    market_context: { leadership: string; rates: string; risk_posture: string }
    watchpoints: string[]
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : ""
    if (!text) throw new Error("Empty response from Claude")
    briefData = JSON.parse(text)
  } catch (err) {
    await admin.from("agent_runs").insert({
      user_id: user.id,
      agent: "morning_brief",
      status: "failed",
      input: { context },
      error: String(err),
      duration_ms: Date.now() - runStart,
      finished_at: new Date().toISOString(),
    })
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }

  // Upsert brief for today
  const { data: brief, error: upsertErr } = await admin
    .from("morning_briefs")
    .upsert({
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
      market_summary: briefData.market_summary,
      portfolio_notes: briefData.portfolio_notes,
      flight_plan: briefData.flight_plan,
      market_context: briefData.market_context,
      watchpoints: briefData.watchpoints,
      generated_at: new Date().toISOString(),
    }, { onConflict: "user_id,date" })
    .select()
    .single()

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  await admin.from("agent_runs").insert({
    user_id: user.id,
    agent: "morning_brief",
    status: "success",
    input: { context },
    output: briefData,
    duration_ms: Date.now() - runStart,
    finished_at: new Date().toISOString(),
  })

  return NextResponse.json({ brief })
}
