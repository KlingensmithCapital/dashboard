export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Klingensmith Capital</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Connect your brokerage</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your cockpit needs access to your Schwab account to show live holdings, balances, and position data.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-4">
            {[
              { label: "Read-only access", note: "View positions, balances, and account data. No trading." },
              { label: "Secure OAuth", note: "You authenticate directly with Schwab — we never see your password." },
              { label: "Auto-sync on login", note: "Your holdings update automatically each time you sign in." },
            ].map((item) => (
              <div key={item.label} className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                  <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{item.note}</p>
                </div>
              </div>
            ))}
          </div>

          {searchParams.error && (
            <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
              Connection failed — please try again.
            </p>
          )}

          <a
            href="/api/schwab/connect"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Connect Schwab
          </a>

          <p className="mt-4 text-center text-xs text-slate-400">
            Accounts and Trading Production · Market Data Production
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Private access only · Klingensmith Capital
        </p>
      </div>
    </main>
  )
}
