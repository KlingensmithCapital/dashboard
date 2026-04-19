"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function SyncPricesButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const router = useRouter()

  async function sync() {
    setState("loading")
    try {
      const res = await fetch("/api/prices/sync", { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      setState("done")
      router.refresh()
      setTimeout(() => setState("idle"), 4000)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 3000)
    }
  }

  return (
    <button
      onClick={sync}
      disabled={state === "loading"}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] transition ${
        state === "done"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : state === "error"
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : state === "loading"
          ? "border-slate-200 text-slate-400 cursor-not-allowed"
          : "border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-700"
      }`}
    >
      {state === "loading" ? (
        <span className="h-2 w-2 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      ) : (
        <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" strokeLinecap="round"/>
          <path d="M13.5 2.5v3h-3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {state === "loading" ? "Syncing…" : state === "done" ? "Updated" : state === "error" ? "Failed" : "Sync Prices"}
    </button>
  )
}
