import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import { createServer } from "http";
import router from "./routes/index.js";
import { initSocket } from "./lib/socket.js";
import { startAuctionScheduler } from "./lib/auction-scheduler.js";

const app: Express = express();
const httpServer = createServer(app);

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "bidgenius-secret-key-change-in-prod",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
  },
}));

app.use("/api", router);

initSocket(httpServer);
startAuctionScheduler();

export { httpServer };
export default app;
