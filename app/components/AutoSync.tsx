"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function AutoSync() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const justConnected = searchParams.get("schwab") === "connected"

    async function sync() {
      // If just connected Schwab, pull positions first
      if (justConnected) {
        await fetch("/api/schwab/sync", { method: "POST" }).catch(() => {})
      }

      // Always sync Yahoo Finance prices
      await fetch("/api/prices/sync", { method: "POST" }).catch(() => {})

      router.replace("/") // strip query params, refresh data
    }

    sync()
  }, [router, searchParams])

  return null
}
