# Engy Manager: Project Budget Tracker

A web app for consulting-project budgets. Work Package → Task → 7 resource roles, tracking three
separate views of the money: **sold** (customer commitment), **estimated** (internal plan) and
**actual** (time used). Half the screen is the table, half is live analytics.

## What it does

- **Table (left):** WP rows, task rows and one row for each of the seven roles, with WBS ids `1`, `1.1`, `1.1.1`.
  Yellow cells are inputs: sold days, estimated hours, actual hours, task details, % done, due date.
  Type (Task / Milestone) and Status (Not started, Started, In progress, On hold, Completed) are dropdowns.
- **Analytics (right):** total sold budget, internal estimate, actual fees, remaining sold/estimated
  budgets, three charts and at-risk / over-budget flags. Click a WP or task WBS number to focus the
  analytics on it. There is a "Show as table" view of the same numbers.
- **Rates / Settings:** hours per day (default 8) and the seven bill rates. Rates are not shown in
  the table, only used by the formulas.
- **Several projects:** switch between projects in the header, add one with **+ New project**, and rename, clear or delete the current one in Rates / Settings. Each project has its own rates and hours per day.
- **Export / Import:** Excel (`.xlsx`) and JSON backup of the current project. Import accepts files exported by this app and adds them as a new project, so nothing is overwritten.
- **Login:** one email + password.

### Formulas

| Figure | Formula |
|---|---|
| Sold Hours | Sold Days × hours per day |
| Sold Budget | Sold Hours × role rate |
| Estimated Budget | Estimated Hours × role rate |
| Actual Fees | Actual Hours × role rate |
| Remaining Sold Budget | Sold Budget − Actual Fees |
| Remaining Estimated Budget | Estimated Budget − Actual Fees |

Task, WP and project totals are sums of the role rows. Status: **at risk** from 80% of sold budget
consumed, **over budget** above 100%.

Check: the WP 1 example (16.25 sold days = 130 h = EUR 29,505.00) is a unit test.

## Where the data lives

Project data is stored **in the browser** (`localStorage`) of whoever is using it. It is not on a
server, so it does not sync between devices or browsers. Use **Backup (JSON)** or **Export Excel**
regularly. Clearing site data erases it.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the three values (see below)
npm run dev                  # http://localhost:3000
npm test                     # unit tests
```

## Login setup

Set three environment variables (in `.env.local` locally, and in Vercel → Project Settings →
Environment Variables for production). See `.env.example` for commands to generate them.

| Variable | Meaning |
|---|---|
| `AUTH_EMAIL` | the one email allowed to sign in |
| `AUTH_PASSWORD_HASH` | scrypt hash of the password (never the password itself) |
| `SESSION_SECRET` | random string that signs the login cookie |

If any are missing, nobody can sign in. The app fails closed.

The login protects access to the app's pages. It does not encrypt the data stored in the browser.

## Deploy on Vercel

1. In Vercel, **Add New → Project**, import this GitHub repo (framework preset: Next.js).
2. Name the project `engymanage` to get `engymanage.vercel.app` (if the name is free).
3. Add the three environment variables above, then deploy.
