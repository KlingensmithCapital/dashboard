import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?schwab=error`)
  }

  // Get authenticated user
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Exchange code for tokens
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
    console.error("Schwab token exchange failed:", await tokenRes.text())
    return NextResponse.redirect(`${origin}/?schwab=error`)
  }

  const tokens = await tokenRes.json()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  // Store tokens using admin client (bypasses RLS for server write)
  const admin = createAdminClient()
  await admin.from("schwab_tokens").upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    scope: tokens.scope,
  }, { onConflict: "user_id" })

  // Immediately sync holdings
  await fetch(`${origin}/api/schwab/sync`, {
    method: "POST",
    headers: { Cookie: request.headers.get("cookie") ?? "" },
  })

  return NextResponse.redirect(`${origin}/?schwab=connected`)
}
