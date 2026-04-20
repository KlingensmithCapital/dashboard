"use client"

import { useState, useTransition } from "react"
import { updateHoldingStatus } from "@/app/actions/portfolio"

type Status = "green" | "amber" | "red"

const CYCLE: Record<Status, Status> = { green: "amber", amber: "red", red: "green" }

const BADGE: Record<Status, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
}

const LABEL: Record<Status, string> = { green: "GREEN", amber: "AMBER", red: "RED" }

export function StatusToggle({ id, status }: { id: string; status: string }) {
  const normalized = (status?.toLowerCase() ?? "green") as Status
  const [current, setCurrent] = useState<Status>(normalized)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    const next = CYCLE[current] ?? "green"
    setCurrent(next)
    startTransition(() => updateHoldingStatus(id, next))
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title="Click to change status"
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ring-1 transition-all disabled:opacity-40 hover:ring-2 cursor-pointer ${BADGE[current]}`}
    >
      {LABEL[current]}
    </button>
  )
}
