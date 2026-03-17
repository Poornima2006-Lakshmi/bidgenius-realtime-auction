import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import auctionsRouter from "./auctions.js";
import adminRouter from "./admin.js";
import usersRouter from "./users.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(auctionsRouter);
router.use(adminRouter);
router.use(usersRouter);

export default router;
