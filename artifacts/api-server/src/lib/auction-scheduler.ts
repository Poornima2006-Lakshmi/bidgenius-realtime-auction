import { db, auctionsTable, usersTable, bidsTable } from "@workspace/db";
import { eq, and, lt, lte, gte, ne } from "drizzle-orm";
import { emitAuctionEnded } from "./socket.js";

export function startAuctionScheduler() {
  setInterval(async () => {
    await checkAndUpdateAuctions();
  }, 5000);
}

async function checkAndUpdateAuctions() {
  const now = new Date();

  const upcoming = await db
    .select()
    .from(auctionsTable)
    .where(and(eq(auctionsTable.status, "upcoming"), lte(auctionsTable.startTime, now)));

  for (const auction of upcoming) {
    await db
      .update(auctionsTable)
      .set({ status: "active" })
      .where(eq(auctionsTable.id, auction.id));
  }

  const active = await db
    .select()
    .from(auctionsTable)
    .where(and(eq(auctionsTable.status, "active"), lte(auctionsTable.endTime, now)));

  for (const auction of active) {
    await endAuction(auction.id, auction.highestBidderId);
  }
}

export async function endAuction(auctionId: number, winnerId: number | null) {
  const auction = await db.select().from(auctionsTable).where(eq(auctionsTable.id, auctionId)).then(r => r[0]);
  if (!auction || auction.status === "ended") return;

  await db
    .update(auctionsTable)
    .set({ status: "ended", winnerId: winnerId })
    .where(eq(auctionsTable.id, auctionId));

  if (winnerId) {
    const winner = await db.select().from(usersTable).where(eq(usersTable.id, winnerId)).then(r => r[0]);
    if (winner) {
      await db
        .update(usersTable)
        .set({
          totalCredits: winner.totalCredits - auction.currentBid,
          reservedCredits: winner.reservedCredits - auction.currentBid,
        })
        .where(eq(usersTable.id, winnerId));
    }
  }

  let winnerName = null;
  if (winnerId) {
    const w = await db.select().from(usersTable).where(eq(usersTable.id, winnerId)).then(r => r[0]);
    winnerName = w?.name ?? null;
  }

  emitAuctionEnded(auctionId, {
    auctionId,
    winnerId,
    winnerName,
    finalBid: auction.currentBid,
  });
}
