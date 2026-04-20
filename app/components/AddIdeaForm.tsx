"use client"

import { useState, useTransition } from "react"
import { createIdea, updateIdeaStatus } from "@/app/actions/portfolio"

export function AddIdeaForm() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [score, setScore] = useState(65)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createIdea(formData)
        setOpen(false)
        setScore(65)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add idea")
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-xl border border-dashed border-slate-200 py-2.5 text-[11px] font-medium text-slate-400 transition hover:border-sky-200 hover:text-sky-600"
      >
        + Add idea
      </button>
    )
  }

  const scoreColor = score >= 75 ? "accent-emerald-600" : score >= 60 ? "accent-sky-600" : "accent-amber-500"
  const scoreText = score >= 75 ? "text-emerald-700" : score >= 60 ? "text-sky-700" : "text-amber-600"

  return (
    <form
      action={handleSubmit}
      className="mt-3 rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">New idea</p>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="text-slate-300 hover:text-slate-500 transition text-lg leading-none"
        >
          ×
        </button>
      </div>

      <input
        name="name"
        required
        placeholder="Idea name or thesis title"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          name="ticker"
          placeholder="Ticker (optional)"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono uppercase placeholder:normal-case placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
          <input
            type="range"
            name="score"
            min={0}
            max={100}
            value={score}
            onChange={e => setScore(Number(e.target.value))}
            className={`flex-1 h-1.5 ${scoreColor}`}
          />
          <span className={`text-sm font-bold tabular-nums w-7 text-right ${scoreText}`}>{score}</span>
        </div>
      </div>

      <textarea
        name="note"
        rows={2}
        placeholder="Thesis in one sentence…"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-200"
      />

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 ring-1 ring-rose-100">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-xl bg-slate-900 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add idea"}
        </button>
      </div>
    </form>
  )
}

export function IdeaActionButtons({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition()

  function handle(newStatus: string) {
    startTransition(() => updateIdeaStatus(id, newStatus))
  }

  return (
    <div className="mt-1.5 flex gap-1">
      {status !== "promote" && (
        <button
          onClick={() => handle("promote")}
          disabled={isPending}
          className="rounded-full border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
        >
          Promote
        </button>
      )}
      {status === "promote" && (
        <button
          onClick={() => handle("watch")}
          disabled={isPending}
          className="rounded-full border border-sky-200 px-2 py-0.5 text-[10px] font-medium text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
        >
          Watch
        </button>
      )}
      <button
        onClick={() => handle("archive")}
        disabled={isPending}
        className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-400 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-50"
      >
        Archive
      </button>
    </div>
  )
}
