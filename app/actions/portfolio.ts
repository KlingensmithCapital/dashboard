"use server"

import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

// ─── Holdings ────────────────────────────────────────────────────────────────

export async function updateHoldingStatus(holdingId: string, status: string) {
  const user = await getAuthUser()
  const admin = createAdminClient()
  const { error } = await admin
    .from("holdings")
    .update({ status })
    .eq("id", holdingId)
    .eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/")
}

// ─── Theses ───────────────────────────────────────────────────────────────────

export async function createThesis(formData: FormData) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const ticker = (formData.get("ticker") as string)?.toUpperCase().trim() || null
  const title = (formData.get("title") as string)?.trim()
  const body = (formData.get("body") as string)?.trim()
  const kill_criteria = (formData.get("kill_criteria") as string)?.trim() || null
  const conviction = Math.min(10, Math.max(1, parseInt(formData.get("conviction") as string) || 7))

  if (!title || !body) throw new Error("Title and body are required")

  const { error } = await admin.from("theses").insert({
    user_id: user.id,
    ticker,
    title,
    body,
    kill_criteria,
    conviction,
    status: "active",
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
  revalidatePath("/")
}

export async function updateThesis(id: string, formData: FormData) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const ticker = (formData.get("ticker") as string)?.toUpperCase().trim() || null
  const title = (formData.get("title") as string)?.trim()
  const body = (formData.get("body") as string)?.trim()
  const kill_criteria = (formData.get("kill_criteria") as string)?.trim() || null
  const conviction = Math.min(10, Math.max(1, parseInt(formData.get("conviction") as string) || 7))

  if (!title || !body) throw new Error("Title and body are required")

  const { error } = await admin
    .from("theses")
    .update({ ticker, title, body, kill_criteria, conviction, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/")
}

export async function archiveThesis(id: string) {
  const user = await getAuthUser()
  const admin = createAdminClient()
  const { error } = await admin
    .from("theses")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/")
}

// ─── Ideas ────────────────────────────────────────────────────────────────────

export async function createIdea(formData: FormData) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const name = (formData.get("name") as string)?.trim()
  const ticker = (formData.get("ticker") as string)?.toUpperCase().trim() || null
  const note = (formData.get("note") as string)?.trim() || null
  const score = Math.min(100, Math.max(0, parseInt(formData.get("score") as string) || 60))

  if (!name) throw new Error("Name is required")

  const { error } = await admin.from("ideas").insert({
    user_id: user.id,
    name,
    ticker,
    note,
    score,
    status: "new",
    source: "pm",
  })
  if (error) throw new Error(error.message)
  revalidatePath("/")
}

export async function updateIdeaStatus(id: string, status: string) {
  const user = await getAuthUser()
  const admin = createAdminClient()
  const { error } = await admin
    .from("ideas")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/")
}

// ─── Cash accounts ────────────────────────────────────────────────────────────

export async function addCashAccount(formData: FormData) {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const name = (formData.get("name") as string)?.trim()
  const institution = (formData.get("institution") as string)?.trim() || null
  const type = (formData.get("type") as string) || "savings"
  const balance = parseFloat(formData.get("balance") as string)

  if (!name || isNaN(balance) || balance < 0) throw new Error("Invalid input")

  const { data: acct, error: acctErr } = await admin
    .from("accounts")
    .insert({ user_id: user.id, name, institution, type })
    .select("id")
    .single()

  if (acctErr || !acct) throw new Error(acctErr?.message ?? "Failed to create account")

  const { error: balErr } = await admin.from("balances").insert({
    user_id: user.id,
    account_id: acct.id,
    date: new Date().toISOString().split("T")[0],
    value: balance,
    cash_available: balance,
  })
  if (balErr) throw new Error(balErr.message)

  revalidatePath("/")
}

export async function updateCashAccountBalance(accountId: string, balance: number) {
  const user = await getAuthUser()
  if (isNaN(balance) || balance < 0) throw new Error("Invalid balance")
  const admin = createAdminClient()
  const { error } = await admin.from("balances").upsert(
    {
      user_id: user.id,
      account_id: accountId,
      date: new Date().toISOString().split("T")[0],
      value: balance,
      cash_available: balance,
    },
    { onConflict: "user_id,account_id,date" }
  )
  if (error) throw new Error(error.message)
  revalidatePath("/")
}
