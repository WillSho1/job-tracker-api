import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { applications } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";

const app = new Hono();

const createSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  url: z.url().transform((u) => u.toString()).optional(),
  status: z.enum(["applied", "interviewing", "rejected", "offer", "accepted"]).default("applied"),
  salaryRange: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  status: z.enum(["applied", "interviewing", "rejected", "offer", "accepted"]).optional(),
  lastContact: z.string().optional(),
  notes: z.string().optional(),
  salaryRange: z.string().optional(),
});

// Create application
app.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  const [result] = await db.insert(applications).values(parsed.data).returning();
  return c.json({ message: "Application added", id: result.id }, 201);
});

const validStatuses = ["applied", "interviewing", "rejected", "offer", "accepted"] as const;
type ApplicationStatus = typeof validStatuses[number];

// List applications
app.get("/", async (c) => {
  const statusParam = c.req.query("status");
  const limit = parseInt(c.req.query("limit") || "50");

  let query = db.select().from(applications);

  if (statusParam && validStatuses.includes(statusParam as ApplicationStatus)) {
    const status = statusParam as ApplicationStatus;
    query = query.where(eq(applications.status, status)) as typeof query;
  }

  const results = await query.orderBy(desc(applications.appliedDate)).limit(limit);
  return c.json(results);
});

// Stats
app.get("/stats/summary", async (c) => {
  const total = await db.select({ count: sql<number>`count(*)` }).from(applications);
  
  const byStatus = await db
    .select({
      status: applications.status,
      count: sql<number>`count(*)`,
    })
    .from(applications)
    .groupBy(applications.status);

  return c.json({
    total: total[0].count,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s.count])),
  });
});

// Get single application
app.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const [result] = await db.select().from(applications).where(eq(applications.id, id));

  if (!result) {
    return c.json({ error: "Application not found" }, 404);
  }
  return c.json(result);
});

// Update application
app.patch("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  const [result] = await db
    .update(applications)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(applications.id, id))
    .returning();

  if (!result) {
    return c.json({ error: "Application not found" }, 404);
  }
  return c.json({ message: "Updated", application: result });
});

export default app;
