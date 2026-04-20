"use client"

import { useState, useTransition } from "react"
import { addCashAccount } from "@/app/actions/portfolio"

export function AddCashAccountModal() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await addCashAccount(formData)
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save account")
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-500 transition hover:border-sky-200 hover:text-sky-700"
      >
        + Add account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Cash & Savings</p>
                <h2 className="text-base font-semibold text-slate-900">Add account</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">Account name</label>
                <input
                  name="name"
                  required
                  placeholder="HYSA · Ally"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">Institution</label>
                <input
                  name="institution"
                  placeholder="Ally, Marcus, SoFi, Fidelity…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">Account type</label>
                <select
                  name="type"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="savings">High-yield savings (HYSA)</option>
                  <option value="money_market">Money market</option>
                  <option value="checking">Checking</option>
                  <option value="cash">Cash / other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">Current balance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input
                    name="balance"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="25000"
                    className="w-full rounded-lg border border-slate-200 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">Update manually whenever the balance changes.</p>
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 ring-1 ring-rose-100">{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Add account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
