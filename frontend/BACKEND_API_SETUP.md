# Movie Ticket Bot — Serverless Backend Proxy Setup Guide

**Phase:** 4.2 — Secure Serverless Backend Proxy  
**Repository:** `chintasankarraj/movie-ticket-bot`  
**Location:** `frontend/api/`  
**Target Environment:** Vercel Serverless Functions + Vite Local Dev Middleware

---

## 1. Architectural Overview & Request Flow

The Movie Ticket Bot frontend communicates exclusively with a secure, read-only serverless API proxy located in `frontend/api/`. At no point does the browser client contact the GitHub API directly, nor does client-side bundle JavaScript ever possess or reference GitHub access tokens.

```
+-------------------------------------------------------------------------------+
|                             CLIENT BROWSER                                    |
|   React SPA (Dashboard, Runs, Shows, Alerts, System)                          |
+-------------------------------------------------------------------------------+
                                      |
                     HTTP GET /api/overview, /api/workflows, /api/shows
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                     SERVERLESS PROXY LAYER (Vercel / Vite)                    |
|                                                                               |
|   - Method Validation: GET only (POST/PUT/DELETE rejected with HTTP 405)      |
|   - Parameter Sanitation & Clamping (limit: 1..25, default: 10)               |
|   - In-Memory LRU Cache (60s TTL fresh, 300s stale grace period)             |
|   - Upstream Error Sanitizer (Maps 401/403/404/429/5xx, never leaks tokens)   |
|   - Offline Graceful Fallback (Returns schema with dataSource: "offline")     |
+-------------------------------------------------------------------------------+
                                      |
              HTTPS Authorization: Bearer ${process.env.GITHUB_PAT}
                     (Server-side private network call only)
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                       GITHUB REST API (api.github.com)                        |
|                                                                               |
|   - /repos/chintasankarraj/movie-ticket-bot/actions/runs?per_page=N           |
|   - /repos/chintasankarraj/movie-ticket-bot/contents/cloud_seen_shows.json    |
+-------------------------------------------------------------------------------+
```

---

## 2. Serverless API Endpoints

All endpoints support `GET` only. Any other HTTP method returns `405 Method Not Allowed` with an `Allow: GET` header.

### 2.1. `GET /api/overview`
Aggregates target movie configuration, cloud monitoring telemetry, latest GitHub Actions run status, and local monitor status.

**Sample Response (`HTTP 200`):**
```json
{
  "generatedAt": "2026-11-17T19:07:49.664Z",
  "dataSource": "github_live",
  "cacheStatus": "HIT",
  "movieTarget": {
    "title": "Avengers: Doomsday",
    "universe": "Marvel Cinematic Universe • Phase 6",
    "city": "Hyderabad",
    "targetDate": "2026-12-17",
    "targetWindow": {
      "start": "12:00 AM",
      "end": "04:59 AM",
      "start24": "00:00",
      "end24": "04:59"
    }
  },
  "cloudMonitor": {
    "provider": "District",
    "scheduleCron": "37 * * * *",
    "configured": true,
    "lastRun": {
      "id": 1944810234,
      "name": "Movie Ticket Availability Monitor",
      "event": "schedule",
      "status": "completed",
      "conclusion": "success",
      "startedAt": "2026-11-17T18:37:12Z",
      "completedAt": "2026-11-17T18:37:34Z",
      "durationSeconds": 22,
      "commitSha": "6f03846",
      "htmlUrl": "https://github.com/chintasankarraj/movie-ticket-bot/actions/runs/1944810234"
    },
    "lastSuccessfulRun": {
      "id": 1944810234,
      "timestamp": "2026-11-17T18:37:34Z",
      "durationSeconds": 22
    },
    "detectedShowsCount": 0,
    "stateFileSha": "a1b2c3d4e5f6..."
  },
  "localMonitor": {
    "providers": ["BookMyShow", "District"],
    "intervalSeconds": 90,
    "status": "unlinked_offline",
    "notice": "Local workstation monitor runs independently as a CLI process. Telemetry is not linked to cloud API."
  }
}
```

### 2.2. `GET /api/workflows?limit=10`
Returns verified GitHub Actions workflow runs for the cloud monitoring runner.

**Query Parameters:**
- `limit` *(optional)*: Integer between `1` and `25` (clamped). Defaults to `10`.

**Sample Response (`HTTP 200`):**
```json
{
  "generatedAt": "2026-11-17T19:07:55.607Z",
  "dataSource": "github_live",
  "cacheStatus": "HIT",
  "totalRuns": 14,
  "limit": 10,
  "runs": [
    {
      "id": 1944810234,
      "name": "Movie Ticket Availability Monitor",
      "event": "schedule",
      "status": "completed",
      "conclusion": "success",
      "startedAt": "2026-11-17T18:37:12Z",
      "completedAt": "2026-11-17T18:37:34Z",
      "durationSeconds": 22,
      "commitSha": "6f03846",
      "htmlUrl": "https://github.com/chintasankarraj/movie-ticket-bot/actions/runs/1944810234"
    }
  ]
}
```

### 2.3. `GET /api/shows`
Returns detected midnight show records parsed directly from `cloud_seen_shows.json`.

**Sample Response (`HTTP 200`):**
```json
{
  "generatedAt": "2026-11-17T19:07:59.849Z",
  "dataSource": "github_live",
  "cacheStatus": "HIT",
  "targetDate": "2026-12-17",
  "totalDetected": 2,
  "stateFileSha": "a1b2c3d4e5f6...",
  "retrievedAt": "2026-11-17T19:07:59.849Z",
  "shows": [
    {
      "raw": "DISTRICT_Prasads Multiplex_01:00 AM",
      "isParsed": true,
      "provider": "District",
      "venue": "Prasads Multiplex",
      "time": "01:00 AM"
    },
    {
      "raw": "BMS_AMB Cinemas Gachibowli_12:15 AM",
      "isParsed": true,
      "provider": "BookMyShow",
      "venue": "AMB Cinemas Gachibowli",
      "time": "12:15 AM"
    }
  ]
}
```

---

## 3. GitHub Personal Access Token (PAT) Requirements

To query the private repository `chintasankarraj/movie-ticket-bot`, create a Fine-Grained Personal Access Token with the minimum necessary read-only permissions:

1. In GitHub, navigate to **Settings** > **Developer Settings** > **Personal access tokens** > **Fine-grained tokens**.
2. Click **Generate new token**.
3. **Token name:** `Movie Ticket Bot Serverless Proxy Read-Only`
4. **Expiration:** Select preferred duration (e.g., 90 days or 1 year).
5. **Repository access:** **Only select repositories** -> Select `chintasankarraj/movie-ticket-bot`.
6. **Repository permissions:**
   - **Actions:** `Read-only` *(Allows reading workflow runs and job status)*
   - **Contents:** `Read-only` *(Allows reading `cloud_seen_shows.json`)*
   - **Metadata:** `Read-only` *(Mandatory default for all tokens)*
7. Click **Generate token** and copy the resulting string (`github_pat_...`).

> [!CAUTION]
> Never grant `Write` or `Admin` permissions to this token. The frontend serverless proxy is strictly read-only.
> Never commit this token to Git or save it in any tracked file.

---

## 4. Vercel Configuration & Deployment

### 4.1. Set Project Root Directory
When importing the project repository in Vercel:
- **Framework Preset:** `Vite`
- **Root Directory:** Set to `frontend`
- **Build Command:** `npm run build` (runs `tsc && vite build`)
- **Output Directory:** `dist`

### 4.2. Configure Server Environment Variable
1. In the Vercel Project Dashboard, navigate to **Settings** > **Environment Variables**.
2. Add the following variable:
   - **Key:** `GITHUB_PAT`
   - **Value:** `github_pat_...` (Your fine-grained token from Step 3)
   - **Environment:** Select **Production**, **Preview**, and **Development**.
3. Click **Save**.

### 4.3. Automatic Serverless Function Routing
The configuration in `frontend/vercel.json` automatically maps incoming `/api/*` requests to the corresponding serverless files in `frontend/api/*.ts`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 5. Local Development Integration

Local development requires zero external proxy utilities or secondary backend servers.

### 5.1. Running in Offline Fallback Mode (Default)
Simply run:
```bash
cd frontend
npm run dev
```
In this mode, `GITHUB_PAT` is not defined. The endpoints automatically return standard offline fallback payloads (`HTTP 200`, `dataSource: "offline_fallback"`).

### 5.2. Running with Live GitHub Connectivity Locally
To test live data retrieval locally:
```powershell
# PowerShell (session-only, never persisted to disk):
$env:GITHUB_PAT = "github_pat_..."
cd frontend
npm run dev
```
Alternatively, you may place `GITHUB_PAT=github_pat_...` into `frontend/.env.local`.
*(Verify that `.env.local` is present in `.gitignore` and never committed).*

---

## 6. Caching & Performance Optimization

To protect GitHub API rate limits (5,000 requests/hour for authenticated tokens) and ensure sub-50ms responses for dashboard users:

1. **In-Memory Serverless Cache:**
   - Stored in memory with a 60-second Fresh TTL.
   - 300-second (5 minute) Stale Grace Period.
   - In the event of temporary upstream GitHub latency or outage, cached data is served seamlessly via `getFallbackOnFailure()`.
2. **HTTP Cache-Control Headers:**
   - `public, s-maxage=60, stale-while-revalidate=120`: Instructs Vercel Edge CDN nodes to cache responses for 60 seconds and revalidate in the background.
3. **Security Headers:**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`

---

## 7. Known Data Gaps & Architectural Boundaries

| Component | Cloud Telemetry Status | Reason / Boundary |
|---|---|---|
| **Cloud Monitor (District)** | **Fully Tracked** | GitHub Actions executes `monitor_cloud.py` hourly. Workflow runs and `cloud_seen_shows.json` are retrieved live. |
| **Local Monitor (BMS + District)** | **Unlinked / Offline** | Runs solely on user workstation as an interactive CLI script (`monitor.py`). No local telemetry is published to the cloud. |
| **Telegram Delivery Logs** | **Indirect Only** | Telegram bot tokens remain strictly confidential in GitHub Actions secrets. Successful dispatch is confirmed when `cloud_seen_shows.json` is updated. |
| **Real-time Show Counts** | **0 (Accurate)** | `cloud_seen_shows.json` is currently `[]` because tickets for *Avengers: Doomsday* (Dec 17, 2026) have not yet opened. |
