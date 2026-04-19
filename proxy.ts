import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PATHS = ["/login", "/auth/schwab/callback"]
const ONBOARDING_PATH = "/onboarding"
const SCHWAB_COOKIE = "schwab_connected"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isOnboarding = pathname.startsWith(ONBOARDING_PATH)
  const isApiRoute = pathname.startsWith("/api/")

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in → login page
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Already logged in → skip login page
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // Check Schwab connection via lightweight cookie (no DB call)
  const hasSchwabCookie = request.cookies.get(SCHWAB_COOKIE)?.value === "1"

  // Logged in but no Schwab connection → onboarding
  if (user && !isPublic && !isOnboarding && !isApiRoute && !hasSchwabCookie) {
    const url = request.nextUrl.clone()
    url.pathname = ONBOARDING_PATH
    return NextResponse.redirect(url)
  }

  // Has Schwab cookie → skip onboarding
  if (user && isOnboarding && hasSchwabCookie) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
