import { Router, type Request, type Response } from "express";
import { store } from "../store.js";
import type { Location, LocationType } from "../types.js";

const router = Router();
const TYPES: LocationType[] = ["airport", "capital", "bus_terminal"];

function isType(v: unknown): v is LocationType {
  return typeof v === "string" && (TYPES as string[]).includes(v);
}

router.get("/", (req: Request, res: Response) => {
  const { type, q, grouped } = req.query;
  let list = store.all();

  if (typeof type === "string") {
    if (!isType(type)) {
      return res.status(400).json({ error: "invalid_type", allowed: TYPES });
    }
    list = list.filter((l) => l.type === type);
  }

  if (typeof q === "string" && q.trim()) {
    const needle = q.trim().toLowerCase();
    list = list.filter(
      (l) =>
        l.displayName.toLowerCase().includes(needle) ||
        l.city.toLowerCase().includes(needle),
    );
  }

  res.set("Cache-Control", "public, max-age=300");

  if (grouped === "true") {
    const out: Record<LocationType, Location[]> = {
      airport: [],
      capital: [],
      bus_terminal: [],
    };
    for (const l of list) out[l.type].push(l);
    return res.json(out);
  }

  return res.json(list);
});

router.get("/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  if (typeof id !== "string" || id.length === 0) {
    return res.status(404).json({ error: "not_found" });
  }
  const item = store.byId(id);
  if (!item) return res.status(404).json({ error: "not_found" });
  res.set("Cache-Control", "public, max-age=300");
  return res.json(item);
});

export default router;
