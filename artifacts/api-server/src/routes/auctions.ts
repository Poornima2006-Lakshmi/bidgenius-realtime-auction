import { Router, type IRouter } from "express";
import { db, auctionsTable, bidsTable, usersTable } from "@workspace/db";
import { eq, desc, sql, and, ne } from "drizzle-orm";
import { CreateAuctionBody, UpdateAuctionBody, GetAuctionBidsResponse, GetAuctionsQueryParams } from "@workspace/api-zod";
import { emitBidPlaced, emitOutbid } from "../lib/socket.js";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

async function getAuctionStatus(auction: any): Promise<"upcoming" | "active" | "ended"> {
  const now = new Date();
  if (auction.status === "ended") return "ended";
  if (new Date(auction.endTime) <= now) return "ended";
  if (new Date(auction.startTime) <= now) return "active";
  return "upcoming";
}

async function serializeAuction(auction: any, totalBids?: number): Promise<any> {
  let highestBidderName = null;
  if (auction.highestBidderId) {
    const bidder = await db.select().from(usersTable).where(eq(usersTable.id, auction.highestBidderId)).then(r => r[0]);
    highestBidderName = bidder?.name ?? null;
  }
  let winnerName = null;
  if (auction.winnerId) {
    const winner = await db.select().from(usersTable).where(eq(usersTable.id, auction.winnerId)).then(r => r[0]);
    winnerName = winner?.name ?? null;
  }
  const status = await getAuctionStatus(auction);
  const count = totalBids ?? (await db.select({ count: sql<number>`count(*)::int` }).from(bidsTable).where(eq(bidsTable.auctionId, auction.id)).then(r => r[0]?.count ?? 0));

  return {
    id: auction.id,
    title: auction.title,
    description: auction.description,
    imageUrl: auction.imageUrl,
    startTime: auction.startTime,
    endTime: auction.endTime,
    minBid: auction.minBid,
    bidIncrement: auction.bidIncrement,
    currentBid: auction.currentBid,
    highestBidderId: auction.highestBidderId,
    highestBidderName,
    status,
    winnerId: auction.winnerId,
    winnerName,
    totalBids: count,
    createdAt: auction.createdAt,
  };
}

router.get("/auctions", async (req, res): Promise<void> => {
  const query = GetAuctionsQueryParams.safeParse(req.query);
  const statusFilter = query.success ? query.data.status : undefined;

  const auctions = await db.select().from(auctionsTable).orderBy(desc(auctionsTable.createdAt));
  
  const serialized = await Promise.all(auctions.map(a => serializeAuction(a)));
  
  const filtered = statusFilter ? serialized.filter(a => a.status === statusFilter) : serialized;
  
  res.json(filtered);
});

router.post("/auctions", requireAdmin, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).then(r => r[0]);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  const parsed = CreateAuctionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, imageUrl, startTime, endTime, minBid, bidIncrement } = parsed.data;
  const now = new Date();
  const start = new Date(startTime);
  const status = start <= now ? "active" : "upcoming";

  const [auction] = await db.insert(auctionsTable).values({
    title,
    description,
    imageUrl: imageUrl ?? null,
    startTime: start,
    endTime: new Date(endTime),
    minBid,
    bidIncrement,
    currentBid: minBid,
    status,
    createdBy: userId,
  }).returning();

  res.status(201).json(await serializeAuction(auction, 0));
});

router.get("/auctions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid auction ID" });
    return;
  }

  const auction = await db.select().from(auctionsTable).where(eq(auctionsTable.id, id)).then(r => r[0]);
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }

  const bids = await db
    .select({
      id: bidsTable.id,
      auctionId: bidsTable.auctionId,
      userId: bidsTable.userId,
      userName: usersTable.name,
      amount: bidsTable.amount,
      createdAt: bidsTable.createdAt,
    })
    .from(bidsTable)
    .innerJoin(usersTable, eq(bidsTable.userId, usersTable.id))
    .where(eq(bidsTable.auctionId, id))
    .orderBy(desc(bidsTable.createdAt));

  const serialized = await serializeAuction(auction, bids.length);
  res.json({ ...serialized, bids });
});

router.patch("/auctions/:id", requireAdmin, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).then(r => r[0]);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateAuctionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [auction] = await db
    .update(auctionsTable)
    .set(parsed.data)
    .where(eq(auctionsTable.id, id))
    .returning();

  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }

  res.json(await serializeAuction(auction));
});

router.get("/auctions/:id/bids", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const bids = await db
    .select({
      id: bidsTable.id,
      auctionId: bidsTable.auctionId,
      userId: bidsTable.userId,
      userName: usersTable.name,
      amount: bidsTable.amount,
      createdAt: bidsTable.createdAt,
    })
    .from(bidsTable)
    .innerJoin(usersTable, eq(bidsTable.userId, usersTable.id))
    .where(eq(bidsTable.auctionId, id))
    .orderBy(desc(bidsTable.createdAt));

  res.json(bids);
});

router.post("/auctions/:id/bids", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const auctionId = parseInt(raw, 10);

  const auction = await db.select().from(auctionsTable).where(eq(auctionsTable.id, auctionId)).then(r => r[0]);
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }

  const now = new Date();
  const status = await getAuctionStatus(auction);
  if (status !== "active") {
    res.status(400).json({ error: "Auction is not active" });
    return;
  }

  const amount = parseInt(req.body.amount, 10);
  if (isNaN(amount) || amount < 1) {
    res.status(400).json({ error: "Invalid bid amount" });
    return;
  }

  const minRequired = auction.currentBid + auction.bidIncrement;
  if (amount < minRequired) {
    res.status(400).json({ error: `Bid must be at least ${minRequired} credits` });
    return;
  }

  if (auction.highestBidderId === userId) {
    res.status(400).json({ error: "You are already the highest bidder" });
    return;
  }

  const bidder = await db.select().from(usersTable).where(eq(usersTable.id, userId)).then(r => r[0]);
  if (!bidder) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const available = bidder.totalCredits - bidder.reservedCredits;
  if (available < amount) {
    res.status(400).json({ error: "Insufficient credits" });
    return;
  }

  const previousBidderId = auction.highestBidderId;

  await db.update(usersTable).set({
    reservedCredits: bidder.reservedCredits + amount,
  }).where(eq(usersTable.id, userId));

  if (previousBidderId) {
    const prevBidder = await db.select().from(usersTable).where(eq(usersTable.id, previousBidderId)).then(r => r[0]);
    if (prevBidder) {
      await db.update(usersTable).set({
        reservedCredits: Math.max(0, prevBidder.reservedCredits - auction.currentBid),
      }).where(eq(usersTable.id, previousBidderId));
    }
  }

  const [bid] = await db.insert(bidsTable).values({
    auctionId,
    userId,
    amount,
  }).returning();

  await db.update(auctionsTable).set({
    currentBid: amount,
    highestBidderId: userId,
  }).where(eq(auctionsTable.id, auctionId));

  const bidData = {
    id: bid.id,
    auctionId: bid.auctionId,
    userId: bid.userId,
    userName: bidder.name,
    amount: bid.amount,
    createdAt: bid.createdAt,
  };

  emitBidPlaced(auctionId, {
    auctionId,
    bid: bidData,
    currentBid: amount,
    highestBidderId: userId,
  });

  if (previousBidderId) {
    emitOutbid(previousBidderId, {
      auctionId,
      previousBidderId,
      newBid: amount,
      newBidderName: bidder.name,
    });
  }

  res.status(201).json(bidData);
});

router.get("/auctions/:id/recommendation", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const auctionId = parseInt(raw, 10);

  const auction = await db.select().from(auctionsTable).where(eq(auctionsTable.id, auctionId)).then(r => r[0]);
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }

  const bidder = await db.select().from(usersTable).where(eq(usersTable.id, userId)).then(r => r[0]);
  if (!bidder) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const recentBids = await db
    .select()
    .from(bidsTable)
    .where(eq(bidsTable.auctionId, auctionId))
    .orderBy(desc(bidsTable.createdAt));

  const uniqueBidders = new Set(recentBids.map(b => b.userId)).size;
  const totalBids = recentBids.length;

  const now = new Date();
  const endTime = new Date(auction.endTime);
  const secondsRemaining = Math.max(0, (endTime.getTime() - now.getTime()) / 1000);

  const available = bidder.totalCredits - bidder.reservedCredits;
  const minNext = auction.currentBid + auction.bidIncrement;

  let suggestedBid: number;
  let strategy: "safe" | "moderate" | "aggressive";
  let reasoning: string;
  let confidence: number;

  if (secondsRemaining < 30) {
    strategy = "aggressive";
    suggestedBid = auction.currentBid + auction.bidIncrement * 2;
    reasoning = `Only ${Math.round(secondsRemaining)}s left! Place an aggressive bid to secure the win.`;
    confidence = 85;
  } else if (secondsRemaining < 120) {
    if (uniqueBidders >= 3) {
      strategy = "aggressive";
      suggestedBid = auction.currentBid + auction.bidIncrement * 2;
      reasoning = `High competition (${uniqueBidders} bidders) with only ${Math.round(secondsRemaining / 60)}m left. Aggressive bid recommended.`;
      confidence = 75;
    } else {
      strategy = "moderate";
      suggestedBid = auction.currentBid + auction.bidIncrement;
      reasoning = `${Math.round(secondsRemaining / 60)}m remaining with ${uniqueBidders} bidder(s). Stay competitive.`;
      confidence = 70;
    }
  } else {
    if (totalBids === 0) {
      strategy = "safe";
      suggestedBid = auction.minBid;
      reasoning = "No bids yet. Open with the minimum bid to stake your claim.";
      confidence = 90;
    } else if (uniqueBidders <= 2) {
      strategy = "safe";
      suggestedBid = minNext;
      reasoning = `Low competition (${uniqueBidders} bidder). A safe minimum increment keeps you in the lead.`;
      confidence = 80;
    } else {
      strategy = "moderate";
      suggestedBid = auction.currentBid + auction.bidIncrement;
      reasoning = `${uniqueBidders} active bidders. Match the increment to stay competitive without overspending.`;
      confidence = 65;
    }
  }

  if (suggestedBid > available) {
    suggestedBid = available > minNext ? Math.floor(available * 0.9) : available;
    strategy = "safe";
    reasoning = `Limited credits available (${available}). This is the safest bid within your budget.`;
    confidence = 50;
  }

  if (suggestedBid < minNext) {
    suggestedBid = minNext;
  }

  res.json({
    suggestedBid,
    strategy,
    reasoning,
    confidence,
  });
});

export default router;
