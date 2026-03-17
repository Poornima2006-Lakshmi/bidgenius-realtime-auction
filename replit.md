# BidGenius Workspace

## Overview

BidGenius is a full-stack real-time auction and bidding platform. It uses a pnpm monorepo with TypeScript. The frontend is a React + Vite app, the backend is Express 5, and PostgreSQL with Drizzle ORM handles persistence. Socket.io provides real-time communication.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **API framework**: Express 5 + Socket.io
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: express-session + Node.js crypto (scrypt)
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI 3.1 spec)
- **State management**: TanStack React Query
- **Routing**: Wouter

## Structure

```text
├── artifacts/
│   ├── api-server/          # Express API server (port 8080)
│   │   └── src/
│   │       ├── app.ts              # Express + session + Socket.io setup
│   │       ├── index.ts            # HTTP server entry
│   │       ├── lib/
│   │       │   ├── auth.ts         # Password hashing (scrypt)
│   │       │   ├── socket.ts       # Socket.io initialization + emitters
│   │       │   └── auction-scheduler.ts  # 5s interval: auto-start/end auctions
│   │       └── routes/
│   │           ├── auth.ts         # POST /auth/login|register, GET /auth/me, POST /auth/logout
│   │           ├── auctions.ts     # CRUD /auctions, POST /auctions/:id/bids, GET /auctions/:id/recommendation
│   │           ├── admin.ts        # /admin/users, /admin/stats, /admin/generate-description
│   │           └── users.ts        # /users/me/bids, /users/me/wins
│   └── bidgenius/           # React + Vite frontend (port 22910, served at /)
│       └── src/
│           ├── components/
│           │   ├── auth-context.tsx   # Global auth state via React context
│           │   ├── layout.tsx         # App shell with sidebar nav
│           │   ├── auction-card.tsx   # Auction listing card
│           │   ├── bid-recommendation-panel.tsx  # Smart bid suggestions
│           │   └── countdown-timer.tsx
│           ├── hooks/
│           │   └── use-socket.ts     # Socket.io client hook
│           └── pages/
│               ├── login.tsx         # Login + register
│               ├── dashboard.tsx     # Bidder dashboard
│               ├── auctions.tsx      # Auction browser
│               ├── auction-detail.tsx # Auction detail + bidding
│               └── admin/            # Admin pages
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 spec (openapi.yaml)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/
│       └── src/schema/      # users.ts, auctions.ts, bids.ts
└── scripts/
    └── src/seed.ts          # Seed demo accounts + auctions
```

## Demo Credentials

| Role   | Email                  | Password  |
|--------|------------------------|-----------|
| Admin  | admin@bidgenius.com    | admin123  |
| Bidder | alice@bidgenius.com    | alice123  |
| Bidder | bob@bidgenius.com      | bob123    |
| Bidder | carol@bidgenius.com    | carol123  |

## Key Features

1. **Role-based auth** (admin vs bidder) via session cookies
2. **Real-time bidding** via Socket.io - bid events broadcast to auction rooms
3. **Smart Bid Recommendation** - strategy-based (safe/moderate/aggressive) based on time remaining, competition, and available credits
4. **Reserved credit system** - credits reserved when leading, released when outbid
5. **Auto-auction lifecycle** - scheduler runs every 5s to update upcoming→active→ended
6. **AI-style description generator** - template-based for creating auction descriptions
7. **Admin dashboard** with live activity feed and analytics

## Common Commands

```bash
# Run codegen after OpenAPI spec changes
pnpm --filter @workspace/api-spec run codegen

# Push DB schema
pnpm --filter @workspace/db run push

# Seed demo data
pnpm --filter @workspace/scripts run seed

# Dev servers
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/bidgenius run dev
```

## Socket.io Events

- `auction:join` (emit) → join an auction room
- `auction:leave` (emit) → leave a room
- `bid:placed` (on) → new bid placed: `{ auctionId, bid, currentBid, highestBidderId }`
- `auction:ended` (on) → auction ended: `{ auctionId, winnerId, winnerName, finalBid }`
- `bid:outbid` (on) → user was outbid: `{ auctionId, previousBidderId, newBid, newBidderName }`

## Architecture Notes

- Backend exports `httpServer` (not `app`) so Socket.io can attach to the same HTTP server
- Sessions use in-memory store (upgrade to Redis for production)
- Custom fetch adds `credentials: 'include'` so session cookies are sent on all API calls
- Auction scheduler runs on the API server and auto-declares winners via `endAuction()`
