import { Router } from "express";
import { store } from "../store.js";

const router = Router();

router.get("/", (_req, res) => {
  const { total, enriched } = store.stats();
  res.json({ status: "ok", total, enriched });
});

export default router;
