"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function AutoSync() {
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    fetch("/api/prices/sync", { method: "POST" })
      .then((r) => { if (r.ok) router.refresh() })
      .catch(() => {})
  }, [router])

  return null
}
