import { NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

type YFQuote = { regularMarketPrice?: number }
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: holdings } = await supabase
    .from("holdings")
    .select("id, ticker, shares, cost_basis")
    .eq("is_active", true)

  if (!holdings?.length) return NextResponse.json({ updated: 0 })

  const tickers = [...new Set(holdings.map((h) => h.ticker))]

  // Fetch all quotes in parallel
  const quotes = await Promise.allSettled(
    tickers.map((t) => yahooFinance.quote(t) as Promise<YFQuote>)
  )

  const priceMap: Record<string, number> = {}
  quotes.forEach((result, i) => {
    if (result.status === "fulfilled" && (result.value as YFQuote).regularMarketPrice) {
      priceMap[tickers[i]] = (result.value as YFQuote).regularMarketPrice!
    }
  })

  // Build upsert rows
  const updates = holdings
    .filter((h) => priceMap[h.ticker] != null)
    .map((h) => {
      const currentPrice = priceMap[h.ticker]
      const shares = Number(h.shares ?? 0)
      const costBasis = Number(h.cost_basis ?? 0)
      const marketValue = currentPrice * shares
      const pnlPct = costBasis > 0
        ? Number((((currentPrice - costBasis) / costBasis) * 100).toFixed(4))
        : 0

      return {
        id: h.id,
        current_price: currentPrice,
        market_value: Number(marketValue.toFixed(2)),
        pnl_pct: pnlPct,
        last_synced: new Date().toISOString(),
      }
    })

  if (updates.length) {
    await admin.from("holdings").upsert(updates)
  }

  // Recalculate weight_pct based on updated market values
  const { data: allHoldings } = await admin
    .from("holdings")
    .select("id, market_value")
    .eq("user_id", user.id)
    .eq("is_active", true)

  if (allHoldings) {
    const totalValue = allHoldings.reduce((sum, h) => sum + Number(h.market_value ?? 0), 0)
    if (totalValue > 0) {
      const weightUpdates = allHoldings.map((h) => ({
        id: h.id,
        weight_pct: Number(((Number(h.market_value ?? 0) / totalValue) * 100).toFixed(2)),
      }))
      await admin.from("holdings").upsert(weightUpdates)
    }
  }

  return NextResponse.json({ updated: updates.length, prices: priceMap })
}
