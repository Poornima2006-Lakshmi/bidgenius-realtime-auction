# BidGenius

A real-time online auction and bidding platform built for hackathon demonstration.

## 🌐 Live Demo
https://bid-genius-spark.lovable.app

## Overview

BidGenius is a full-stack web application where an Admin creates and manages auctions, assigns credits to bidders, and monitors live activity. Bidders register, browse auctions, place real-time bids using credits, receive live updates, and get strategic bid suggestions from the Smart Bid Recommendation System.

## Tech Stack

- **Frontend**: React 19 + Tailwind CSS + Vite
- **Backend**: Node.js + Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Socket.io
- **API**: OpenAPI 3.1 + Orval codegen (React Query hooks + Zod schemas)
- **Auth**: Session-based (express-session + scrypt hashing)
- **Monorepo**: pnpm workspaces

## Features

### Admin
- Dashboard with summary stats (total auctions, active, ended, bidders, bids)
- Create and manage auctions (title, description, image, timing, bids)
- **AI-Style Auction Description Generator** — enter keywords, get a polished description
- Assign credits to bidders
- Monitor real-time bid activity feed
- View bid history per auction
- Auto-declared winners when auction ends

### Bidder
- Register and login
- Dashboard showing available/reserved credits, bid history, wins
- Browse active auctions with polished card layout
- Auction detail page with countdown timer
- **Smart Bid Recommendation System** — AI-style suggestions based on:
  - Current bid and increment
  - Bidding activity and competition
  - Time remaining
  - Available credits
- Real-time bid updates via Socket.io
- Outbid notifications
- Winner/loser status after auction ends

### Auction Logic
- Statuses: upcoming → active → ended (auto-updated every 5s)
- Bid validation (minimum increment, sufficient credits)
- Reserved credit system (release credits when outbid)
- Winner auto-declared when timer ends
- Full bid history with timestamps


## Demo Flow

1. Log in as Admin → view dashboard stats
2. Create a new auction (use the AI description generator!)
3. Assign credits to bidders from the Users tab
4. Log in as Alice in a new tab → browse auctions
5. Open an auction detail page → place a bid
6. Log in as Bob in another tab → place a higher bid
7. Watch real-time bid updates in both sessions
8. See the outbid notification appear
9. Check the Smart Bid Recommendation panel
10. Let the timer expire → winner auto-declared
11. Admin sees full analytics and bid history

## Setup Instructions

### Prerequisites
- Node.js 20+
- pnpm
- PostgreSQL (or use Replit's built-in database)

### Installation

```bash
pnpm install
```

### Environment Variables

```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
PORT=8080
```

### Database

```bash
# Push schema to database
pnpm --filter @workspace/db run push

# Seed demo data
pnpm --filter @workspace/scripts run seed
```

### Development

```bash
# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (in another terminal)
pnpm --filter @workspace/bidgenius run dev
```

## Project Structure

```
├── artifacts/
│   ├── api-server/          # Express API server
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── auth.ts         # Password hashing
│   │       │   ├── socket.ts       # Socket.io setup
│   │       │   └── auction-scheduler.ts  # Auto-end auctions
│   │       └── routes/
│   │           ├── auth.ts         # Login/register/logout
│   │           ├── auctions.ts     # Auction CRUD + bidding
│   │           ├── admin.ts        # Admin operations
│   │           └── users.ts        # User bid history
│   └── bidgenius/           # React + Vite frontend
│       └── src/
│           ├── components/  # Reusable UI components
│           ├── hooks/       # Custom hooks (useSocket)
│           └── pages/       # Page components
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 spec
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle ORM schema
└── scripts/
    └── src/seed.ts          # Database seeder
```

## Known Limitations

- No payment gateway (credits are virtual, admin-assigned)
- Session stored in memory (use Redis for production)
- No email notifications
- Image URLs must be external links (no file upload)
- Auto-auction-end checks every 5 seconds (not millisecond-precise)
