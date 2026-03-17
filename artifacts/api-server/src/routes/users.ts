import { Router, type IRouter } from "express";
import { db, bidsTable, auctionsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

router.get("/users/me/bids", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;

  const bids = await db
    .select({
      id: bidsTable.id,
      auctionId: bidsTable.auctionId,
      userId: bidsTable.userId,
      userName: usersTable.name,
      amount: bidsTable.amount,
      createdAt: bidsTable.createdAt,
      auctionTitle: auctionsTable.title,
      auctionStatus: auctionsTable.status,
      highestBidderId: auctionsTable.highestBidderId,
    })
    .from(bidsTable)
    .innerJoin(usersTable, eq(bidsTable.userId, usersTable.id))
    .innerJoin(auctionsTable, eq(bidsTable.auctionId, auctionsTable.id))
    .where(eq(bidsTable.userId, userId))
    .orderBy(desc(bidsTable.createdAt));

  const result = bids.map(b => ({
    id: b.id,
    auctionId: b.auctionId,
    userId: b.userId,
    userName: b.userName,
    amount: b.amount,
    createdAt: b.createdAt,
    auctionTitle: b.auctionTitle,
    auctionStatus: b.auctionStatus,
    isHighestBid: b.highestBidderId === userId,
  }));

  res.json(result);
});

router.get("/users/me/wins", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;

  const wonAuctions = await db
    .select()
    .from(auctionsTable)
    .where(eq(auctionsTable.winnerId, userId))
    .orderBy(desc(auctionsTable.endTime));

  const result = await Promise.all(wonAuctions.map(async (a) => {
    let highestBidderName = null;
    if (a.highestBidderId) {
      const bidder = await db.select().from(usersTable).where(eq(usersTable.id, a.highestBidderId)).then(r => r[0]);
      highestBidderName = bidder?.name ?? null;
    }
    const bidsCount = await db.select().from(bidsTable).where(eq(bidsTable.auctionId, a.id)).then(r => r.length);
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      imageUrl: a.imageUrl,
      startTime: a.startTime,
      endTime: a.endTime,
      minBid: a.minBid,
      bidIncrement: a.bidIncrement,
      currentBid: a.currentBid,
      highestBidderId: a.highestBidderId,
      highestBidderName,
      status: a.status,
      winnerId: a.winnerId,
      winnerName: null,
      totalBids: bidsCount,
      createdAt: a.createdAt,
    };
  }));

  res.json(result);
});

export default router;
