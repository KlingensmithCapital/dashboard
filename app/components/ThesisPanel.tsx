"use client"

import { useState, useTransition, useRef } from "react"
import { createThesis, updateThesis, archiveThesis } from "@/app/actions/portfolio"

type ThesisData = {
  id: string
  ticker: string | null
  title: string
  body: string
  kill_criteria: string | null
  conviction: number
}

function ConvictionSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const color = value >= 8 ? "accent-emerald-600" : value >= 6 ? "accent-sky-600" : "accent-amber-500"
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        name="conviction"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`flex-1 h-1.5 ${color}`}
      />
      <span className={`w-8 text-right text-sm font-bold tabular-nums ${value >= 8 ? "text-emerald-700" : value >= 6 ? "text-sky-700" : "text-amber-600"}`}>
        {value}/10
      </span>
    </div>
  )
}

function ThesisFormInner({
  thesis,
  onClose,
}: {
  thesis?: ThesisData
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [conviction, setConviction] = useState(thesis?.conviction ?? 7)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        if (thesis) {
          await updateThesis(thesis.id, formData)
        } else {
          await createThesis(formData)
        }
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save")
      }
    })
  }

  function handleArchive() {
    if (!thesis) return
    setError(null)
    startTransition(async () => {
      try {
        await archiveThesis(thesis.id)
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to archive")
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Thesis Memory</p>
            <h2 className="text-base font-semibold text-slate-900">{thesis ? "Edit thesis" : "New thesis"}</h2>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition text-lg leading-none">
            ×
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">Ticker</label>
              <input
                name="ticker"
                defaultValue={thesis?.ticker ?? ""}
                placeholder="NVDA"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono uppercase placeholder:normal-case placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">Conviction</label>
              <ConvictionSlider value={conviction} onChange={setConviction} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">Thesis title</label>
            <input
              name="title"
              required
              defaultValue={thesis?.title ?? ""}
              placeholder="Structural winner in secular growth market"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">Why we own it</label>
            <textarea
              name="body"
              required
              defaultValue={thesis?.body ?? ""}
              rows={3}
              placeholder="The structural case for ownership…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.18em] text-rose-400 mb-1">Kill criteria — must remain true</label>
            <textarea
              name="kill_criteria"
              defaultValue={thesis?.kill_criteria ?? ""}
              rows={2}
              placeholder="Exit if market share trajectory breaks or management credibility is lost…"
              className="w-full rounded-lg border border-rose-100 bg-rose-50/40 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-100"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 ring-1 ring-rose-100">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {isPending ? "Saving…" : thesis ? "Update thesis" : "Save thesis"}
            </button>
            {thesis && (
              <button
                type="button"
                onClick={handleArchive}
                disabled={isPending}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-500 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-50"
              >
                Archive
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export function AddThesisButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-500 transition hover:border-sky-200 hover:text-sky-700"
      >
        + Add thesis
      </button>
      {open && <ThesisFormInner onClose={() => setOpen(false)} />}
    </>
  )
}

export function EditThesisButton({ thesis }: { thesis: ThesisData }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] font-medium text-slate-400 transition hover:text-slate-700"
      >
        Edit
      </button>
      {open && <ThesisFormInner thesis={thesis} onClose={() => setOpen(false)} />}
    </>
  )
}
