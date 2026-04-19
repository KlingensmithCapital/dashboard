import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.SCHWAB_CALLBACK_URL!).origin + "/login")
  }

  const params = new URLSearchParams({
    client_id: process.env.SCHWAB_APP_KEY!,
    redirect_uri: process.env.SCHWAB_CALLBACK_URL!,
    response_type: "code",
    state: user.id,
  })

  const authUrl = `https://api.schwabapi.com/v1/oauth/authorize?${params}`
  return NextResponse.redirect(authUrl)
}
