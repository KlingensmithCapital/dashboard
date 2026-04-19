"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function SyncSchwabButton() {
  const [label, setLabel] = useState("Sync Schwab")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function sync() {
    setLoading(true)
    setLabel("Syncing…")
    try {
      const res = await fetch("/api/schwab/sync", { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        setLabel(`Error: ${json.error ?? "failed"}`)
      } else {
        setLabel(`Synced ${json.synced ?? 0} positions`)
        router.refresh()
      }
    } catch {
      setLabel("Network error")
    } finally {
      setLoading(false)
      setTimeout(() => setLabel("Sync Schwab"), 5000)
    }
  }

  return (
    <button
      onClick={sync}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500 transition hover:border-sky-200 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading && <span className="h-2 w-2 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />}
      {label}
    </button>
  )
}
