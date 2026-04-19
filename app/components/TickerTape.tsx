"use client"

import { useEffect, useState } from "react"

type Quote = {
  symbol: string
  label: string
  value: string
  change: string
  tone: "up" | "dn"
}

const FALLBACK: Quote[] = [
  { symbol: "^GSPC", label: "SPX", value: "—", change: "—", tone: "up" },
  { symbol: "^IXIC", label: "NDX", value: "—", change: "—", tone: "up" },
  { symbol: "^VIX", label: "VIX", value: "—", change: "—", tone: "up" },
  { symbol: "^TNX", label: "UST 10Y", value: "—", change: "—", tone: "up" },
]

export function TickerTape() {
  const [quotes, setQuotes] = useState<Quote[]>(FALLBACK)

  useEffect(() => {
    fetch("/api/prices/quote")
      .then((r) => r.json())
      .then(({ quotes: q }) => { if (q?.length) setQuotes(q) })
      .catch(() => {})
  }, [])

  const items = [...quotes, ...quotes]

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1600px] overflow-hidden px-4 py-2 sm:px-6">
        <div className="ticker-tape flex min-w-max items-center gap-8">
          {items.map((item, index) => (
            <div
              key={`${item.symbol}-${index}`}
              className="flex min-w-max items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-slate-400"
            >
              <span className="font-semibold text-slate-700">{item.label}</span>
              <span className="text-slate-500">{item.value}</span>
              <span className={item.tone === "up" ? "text-emerald-600" : "text-rose-500"}>
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
