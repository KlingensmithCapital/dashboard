import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

async function getValidAccessToken(userId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data: tokenRow, error } = await admin
    .from("schwab_tokens")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error || !tokenRow) throw new Error("No Schwab token found")

  if (new Date(tokenRow.expires_at) < new Date(Date.now() + 5 * 60 * 1000)) {
    const credentials = Buffer.from(
      `${process.env.SCHWAB_APP_KEY}:${process.env.SCHWAB_APP_SECRET}`
    ).toString("base64")

    const res = await fetch("https://api.schwabapi.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokenRow.refresh_token,
      }),
    })

    if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)

    const fresh = await res.json()
    const expiresAt = new Date(Date.now() + fresh.expires_in * 1000).toISOString()

    await admin.from("schwab_tokens").update({
      access_token: fresh.access_token,
      refresh_token: fresh.refresh_token ?? tokenRow.refresh_token,
      expires_at: expiresAt,
    }).eq("user_id", userId)

    return fresh.access_token as string
  }

  return tokenRow.access_token as string
}

function mapAccountType(schwabType: string): string {
  const t = (schwabType ?? "").toUpperCase()
  if (t.includes("IRA")) return "roth_ira"
  if (t.includes("ROTH")) return "roth_ira"
  if (t.includes("TRADITIONAL")) return "traditional_ira"
  if (t.includes("HSA")) return "hsa"
  if (t.includes("CASH")) return "cash"
  return "taxable"
}

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()

  try {
    const accessToken = await getValidAccessToken(user.id, admin)

    const accountsRes = await fetch(
      "https://api.schwabapi.com/trader/v1/accounts?fields=positions",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!accountsRes.ok) {
      const body = await accountsRes.text()
      throw new Error(`Schwab accounts fetch failed ${accountsRes.status}: ${body}`)
    }

    const accounts = await accountsRes.json()

    if (!Array.isArray(accounts)) {
      throw new Error(`Unexpected Schwab response: ${JSON.stringify(accounts).slice(0, 200)}`)
    }

    let totalSynced = 0

    for (const entry of accounts) {
      const acct = entry.securitiesAccount
      if (!acct) continue

      const accountType = mapAccountType(acct.type ?? "")
      const accountName = acct.type?.includes("IRA") ? "Roth IRA" : "Taxable"

      // Find or create account by user_id + type
      let accountId: string | null = null
      const { data: existing } = await admin
        .from("accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", accountType)
        .maybeSingle()

      if (existing) {
        accountId = existing.id
      } else {
        const { data: created } = await admin
          .from("accounts")
          .insert({ user_id: user.id, name: accountName, institution: "Schwab", type: accountType })
          .select("id")
          .single()
        accountId = created?.id ?? null
      }

      if (!accountId) continue

      // Mark all existing holdings for this account inactive
      await admin.from("holdings")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("account_id", accountId)

      const positions = acct.positions ?? []
      const totalValue = Number(acct.currentBalances?.liquidationValue ?? 0)

      for (const pos of positions) {
        const instrument = pos.instrument
        if (!instrument?.symbol) continue
        if (!["EQUITY", "ETF"].includes(instrument.assetType)) continue

        const shares = Number(pos.longQuantity ?? 0)
        const costBasis = Number(pos.averagePrice ?? 0)
        const marketValue = Number(pos.marketValue ?? 0)
        const currentPrice = shares > 0 ? marketValue / shares : costBasis
        const weightPct = totalValue > 0 ? Number(((marketValue / totalValue) * 100).toFixed(2)) : 0
        const pnlPct = costBasis > 0
          ? Number((((currentPrice - costBasis) / costBasis) * 100).toFixed(4))
          : 0

        // Find existing holding for this account+ticker, update it; otherwise insert
        const { data: existingHolding } = await admin
          .from("holdings")
          .select("id")
          .eq("user_id", user.id)
          .eq("account_id", accountId)
          .eq("ticker", instrument.symbol)
          .maybeSingle()

        if (existingHolding) {
          await admin.from("holdings").update({
            name: instrument.description ?? null,
            shares,
            cost_basis: costBasis,
            current_price: currentPrice,
            market_value: marketValue,
            weight_pct: weightPct,
            pnl_pct: pnlPct,
            is_active: true,
            last_synced: new Date().toISOString(),
          }).eq("id", existingHolding.id)
        } else {
          await admin.from("holdings").insert({
            user_id: user.id,
            account_id: accountId,
            ticker: instrument.symbol,
            name: instrument.description ?? null,
            shares,
            cost_basis: costBasis,
            current_price: currentPrice,
            market_value: marketValue,
            weight_pct: weightPct,
            pnl_pct: pnlPct,
            status: "green",
            is_active: true,
            last_synced: new Date().toISOString(),
          })
        }

        totalSynced++
      }

      // Update balance snapshot
      await admin.from("balances").upsert({
        user_id: user.id,
        account_id: accountId,
        date: new Date().toISOString().split("T")[0],
        value: totalValue,
        cash_available: Number(acct.currentBalances?.cashBalance ?? 0),
      }, { onConflict: "user_id,account_id,date" })
    }

    return NextResponse.json({ ok: true, synced: totalSynced })

  } catch (err) {
    console.error("Schwab sync error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
