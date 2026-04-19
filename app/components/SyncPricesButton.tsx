"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function SyncPricesButton() {
  const [label, setLabel] = useState("Sync Prices")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function sync() {
    setLoading(true)
    setLabel("Syncing…")
    try {
      const res = await fetch("/api/prices/sync", { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        setLabel(`Error: ${json.error ?? "failed"}`)
      } else {
        setLabel(`Updated ${json.updated ?? 0} positions`)
        if (json.updated > 0) router.refresh()
      }
    } catch (e) {
      setLabel("Network error")
    } finally {
      setLoading(false)
      setTimeout(() => setLabel("Sync Prices"), 5000)
    }
  }

  return (
    <button
      onClick={sync}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading && <span className="h-2 w-2 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />}
      {label}
    </button>
  )
}
