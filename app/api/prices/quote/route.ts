import { NextRequest, NextResponse } from "next/server"
import YahooFinance from "yahoo-finance2"

const yf = new YahooFinance()

type YFQuote = { regularMarketPrice?: number; regularMarketChangePercent?: number }

const INDICES = ["^GSPC", "^IXIC", "^VIX", "^TNX"]
const LABELS: Record<string, string> = {
  "^GSPC": "SPX",
  "^IXIC": "NDX",
  "^VIX": "VIX",
  "^TNX": "UST 10Y",
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const symbols = searchParams.get("symbols")?.split(",") ?? INDICES

  const results = await Promise.allSettled(
    symbols.map((s) => yf.quote(s) as Promise<YFQuote>)
  )

  const quotes = results
    .map((r, i) => {
      if (r.status !== "fulfilled") return null
      const q = r.value as YFQuote
      const symbol = symbols[i]
      const price = q.regularMarketPrice ?? 0
      const change = q.regularMarketChangePercent ?? 0
      const isRate = symbol === "^TNX"

      return {
        symbol,
        label: LABELS[symbol] ?? symbol,
        value: isRate
          ? `${price.toFixed(2)}%`
          : price >= 1000
          ? price.toLocaleString("en-US", { maximumFractionDigits: 0 })
          : price.toFixed(2),
        change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
        tone: symbol === "^VIX"
          ? (change <= 0 ? "up" : "dn")
          : (change >= 0 ? "up" : "dn"),
      }
    })
    .filter(Boolean)

  return NextResponse.json({ quotes }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  })
}
