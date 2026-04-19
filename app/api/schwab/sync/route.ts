import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

async function getValidAccessToken(userId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data: tokenRow } = await admin
    .from("schwab_tokens")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!tokenRow) throw new Error("No Schwab token found")

  // Refresh if expired within 5 minutes
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

    if (!res.ok) throw new Error("Token refresh failed")

    const fresh = await res.json()
    const expiresAt = new Date(Date.now() + fresh.expires_in * 1000).toISOString()

    await admin.from("schwab_tokens").update({
      access_token: fresh.access_token,
      refresh_token: fresh.refresh_token ?? tokenRow.refresh_token,
      expires_at: expiresAt,
    }).eq("user_id", userId)

    return fresh.access_token
  }

  return tokenRow.access_token
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()

  try {
    const accessToken = await getValidAccessToken(user.id, admin)

    // Fetch all accounts with positions
    const accountsRes = await fetch(
      "https://api.schwabapi.com/trader/v1/accounts?fields=positions",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!accountsRes.ok) throw new Error("Failed to fetch Schwab accounts")

    const accounts = await accountsRes.json()

    for (const entry of accounts) {
      const acct = entry.securitiesAccount
      const accountType = acct.type === "IRA" ? "roth_ira" : "taxable"

      // Upsert account
      const { data: accountRow } = await admin
        .from("accounts")
        .upsert({
          user_id: user.id,
          name: acct.type === "IRA" ? "Roth IRA" : "Taxable",
          institution: "Schwab",
          type: accountType,
        }, { onConflict: "user_id, type" })
        .select("id")
        .single()

      if (!accountRow) continue

      // Mark existing holdings inactive
      await admin.from("holdings")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("account_id", accountRow.id)

      // Upsert positions
      const positions = acct.positions ?? []
      const totalValue = acct.currentBalances?.liquidationValue ?? 0

      for (const pos of positions) {
        const instrument = pos.instrument
        if (instrument.assetType !== "EQUITY" && instrument.assetType !== "ETF") continue

        const marketValue = pos.marketValue ?? 0
        const weightPct = totalValue > 0 ? (marketValue / totalValue) * 100 : 0
        const pnlPct = pos.averagePrice > 0
          ? ((pos.currentDayProfitLossPercentage ?? 0))
          : 0

        await admin.from("holdings").upsert({
          user_id: user.id,
          account_id: accountRow.id,
          ticker: instrument.symbol,
          name: instrument.description,
          shares: pos.longQuantity,
          cost_basis: pos.averagePrice,
          current_price: pos.currentDayProfitLossPercentage != null ? pos.marketValue / pos.longQuantity : null,
          market_value: marketValue,
          weight_pct: Math.round(weightPct * 10) / 10,
          pnl_pct: Math.round(pnlPct * 10) / 10,
          status: "green",
          is_active: true,
          last_synced: new Date().toISOString(),
        }, { onConflict: "user_id, account_id, ticker" })
      }

      // Update balance snapshot
      await admin.from("balances").upsert({
        user_id: user.id,
        account_id: accountRow.id,
        date: new Date().toISOString().split("T")[0],
        value: totalValue,
        cash_available: acct.currentBalances?.cashBalance ?? 0,
      }, { onConflict: "user_id, account_id, date" })
    }

    return NextResponse.json({ ok: true, synced: accounts.length })
  } catch (err) {
    console.error("Schwab sync error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
