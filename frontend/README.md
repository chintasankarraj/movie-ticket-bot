# Movie Ticket Bot — Frontend

A cinematic, modern web dashboard for tracking midnight premiere showtime availability for **Avengers: Doomsday** (December 17, 2026) in **Hyderabad**.

> **Note on Architecture (Phase 3.2.1):** The frontend is currently a decoupled UI preview powered by strongly-typed mock data (`src/data/mockData.ts`). It is intentionally not connected to live scraping APIs or Telegram dispatchers. Real-world monitoring executes independently in background Python runners (`monitor.py` / `monitor_cloud.py`).

---

## 1. Overview

Movie Ticket Bot provides a unified telemetry interface for the hybrid monitoring architecture:
- **Local Monitoring Runner (`monitor.py`):** High-frequency 90-second sweeper across BookMyShow (DOM) and District (API), with local audio alarms and dedicated deduplication (`seen_shows.json`).
- **Cloud GitHub Actions Runner (`monitor_cloud.py`):** Zero-cost hourly cron execution (`37 * * * *`) against District, tracking persistent state across ephemeral runner VMs via `cloud_seen_shows.json`.
- **Pure Parsing Engine (`showtime_parser.py`):** Shared showtime parsing and midnight-filtering logic verified by 72 offline unit tests.

The frontend is implemented with a **Cinematic Dark** design language, offering five dedicated monitoring views with strong typography, responsive navigation, and Recharts telemetry visualization.

---

## 2. Technology Stack

- **Framework:** React 18
- **Build Tool & Dev Server:** Vite 5
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS (Custom Cinematic Dark theme)
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **Font:** Inter + JetBrains Mono

---

## 3. Application Structure

```
frontend/
├── public/
│   └── radar.svg              # Brand radar icon
├── src/
│   ├── components/
│   │   ├── common/            # MetricCard, StatusBadge, ProviderBadge, EmptyState, DemoBanner
│   │   ├── layout/            # Sidebar, Header, MobileNav
│   │   ├── dashboard/         # HeroBanner, ProviderStatusCards, PollingChart, RecentActivityList
│   │   ├── watchlist/         # MovieSummaryCard, ShowtimeFilters, ShowtimeCard
│   │   ├── activity/          # LatencyChart, ActivityTimeline, ActivityLogTable
│   │   ├── notifications/     # ChannelStatusCard, TelegramMessageCard, NotificationLogTable
│   │   └── settings/          # ConfigCard, ArchitectureDiagram, SimulationControls
│   ├── layouts/
│   │   └── DashboardLayout.tsx
│   ├── pages/
│   │   ├── Overview.tsx       # /
│   │   ├── Watchlist.tsx      # /watchlist
│   │   ├── Activity.tsx       # /activity
│   │   ├── Notifications.tsx  # /notifications
│   │   ├── Settings.tsx       # /settings
│   │   └── NotFound.tsx       # 404
│   ├── data/
│   │   └── mockData.ts        # Centralized typed sample dataset
│   ├── types/
│   │   └── index.ts           # Strongly typed domain entities
│   ├── utils/
│   │   └── cn.ts              # Class merging utility
│   ├── styles/
│   │   └── globals.css        # Tailwind directives and custom scrollbars
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── .gitignore
```

---

## 4. Setup and Development

### Prerequisites
- Node.js `v18+` or `v20+` (verified on Node.js `v26.7.0`)
- npm `9+`

### Installation
```bash
cd frontend
npm install
```

### Run Local Development Server
```bash
npm run dev
```
Access the application at `http://localhost:5173`.

### Production Build
```bash
npm run build
```
Build output is emitted to `frontend/dist/`.

### Preview Production Build
```bash
npm run preview
```

---

## 5. Current Mock-Data Limitations & Safety

1. **Client-Side Simulation:** The frontend currently runs 100% on typed mock data defined in `src/data/mockData.ts`.
2. **Zero Credentials:** The frontend contains zero Telegram tokens, bot keys, or API credentials.
3. **Illustrative Cards:** Cinema showtime cards on `/watchlist` are illustrative samples to test filtering (midnight vs daytime, providers, and formats). Booking buttons are intentionally disabled with explicit explanatory tooltips.
4. **Isolated From Python Engines:** Toggles on the Settings page alter only in-memory browser state and do not modify root Python scripts, local deduplication state, or GitHub Actions crons.

---

## 6. Future Backend Integration Roadmap

When connecting this frontend to live monitoring telemetry:
1. **GitHub Actions API Integration:** A lightweight backend proxy or serverless function can query GitHub REST API (`/repos/{owner}/{repo}/actions/runs`) to fetch actual workflow execution history and latencies.
2. **Cloud State Fetching:** `cloud_seen_shows.json` can be retrieved directly from the repository's raw content endpoint or via a read-only endpoint.
3. **Security Boundary:** Never store or expose GitHub Personal Access Tokens or Telegram bot secrets in frontend client code. All authenticated requests must route through a secure server-side proxy.
