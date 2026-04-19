import { createAdminClient } from "@/utils/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const origin = process.env.SCHWAB_CALLBACK_URL!.replace("/auth/schwab/callback", "")

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const userId = searchParams.get("state")

  if (error || !code || !userId) {
    return NextResponse.redirect(`${origin}/onboarding?error=cancelled`)
  }

  try {
    const credentials = Buffer.from(
      `${process.env.SCHWAB_APP_KEY}:${process.env.SCHWAB_APP_SECRET}`
    ).toString("base64")

    const tokenRes = await fetch("https://api.schwabapi.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.SCHWAB_CALLBACK_URL!,
      }),
    })

    if (!tokenRes.ok) {
      console.error("Schwab token exchange failed:", tokenRes.status, await tokenRes.text())
      return NextResponse.redirect(`${origin}/onboarding?error=token_exchange`)
    }

    const tokens = await tokenRes.json()
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const admin = createAdminClient()
    const { error: upsertErr } = await admin.from("schwab_tokens").upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      scope: tokens.scope ?? null,
    }, { onConflict: "user_id" })

    if (upsertErr) {
      console.error("Failed to store Schwab tokens:", upsertErr)
      return NextResponse.redirect(`${origin}/onboarding?error=storage`)
    }

    // Set lightweight cookie so proxy can gate without a DB call
    const response = NextResponse.redirect(`${origin}/`)
    response.cookies.set("schwab_connected", "1", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
    return response

  } catch (err) {
    console.error("Schwab callback error:", err)
    return NextResponse.redirect(`${origin}/onboarding?error=unknown`)
  }
}
