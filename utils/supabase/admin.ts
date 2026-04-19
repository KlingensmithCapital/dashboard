import { createClient } from "@supabase/supabase-js"

// Server-only admin client — bypasses RLS for trusted server-side writes (e.g. Schwab sync)
// Never import this in client components or expose to the browser
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) throw new Error("Missing Supabase admin credentials")

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
