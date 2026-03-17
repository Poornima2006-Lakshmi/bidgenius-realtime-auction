import { db, usersTable, auctionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Seeding database...");

  const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.email, "admin@bidgenius.com")).then(r => r[0]);
  if (!existingAdmin) {
    await db.insert(usersTable).values({
      name: "Admin User",
      email: "admin@bidgenius.com",
      passwordHash: hashPassword("admin123"),
      role: "admin",
      totalCredits: 999999,
      reservedCredits: 0,
    });
    console.log("Created admin: admin@bidgenius.com / admin123");
  }

  const bidder1Email = "alice@bidgenius.com";
  let alice = await db.select().from(usersTable).where(eq(usersTable.email, bidder1Email)).then(r => r[0]);
  if (!alice) {
    [alice] = await db.insert(usersTable).values({
      name: "Alice Johnson",
      email: bidder1Email,
      passwordHash: hashPassword("alice123"),
      role: "bidder",
      totalCredits: 1000,
      reservedCredits: 0,
    }).returning();
    console.log("Created bidder: alice@bidgenius.com / alice123");
  }

  const bidder2Email = "bob@bidgenius.com";
  let bob = await db.select().from(usersTable).where(eq(usersTable.email, bidder2Email)).then(r => r[0]);
  if (!bob) {
    [bob] = await db.insert(usersTable).values({
      name: "Bob Smith",
      email: bidder2Email,
      passwordHash: hashPassword("bob123"),
      role: "bidder",
      totalCredits: 1500,
      reservedCredits: 0,
    }).returning();
    console.log("Created bidder: bob@bidgenius.com / bob123");
  }

  const bidder3Email = "carol@bidgenius.com";
  let carol = await db.select().from(usersTable).where(eq(usersTable.email, bidder3Email)).then(r => r[0]);
  if (!carol) {
    [carol] = await db.insert(usersTable).values({
      name: "Carol White",
      email: bidder3Email,
      passwordHash: hashPassword("carol123"),
      role: "bidder",
      totalCredits: 800,
      reservedCredits: 0,
    }).returning();
    console.log("Created bidder: carol@bidgenius.com / carol123");
  }

  const now = new Date();
  const in5Mins = new Date(now.getTime() + 5 * 60 * 1000);
  const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
  const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const admin = await db.select().from(usersTable).where(eq(usersTable.email, "admin@bidgenius.com")).then(r => r[0]);

  const existingAuctions = await db.select().from(auctionsTable);
  if (existingAuctions.length === 0) {
    await db.insert(auctionsTable).values([
      {
        title: "Vintage Rolex Submariner 1965",
        description: "Presenting a rare opportunity to own the exceptional **Vintage Rolex Submariner 1965**.\n\nThis premium and exclusive timepiece represents the pinnacle of quality and craftsmanship. Renowned for its rare qualities, this watch has captivated collectors and enthusiasts alike.\n\nPlace your bid now and make this treasure yours. Auction ends soon — secure your legacy today.",
        imageUrl: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80",
        startTime: now,
        endTime: in1Hour,
        minBid: 500,
        bidIncrement: 50,
        currentBid: 500,
        status: "active",
        createdBy: admin?.id ?? 1,
      },
      {
        title: "Original Picasso Sketch – 1952",
        description: "Seize your chance to acquire the highly sought-after **Original Picasso Sketch – 1952**.\n\nThis rare and museum-quality work is a testament to Picasso's genius during his most prolific period. Authenticated and certified, this piece represents a once-in-a-lifetime acquisition for serious collectors.\n\nAct swiftly — winning bidder takes all. This gem won't wait for the hesitant.",
        imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
        startTime: now,
        endTime: in2Hours,
        minBid: 1000,
        bidIncrement: 100,
        currentBid: 1000,
        status: "active",
        createdBy: admin?.id ?? 1,
      },
      {
        title: "Rare 1957 Gibson Les Paul Custom",
        description: "Don't miss this exclusive opportunity to bid on the legendary **1957 Gibson Les Paul Custom**.\n\nThis pristine and iconic instrument is a treasure for any serious musician or collector. Only a handful of these survive in this condition, making it one of the most coveted guitars in the world.\n\nA wise investment and a timeless possession. Register your bid before time runs out.",
        imageUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80",
        startTime: tomorrow,
        endTime: in3Days,
        minBid: 2000,
        bidIncrement: 200,
        currentBid: 2000,
        status: "upcoming",
        createdBy: admin?.id ?? 1,
      },
    ]);
    console.log("Created 2 active auctions and 1 upcoming auction");
  }

  console.log("\n=== DEMO CREDENTIALS ===");
  console.log("Admin:  admin@bidgenius.com / admin123");
  console.log("Bidder: alice@bidgenius.com / alice123 (1000 credits)");
  console.log("Bidder: bob@bidgenius.com   / bob123   (1500 credits)");
  console.log("Bidder: carol@bidgenius.com / carol123 (800 credits)");
  console.log("========================\n");

  process.exit(0);
}

seed().catch(console.error);
