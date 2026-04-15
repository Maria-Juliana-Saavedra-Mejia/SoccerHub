# SoccerHub (Role-Based OOP Web App)

SoccerHub is a structured, frontend-only web app built with HTML, CSS, and JavaScript using Object-Oriented Programming (OOP).

- **Admin**: full CRUD for **teams**, **players**, and **player statistics** (password: `admin123` in `scripts/core.js`).
- **User**: browse **teams** (card grid), open a team’s **squad** (with optional **player photos**), click a player to see **statistics** in a **modal** (read-only).

Session and app data live in browser `localStorage` (no backend).

---

## Project structure

```text
SoccerHub/
├── index.html                 # Login only (landing + role login)
├── README.md
├── html/
│   ├── admin.html             # Admin dashboard (teams / players / stats CRUD)
│   ├── user.html              # User: teams → players → stats modal
│   └── login.html             # Redirects to ../index.html
├── styles/
│   ├── common.css
│   ├── login.css
│   └── dashboard.css          # User cards, modal, admin tables
└── scripts/
    ├── core.js                # Auth, persistence, LeagueService, validators
    ├── login.js               # index.html login
    ├── admin.js               # admin.html behavior
    └── user.js                # user.html behavior
```

---

## Architecture (OOP)

Core code: [scripts/core.js](scripts/core.js).

| Piece | Responsibility |
|--------|----------------|
| `SoccerHubConfig` | Keys: `soccerHubData`, legacy `soccerHubPlayers`, `soccerHubSessionRole`, `adminPassword` |
| `SoccerHubUtils` | `newId()` |
| `AppDataRepository` | Load/save JSON blob `{ version, teams, players, stats }`; **migrate** from legacy flat `soccerHubPlayers` if needed |
| `LeagueService` | CRUD teams/players/stats; cascade delete when team removed |
| `AuthService` | Login, logout, `requireRole()` |
| `createTeamInputFromValues` | Team form validation |
| `createPlayerInputFromValues` | Player form validation |
| `createStatsInputFromValues` | Stats validation (`goals <= matchesPlayed`, etc.) |

### Data model

**Team**

```js
{ id: string, name: string, logoUrl: string }
```

**Player**

```js
{ id: string, teamId: string, name: string, position: string, imageUrl?: string }
```

Default seed data uses **football-data.org** team crests and portrait URLs you provided (Real Madrid, Barcelona, Man City squads; Liverpool and PSG appear as teams with empty squads until you add players in Admin).

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

### localStorage keys

| Key | Content |
|-----|---------|
| `soccerHubData` | Full app JSON (`teams`, `players`, `stats`) |
| `soccerHubPlayers` | **Legacy only** — read once to migrate if `soccerHubData` is missing |
| `soccerHubSessionRole` | `"admin"` or `"user"` |

---

## Pages

### `index.html` — login only

- Role select; **user** has no password; **admin** uses password.
- After login: **one** redirect to `html/admin.html` or `html/user.html`.
- If session already set, auto-redirects to the matching dashboard.

### `html/user.html` — user view

- Team cards (logo + name), optional **search teams**.
- Click team → player list (photo, name, position), optional **search players**.
- Click player → **modal** with portrait (if URL set) and goals, assists, matches, shots, yellow cards.
- No CRUD.

### `html/admin.html` — admin dashboard

- **Teams**: add / edit / delete (logo URL uses public images in seed data).
- **Players**: add / edit / delete (linked to team); optional **photo URL** for portraits.
- **Statistics**: pick player, edit numbers, save (validated).

### `html/login.html`

Redirects to `../index.html`.

---

## Access control

1. Session in `soccerHubSessionRole`.
2. `requireRole("admin")` on admin page; `requireRole("user")` on user page.
3. Wrong role or missing session → redirect to `index.html`.
4. Only admin page performs writes.

---

## Run

1. Open `index.html`.
2. User → Enter Dashboard → teams UI.
3. Admin → password `admin123` → admin CRUD.

Tip: if logo images fail to load when opening files as `file://`, use a simple local static server (e.g. VS Code Live Server) so remote SVG/PNG URLs load reliably.

**Reloading the built-in seed:** if you already have data in `localStorage` under `soccerHubData`, the app will keep using it. To load the new default teams/players/stats from `getDefaultData()`, remove the `soccerHubData` key in DevTools (Application → Local Storage) and refresh.

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
| L1 | Logout | Logout | Session cleared; guarded URLs bounce to index |

---

## Quick smoke test (~10 min)

1. U1–U4 on user page.
2. A1, A4, A5 on admin page.
3. L1 logout + guard check.

---

## Notes

- Demo-only: admin password in source is not secure for production.
- For production: backend auth + API authorization + real database.
