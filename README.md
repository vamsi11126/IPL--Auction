<div align="center">

  # Crick Auction
  ### *The ultimate real-time multiplayer IPL auction and live fantasy experience.*

  [![React](https://img.shields.io/badge/React-19.2-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-12.11-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
  [![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](./LICENSE)

  Host live multiplayer auctions with friends, manage budgets, and bid in real-time.<br />
  Evaluate your drafted squad using the advanced Franchise Strength rating system.<br />
  Experience sub-second latency bidding backed by a sophisticated hybrid database architecture.

</div>

---

## About

Crick Auction is a real-time web workspace for running IPL-style cricket franchise auctions. Add friends to a lobby, assign franchise teams, and start a live bidding war. For every player that comes under the hammer, the platform synchronizes a universal clock offset across all clients. The current bid, highest bidder, remaining purses, and chat stay perfectly synced from start to finish.

---

## How it works

### 1. Enter the Arena
When you open Crick Auction, the app connects to **Supabase PostgreSQL** to fetch active public rooms and leaderboard history without bottlenecking the live game engine.

### 2. Create or Join an Auction
Host a private room for your friends or jump into a public lobby. Creating a room sets up a completely isolated **Firebase Realtime Database (RTDB)** node just for your auction.

### 3. Claim Franchises & Fill Bots
Once inside the lobby, you and your friends claim your favorite teams. If you don't have enough people, turn on **AI Franchise Bots** with timer-adaptive bidding strategies.

### 4. The Live Bidding War
Every connected user sees the exact same timer and bid amount instantly. The platform calculates a universal clock offset across all browsers to ensure fair bidding.

### 5. Final Squads & Franchise Ratings
When all players are sold, review every team's final squad and see how your team ranks globally using the built-in **Franchise Strength** evaluation system.

---

## Install

1. **Clone and Install**
   ```bash
   git clone https://github.com/vamsi11126/IPL--Auction.git
   cd "IPL--Auction"
   npm install
   ```

2. **Configure Environment**
   Copy `.env.example` to `.env` and fill in your own Firebase and Supabase credentials:
   ```bash
   cp .env.example .env
   ```

3. **Start the dev server**
   ```bash
   npm run dev
   ```

---

## Tech Stack

| Core Frontend | Styling & UI | Backend & Auth | Integration |
|---|---|---|---|
| React 19.2 | Tailwind CSS v4 | Firebase RTDB | CricAPI |
| Vite 6.0 | Framer Motion | Supabase | Node.js Scripts |
| React Router | Lucide React | Firebase Auth | html-to-image |

---

## Documentation

- **scripts/autoUpdateFantasy.js**: Auto-calculates fantasy points from live CricAPI matches.
- **scripts/backfillIPL2026.js**: Imports IPL series scorecards.
- **scripts/deployDatabaseRules.js**: Syncs security rules to Firebase RTDB.
- **database.rules.json**: Contains the security rules boundary for Firebase.

---

## License

This project is licensed under the **Apache License 2.0** — see the [LICENSE](./LICENSE) file for details.

---

## Attribution

This project is built on top of [ipl-auction](https://github.com/Shaurya01836/ipl-auction) by [Shaurya01836](https://github.com/Shaurya01836), licensed under the Apache License 2.0. Modifications and additional features have been made by [Vamsi](https://github.com/vamsi11126). See the [NOTICE](./NOTICE) file for details.
