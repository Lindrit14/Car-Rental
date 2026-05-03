import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { makeApp } from "../src/app.js";
import { store } from "../src/store.js";

describe("locations API", () => {
  beforeAll(async () => {
    await store.init({ apiKey: "" });
  });

  const app = makeApp({ allowedOrigins: [] });

  it("GET /api/locations returns the full curated list", async () => {
    const res = await request(app).get("/api/locations");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(20);
    for (const item of res.body) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("displayName");
      expect(["airport", "capital", "bus_terminal"]).toContain(item.type);
      expect(item.country).toBe("AT");
    }
  });

  it("GET /api/locations?type=airport returns only airports", async () => {
    const res = await request(app).get("/api/locations?type=airport");
    expect(res.status).toBe(200);
    expect(res.body.every((l: { type: string }) => l.type === "airport")).toBe(true);
    expect(res.body.length).toBe(6);
  });

  it("GET /api/locations?type=foo returns 400", async () => {
    const res = await request(app).get("/api/locations?type=foo");
    expect(res.status).toBe(400);
  });

  it("GET /api/locations?grouped=true returns grouped object", async () => {
    const res = await request(app).get("/api/locations?grouped=true");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("airport");
    expect(res.body).toHaveProperty("capital");
    expect(res.body).toHaveProperty("bus_terminal");
  });

  it("GET /api/locations?q=salz filters by substring", async () => {
    const res = await request(app).get("/api/locations?q=salz");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const l of res.body) {
      const hay = `${l.displayName} ${l.city}`.toLowerCase();
      expect(hay.includes("salz")).toBe(true);
    }
  });

  it("GET /api/locations/:id returns one entry", async () => {
    const res = await request(app).get("/api/locations/vie-airport");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("vie-airport");
    expect(res.body.displayName).toBe("Vienna International Airport (VIE)");
  });

  it("GET /api/locations/:id returns 404 for unknown id", async () => {
    const res = await request(app).get("/api/locations/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("GET /healthz reports stats", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.total).toBeGreaterThan(0);
  });
});
