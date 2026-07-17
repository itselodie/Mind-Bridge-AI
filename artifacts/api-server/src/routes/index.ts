import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mindbridgeRouter from "./mindbridge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mindbridgeRouter);

export default router;
