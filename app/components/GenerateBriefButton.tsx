"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function GenerateBriefButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const router = useRouter()

  async function generate() {
    setState("loading")
    try {
      const res = await fetch("/api/brief/generate", { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      setState("done")
      router.refresh()
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 3000)
    }
  }

  const labels = {
    idle: "Generate Brief",
    loading: "Generating…",
    done: "Done",
    error: "Failed — retry",
  }

  return (
    <button
      onClick={generate}
      disabled={state === "loading"}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        state === "done"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : state === "error"
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : state === "loading"
          ? "border-slate-200 text-slate-400 cursor-not-allowed"
          : "border-slate-200 text-slate-500 hover:border-sky-200 hover:text-sky-700"
      }`}
    >
      {state === "loading" && (
        <span className="mr-1.5 inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      )}
      {labels[state]}
    </button>
  )
}
