import { Router, type IRouter } from "express";
import { db, auctionsTable, bidsTable, usersTable } from "@workspace/db";
import { eq, ne, desc, sql } from "drizzle-orm";
import { AssignCreditsBody, GenerateDescriptionBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).then(r => r[0]);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    totalCredits: user.totalCredits,
    reservedCredits: user.reservedCredits,
    availableCredits: user.totalCredits - user.reservedCredits,
    createdAt: user.createdAt,
  };
}

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).where(ne(usersTable.role, "admin")).orderBy(desc(usersTable.createdAt));
  res.json(users.map(serializeUser));
});

router.patch("/admin/users/:id/credits", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = AssignCreditsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { amount, action } = parsed.data;
  const user = await db.select().from(usersTable).where(eq(usersTable.id, id)).then(r => r[0]);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newTotal = action === "set" ? amount : user.totalCredits + amount;
  const [updated] = await db
    .update(usersTable)
    .set({ totalCredits: newTotal })
    .where(eq(usersTable.id, id))
    .returning();

  res.json(serializeUser(updated));
});

router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const [auctionStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where status = 'active')::int`,
      ended: sql<number>`count(*) filter (where status = 'ended')::int`,
      upcoming: sql<number>`count(*) filter (where status = 'upcoming')::int`,
    })
    .from(auctionsTable);

  const [bidderCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(ne(usersTable.role, "admin"));

  const [bidCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bidsTable);

  const recentBids = await db
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
    .orderBy(desc(bidsTable.createdAt))
    .limit(10);

  res.json({
    totalAuctions: auctionStats.total,
    activeAuctions: auctionStats.active,
    endedAuctions: auctionStats.ended,
    upcomingAuctions: auctionStats.upcoming,
    totalBidders: bidderCount.count,
    totalBids: bidCount.count,
    recentActivity: recentBids,
  });
});

router.post("/admin/generate-description", requireAdmin, async (req, res): Promise<void> => {
  const parsed = GenerateDescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, keywords } = parsed.data;
  const description = generateDescription(title, keywords ?? "");
  res.json({ description });
});

function generateDescription(title: string, keywords: string): string {
  const keywordList = keywords.split(/[,\s]+/).filter(Boolean);
  const features = keywordList.length > 0 ? keywordList : ["premium", "exclusive", "rare"];

  const openers = [
    `Presenting a rare opportunity to own the exceptional`,
    `Discover the extraordinary`,
    `Seize your chance to acquire the highly sought-after`,
    `Don't miss this exclusive opportunity to bid on`,
    `This is your moment to claim the remarkable`,
  ];

  const middles = [
    `This ${features.slice(0, 2).join(" and ")} piece represents the pinnacle of quality and craftsmanship.`,
    `Renowned for its ${features[0] ?? "premium"} qualities, this item has captivated collectors and enthusiasts alike.`,
    `With its ${features.slice(0, 2).join(", ")} characteristics, this is a truly once-in-a-lifetime acquisition.`,
    `Celebrated for being ${features[0] ?? "exceptional"} and ${features[1] ?? "unique"}, this lot is a connoisseur's dream.`,
  ];

  const closers = [
    `Place your bid now and make this treasure yours. Auction ends soon — secure your legacy today.`,
    `This is a limited opportunity. Bid with confidence and join a select group of distinguished owners.`,
    `Act swiftly — winning bidder takes all. This gem won't wait for the hesitant.`,
    `A wise investment and a timeless possession. Register your bid before time runs out.`,
  ];

  const opener = openers[Math.floor(Math.random() * openers.length)];
  const middle = middles[Math.floor(Math.random() * middles.length)];
  const closer = closers[Math.floor(Math.random() * closers.length)];

  return `${opener} **${title}**.\n\n${middle}\n\n${closer}`;
}

export default router;
