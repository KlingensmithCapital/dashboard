import { NextResponse } from "next/server"

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.SCHWAB_APP_KEY!,
    redirect_uri: process.env.SCHWAB_CALLBACK_URL!,
    response_type: "code",
    scope: "readonly",
  })

  const authUrl = `https://api.schwabapi.com/v1/oauth/authorize?${params}`
  return NextResponse.redirect(authUrl)
}
