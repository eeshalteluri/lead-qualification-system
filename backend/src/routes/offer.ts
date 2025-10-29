import { Router } from "express";
import { createOffer } from "../controllers/offerController"

const router = Router();

router.post("/", createOffer);

export default router;
