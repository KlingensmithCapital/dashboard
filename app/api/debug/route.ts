import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll().map((c) => c.name)

  const supabase = createClient(cookieStore)
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  let tokenRow = null
  let tokenError = null
  if (user) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("schwab_tokens")
      .select("id, expires_at, created_at")
      .eq("user_id", user.id)
      .maybeSingle()
    tokenRow = data
    tokenError = error?.message ?? null
  }

  return NextResponse.json({
    cookies: allCookies,
    schwabConnectedCookie: request.cookies.get("schwab_connected")?.value ?? "not set",
    user: user ? { id: user.id, email: user.email } : null,
    userError: userError?.message ?? null,
    schwabToken: tokenRow,
    tokenError,
  })
}
