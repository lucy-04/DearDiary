# Dear Diary

A journal that quietly reads how you've been feeling — and paints your month as an aurora of moods.

Most journaling apps capture your words but never the emotional arc behind them. Dear Diary classifies each entry with the **Gemini API** the moment you save it, then renders every day as a softly glowing orb on a calendar — turning a pile of text into a visual mood timeline you can actually feel at a glance. No manual tagging, no mood sliders.

## Tech stack

- **Frontend:** React 18 + Vite, React Router, hand-written CSS design system
- **Backend:** Node.js + Express (REST API)
- **Database:** PostgreSQL / CockroachDB (`pg-pool`)
- **Auth:** JWT + bcrypt password hashing
- **AI:** Google Gemini API for emotion classification

## Features

- ✍️ Write dated entries with an optional title
- 🤖 Gemini classifies each entry's mood on save (or preview it first with one click)
- 🗓️ **Aurora Calendar** — every day with an entry glows in its mood colour
- 📊 At-a-glance stats: total entries, writing streak, most-felt mood
- 🔐 Register / sign in with JWT; passwords are bcrypt-hashed, never stored in the clear
- 🔎 Read or delete past entries from a focused reading view

## How it works

```
React (Vite, :5173)  ──/api──▶  Express API (:5001)  ──▶  PostgreSQL/CockroachDB
                                       │
                                       └──▶  Gemini API  (classify mood on write)
```

On save, the entry is sent to the Express API, which asks Gemini for the single mood
that best fits the text, stores the entry with that mood, and serves it back. The
calendar reads each month's entries and colours every day by its mood. Gemini is only
ever called server-side, so the API key never reaches the browser.

## Getting started

### Prerequisites
- Node.js 18+
- A PostgreSQL/CockroachDB connection string
- A Gemini API key ([Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Configure environment
```bash
cp .env.example .env
```
Fill in `.env`:
```
PORT=5001
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://user:password@host:port/diary_app
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Create the database tables
Run `schema.sql` against your database (creates `users` and `diary_entries`):
```bash
psql "$DATABASE_URL" -f schema.sql
```

### 3. Install dependencies
```bash
npm install            # backend
npm --prefix client install   # frontend
```

### 4. Run in development
Two terminals:
```bash
npm run dev            # Express API on http://localhost:5001
npm run client         # Vite dev server on http://localhost:5173
```
Open **http://localhost:5173**. (The Vite server proxies `/api` to the backend.)

### Run as a single production build
```bash
npm run build          # builds the React app into client/dist
npm start              # Express serves the API + the built frontend on :5001
```

## Deployment

The app deploys as a **single Node service** — Express serves both the API and the
built React app, so you only need one host. The database (CockroachDB) and Gemini
are external.

Recommended host: **[Render](https://render.com)** (free tier works) as one *Web Service*:

| Setting | Value |
| --- | --- |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Health check path | `/health` |

Set these environment variables in the host's dashboard (never commit them):

```
NODE_ENV=production
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=7d
DATABASE_URL=<your CockroachDB connection string>
GEMINI_API_KEY=<your Gemini key>
```

`PORT` is provided by the host automatically. To serve under a portfolio subdomain
(e.g. `diary.yoursite.com`), add it as a custom domain on the host and create the
`CNAME` record it gives you at your DNS provider.

> **Set a spend cap on the Gemini key** in Google AI Studio / Google Cloud billing
> before going public — the rate limiter bounds abuse, but the billing cap is the
> hard backstop.

## Screenshots

- Login Page
![login page](image.png)

- Diary Entry Page
![Diary Entry Page](image-1.png)

- Calender View
![Calender View](image-2.png)

- PasswordHash Representation;
![HashValue](image-3.png)

## Known limitations / what's next

- Next up: mood trend lines over time, and an option for on-device/self-hosted classification so entries can stay fully private.
