# SoccerHub (Role-Based OOP Web App)

SoccerHub is a **frontend-only** web application built with HTML, CSS, and JavaScript using **object-oriented patterns** (classes for auth, persistence, and league logic). There is **no backend**: data lives in the browser’s `localStorage`, and the UI is organized into a **login page**, a **user dashboard** (read-only browsing), and an **admin dashboard** (full CRUD).

| Role | What you can do |
|------|------------------|
| **User** | Browse teams in a card grid, open a squad, open a player’s **statistics** in a modal (search teams/players). |
| **Admin** | Manage **teams**, **players**, and **per-player statistics**; **export/import** the whole league as JSON; use the **quick menu** for numbered shortcuts. |

**Admin password (demo):** `admin123` — set in [`scripts/core.js`](scripts/core.js) (`SoccerHubConfig.adminPassword`).

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Architecture (OOP)](#architecture-oop)
- [How to run](#how-to-run)
- [Step-by-step: what we built](#step-by-step-what-we-built)
- [Admin: quick menu and data files](#admin-quick-menu-and-data-files)
- [Automated tests](#automated-tests)
- [Access control](#access-control)
- [Verification checklist](#verification-checklist)
- [Manual test matrix](#manual-test-matrix)
- [Notes](#notes)

---

## Features

- **Login** with role selection; **admin password field** only when “Admin” is selected (clearer UX).
- **Session** stored under `soccerHubSessionRole`; dashboards **redirect** to login if the wrong role or no session.
- **User mode:** team cards, squad list, stats modal with goals, assists, matches, optional shots and yellow cards.
- **Admin mode:** CRUD for teams (name + logo URL), players (team, name, position, optional photo URL), and statistics with **validation** (e.g. goals cannot exceed matches played).
- **Seed data:** eight clubs with full squads and generated stats (see [Data model](#data-model)).
- **Cascade delete:** removing a team removes its players and their stats.
- **Export / import:** download or load `soccerhub-data.json` for real file read/write from the browser.
- **Quick menu (admin):** numbered, grouped tiles — **Go to section** (1–3), **Data on your computer** (4–5), **Session** (6).
- **Stats display (user):** Team cards stay **minimal** (logo + name). After you open a squad, a **club profile** (description, current league, leagues/honors won, creator) appears first, then **Club totals** with summed **G / A / Y** metric cards and bars (Betplay-inspired dark sports styling). Player rows use **G / A / Y pills**; the modal keeps the full stat list plus a normalized bar strip. **Admin** tables still use compact bar columns; scales are **relative** within that table for fair comparison.
- **Branding:** Page headers use the SoccerHub logo image at [`assets/soccerhub-logo.png`](assets/soccerhub-logo.png) (login, user, and admin).

---

## Tech stack

- **HTML5** — structure, forms, `hidden`, accessibility attributes where used.
- **CSS** — layout (grid/flex), [`styles/common.css`](styles/common.css), [`styles/login.css`](styles/login.css), [`styles/dashboard.css`](styles/dashboard.css).
- **JavaScript (ES6+)** — classes, `localStorage`, DOM APIs; no frameworks.
- **Node.js** (optional) — `npm test` for validator unit tests only.

---

## Project structure

```text
SoccerHub/
├── index.html                 # Login (role + conditional admin password)
├── assets/
│   └── soccerhub-logo.png     # Header brand mark (login, user, admin)
├── package.json               # npm test (validator unit tests)
├── README.md
├── tests/
│   └── validation.test.mjs    # Assertion tests for validators
├── html/
│   ├── admin.html             # Admin dashboard + quick menu + CRUD
│   ├── user.html              # User: teams → players → stats modal
│   └── login.html             # Redirects to ../index.html
├── styles/
│   ├── common.css
│   ├── login.css
│   └── dashboard.css          # Dashboard, modal, admin quick menu, tables
└── scripts/
    ├── core.js                # Config, seed data, AppDataRepository, LeagueService, AuthService
    ├── stats-viz.js           # CSS mini-bar charts (G / A / Y) for admin + user UI
    ├── validators.js          # Team / player / stats form validation
    ├── login.js
    ├── admin.js
    └── user.js
```

---

## Architecture (OOP)

Core logic lives in [`scripts/core.js`](scripts/core.js).

| Piece | Responsibility |
|--------|----------------|
| `SoccerHubConfig` | Keys: `soccerHubData`, legacy `soccerHubPlayers`, `soccerHubSessionRole`, `adminPassword` |
| `SoccerHubUtils` | `newId()` |
| `AppDataRepository` | Load/save JSON `{ version, teams, players, stats }`; migrate legacy `soccerHubPlayers` if needed |
| `LeagueService` | CRUD teams/players/stats; cascade delete; `getTeamStatTotals()`; `importAppData()` for JSON import |
| `AuthService` | Login, logout, `requireRole()` |
| `createTeamInputFromValues` | Team form validation ([`scripts/validators.js`](scripts/validators.js)) |
| `createPlayerInputFromValues` | Player form validation ([`scripts/validators.js`](scripts/validators.js)) |
| `createStatsInputFromValues` | Stats validation ([`scripts/validators.js`](scripts/validators.js)) |

### Data model

**Team**

```js
{
  id: string,
  name: string,
  logoUrl: string,
  description?: string,
  leaguesWon?: string[],
  creator?: string,
  currentLeague?: string
}
```

Admin can edit all fields; the **user squad** view shows a **club profile** block (description, current league, honors, creator) above club totals.

**Player**

```js
{ id: string, teamId: string, name: string, position: string, imageUrl?: string }
```

**Player stats**

```js
{
  playerId: string,
  goals: number,
  assists: number,
  matchesPlayed: number,
  shots?: number,
  yellowCards?: number
}
```

Default seed data uses **football-data.org** crests and mixed portrait URLs for **eight clubs** (Real Madrid, Barcelona, Manchester City, Liverpool, PSG, Bayern Munich, Arsenal, Atlético Madrid), each with a full squad; stats are generated in code for every player.

### localStorage keys

| Key | Content |
|-----|---------|
| `soccerHubData` | Full app JSON (`teams`, `players`, `stats`) |
| `soccerHubPlayers` | **Legacy only** — migrated once if `soccerHubData` is missing |
| `soccerHubSessionRole` | `"admin"` or `"user"` |

---

## Pages

### `index.html` — login

- Choose **User** or **Admin**; password field appears **only for Admin**.
- Successful login redirects once to [`html/user.html`](html/user.html) or [`html/admin.html`](html/admin.html).
- If a session already exists, redirects straight to the matching dashboard.

### `html/user.html` — user view

- **Teams** grid: logo + name only. **Squad** view: **Club totals** block (aggregated goals, assists, yellow cards) and Betplay-style visuals; optional search; player rows with **G / A / Y** pills; stats modal with normalized bars plus full numbers (read-only).

### `html/admin.html` — admin dashboard

- **Quick menu** at the top: grouped, numbered tiles (navigate, export/import JSON, logout).
- **Teams**, **Players**, and **Statistics** sections with forms and tables; **Teams** and **Players** tables include **Squad totals** and **Stats** columns with the same G / A / Y mini-bars as the user view.

### `html/login.html`

Redirects to [`../index.html`](index.html).

---

## How to run

1. Open [`index.html`](index.html) in a browser (double-click or “Open with Live Server”).
2. **User:** choose User → **Enter Dashboard** → browse teams and players.
3. **Admin:** choose Admin → enter password `admin123` → **Enter Dashboard** → use quick menu or scroll to Teams / Players / Statistics.

**Tip:** Remote images may be blocked or flaky with the `file://` protocol. Prefer a **local static server** (for example VS Code **Live Server**, or `npx serve` in the project folder) so HTTPS image URLs load reliably.

**Reloading the built-in seed:** if `soccerHubData` already exists in localStorage, the app keeps your data. To load fresh seed data from `getDefaultData()`, open DevTools → **Application** → **Local Storage** → delete `soccerHubData` (and optionally `soccerHubSessionRole`) → refresh.

---

## Step-by-step: what we built

This section summarizes the **implementation order** and intent of the project (useful for reports or demos).

1. **Core domain and persistence** — `AppDataRepository` loads/saves a single JSON blob; optional migration from a legacy flat players list.
2. **League and auth services** — `LeagueService` for CRUD and referential cleanup; `AuthService` for role session and page guards.
3. **Login UX** — Role select on [`index.html`](index.html); admin password row and help text toggled in [`scripts/login.js`](scripts/login.js); optional CSS so the hidden password row does not affect layout ([`styles/login.css`](styles/login.css)).
4. **User experience** — [`html/user.html`](html/user.html) + [`scripts/user.js`](scripts/user.js): team grid, squad view, search, stats modal.
5. **Admin CRUD** — [`html/admin.html`](html/admin.html) + [`scripts/admin.js`](scripts/admin.js): teams, players, statistics with shared validators.
6. **Richer seed data** — [`getDefaultData()`](scripts/core.js) expanded with more clubs and full squads (Liverpool, PSG, Bayern, Arsenal, Atlético, etc.) and one stats row per player.
7. **Validators and tests** — Validation helpers moved to [`scripts/validators.js`](scripts/validators.js); [`tests/validation.test.mjs`](tests/validation.test.mjs) + [`npm test`](package.json) for automated checks.
8. **File export/import** — Admin downloads `soccerhub-data.json` or picks a file to import; `LeagueService.importAppData()` validates shape and replaces data.
9. **Quick menu** — Admin **Quick menu** panel: numbered tiles grouped into **Go to section**, **Data on your computer**, and **Session** ([`html/admin.html`](html/admin.html), [`styles/dashboard.css`](styles/dashboard.css)).
10. **Stat visualization** — [`LeagueService.getTeamStatTotals()`](scripts/core.js) for squad sums; [`scripts/stats-viz.js`](scripts/stats-viz.js) (`teamSquadSummaryHtml`, `playerStatPillsHtml`, table/modal bars) + [`styles/dashboard.css`](styles/dashboard.css) with **Betplay-inspired** tokens (lime/gold/blue on dark). User: totals **only on squad screen**; admin: bar columns in tables.

---

## Admin: quick menu and data files

| # | Action | What it does |
|---|--------|----------------|
| 1–3 | **Teams / Players / Statistics** | Smooth-scroll to that section (`#section-teams`, etc.). |
| 4 | **Export JSON** | Serializes current league data and downloads **`soccerhub-data.json`**. |
| 5 | **Import JSON** | Reads a file you choose; if JSON is valid SoccerHub data, it **replaces** the current league and saves to `localStorage`. |
| 6 | **Logout** | Clears session and sends you to the login page (same as the header **Logout**). |

**Import warning:** importing **overwrites** the in-memory league after validation. Export first if you need a backup.

---

## Automated tests

Requires [Node.js](https://nodejs.org/). From the project root:

```bash
npm test
```

Runs [`tests/validation.test.mjs`](tests/validation.test.mjs) against [`scripts/validators.js`](scripts/validators.js) (team, player, and statistics rules).

---

## Access control

1. Session is stored in `soccerHubSessionRole`.
2. [`requireRole("admin")`](scripts/core.js) on the admin page; [`requireRole("user")`](scripts/core.js) on the user page.
3. Wrong role or missing session → redirect to [`index.html`](index.html).
4. Only the admin page performs writes to league data.

---

## Verification checklist

- [ ] Login only on `index.html`; no extra login hops.
- [ ] User → `user.html` without password.
- [ ] Admin → `admin.html` with correct password only.
- [ ] Guards: direct open of dashboards without session → `index.html`.
- [ ] User: teams grid, squad list, stats modal; no admin controls.
- [ ] Admin: CRUD teams, players, stats; validation errors shown.
- [ ] Delete team removes its players and stats.
- [ ] Refresh keeps `soccerHubData`.
- [ ] Export produces a JSON file; import restores data after validation.
- [ ] Quick menu links scroll to the correct sections.

---

## Manual test matrix

| ID | Scenario | Steps | Expected |
|----|-----------|-------|----------|
| U1 | Teams grid | User login | Cards show logo + name |
| U2 | Filter teams | Type in team search | Only matching teams |
| U3 | Squad | Click a team | Player rows with position |
| U4 | Stats modal | Click a player | Modal shows stats; Esc closes |
| A1 | Add team | Admin: fill name + logo URL → Add | Row in teams table |
| A2 | Edit team | Edit → save | Updated after refresh |
| A3 | Delete team | Delete + confirm | Team and its players gone |
| A4 | Add player | Pick team, name, position | Player listed; default stats row |
| A5 | Save stats | Pick player, set numbers → Save | User modal reflects new numbers |
| A6 | Export | Quick menu → Export JSON | File downloads |
| A7 | Import | Export, clear storage, import file | Data restored |
| L1 | Logout | Logout | Session cleared; guarded URLs bounce to index |

---

## Quick smoke test (~10 min)

1. U1–U4 on the user page.
2. A1, A4, A5 on the admin page.
3. A6–A7 if you use file backup.
4. L1 logout + guard check.

---

## Notes

- **Security:** The admin password in source is for **demos only**. A production app needs server-side authentication and authorization.
- **Course rubrics:** This project uses **functions**, **loops/conditionals**, **arrays/objects**, **browser persistence** (`localStorage`), **forms and validation**, a **numbered quick menu**, **file export/import**, and **automated tests** (`npm test`). Confirm with your instructor how browser storage vs. disk files should be documented.
- **Images:** External portrait and crest URLs can change or break over time; placeholders are acceptable for coursework.
