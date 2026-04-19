# PM Cockpit

This app is the active build target for the Klingensmith Capital Portfolio Manager Cockpit.

It is being rebuilt from scratch as a personal capital operating system with:

- a live balance-sheet view
- a morning brief
- portfolio monitoring
- thesis memory
- an idea engine
- embedded AI agent workflows

## Product Direction

The visual anchor for this build is:

- `../../artifacts/legacy/dashboard-v3/kc_dashboard_v3.html`

That prototype should guide information density, command-center feel, and PM workflow, while the actual app architecture moves forward in Next.js.

## Workspace Context

- `app/page.tsx`
  Current cockpit shell and landing experience
- `../../docs/product/homepage-blueprint.md`
  High-level page blueprint
- `../../docs/design/visual-direction.md`
  Visual design rules
- `../../docs/agents/agent-workflows.md`
  How agents should contribute to the product
- `../../reference-materials/current/`
  Current reference materials that may inform product logic

## Getting Started

Install dependencies and run the local dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build Rules

- Build the new product in this app, not in legacy folders.
- Use `dashboard-v3` as inspiration, not as technical architecture.
- Keep agent outputs native to the product experience whenever possible.
- Treat reference materials as inputs, not as the current source of truth.

## Near-Term Priorities

- establish the cockpit shell
- define real data entities and app structure
- wire auth and account scaffolding
- introduce agent-backed morning brief and memory flows
