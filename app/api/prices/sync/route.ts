import { NextResponse } from "next/server"
import YahooFinance from "yahoo-finance2"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { cookies } from "next/headers"

const yf = new YahooFinance()
type YFQuote = { regularMarketPrice?: number }

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: holdings } = await admin
    .from("holdings")
    .select("id, ticker, shares, cost_basis")
    .eq("user_id", user.id)
    .eq("is_active", true)

  if (!holdings?.length) return NextResponse.json({ updated: 0, message: "No holdings found" })

  const tickers = [...new Set(holdings.map((h) => h.ticker))]

  const results = await Promise.allSettled(
    tickers.map((t) => yf.quote(t) as Promise<YFQuote>)
  )

  const priceMap: Record<string, number> = {}
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value?.regularMarketPrice) {
      priceMap[tickers[i]] = r.value.regularMarketPrice
    }
  })

  if (!Object.keys(priceMap).length) {
    return NextResponse.json({ updated: 0, message: "No prices returned from Yahoo Finance" })
  }

  // Update each holding individually by id (no unique constraint needed)
  const updates = await Promise.all(
    holdings
      .filter((h) => priceMap[h.ticker] != null)
      .map(async (h) => {
        const currentPrice = priceMap[h.ticker]
        const shares = Number(h.shares ?? 0)
        const costBasis = Number(h.cost_basis ?? 0)
        const marketValue = Number((currentPrice * shares).toFixed(2))
        const pnlPct = costBasis > 0
          ? Number((((currentPrice - costBasis) / costBasis) * 100).toFixed(4))
          : 0

        const { error } = await admin.from("holdings").update({
          current_price: currentPrice,
          market_value: marketValue,
          pnl_pct: pnlPct,
          last_synced: new Date().toISOString(),
        }).eq("id", h.id)

        return { ticker: h.ticker, price: currentPrice, error: error?.message }
      })
  )

  // Recalculate weights
  const { data: allHoldings } = await admin
    .from("holdings")
    .select("id, market_value")
    .eq("user_id", user.id)
    .eq("is_active", true)

  if (allHoldings?.length) {
    const total = allHoldings.reduce((s, h) => s + Number(h.market_value ?? 0), 0)
    if (total > 0) {
      await Promise.all(
        allHoldings.map((h) =>
          admin.from("holdings").update({
            weight_pct: Number(((Number(h.market_value ?? 0) / total) * 100).toFixed(2)),
          }).eq("id", h.id)
        )
      )
    }
  }

  return NextResponse.json({ updated: updates.length, prices: priceMap })
}
