import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { leetcode } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";

const app = new Hono();

const createSchema = z.object({
  problemName: z.string().min(1),
  problemNumber: z.number().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  topics: z.array(z.string()).optional(),
  timeMinutes: z.number().optional(),
  notes: z.string().optional(),
  solutionApproach: z.string().optional(),
});

// Log problem
app.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { topics, ...rest } = parsed.data;
  const [result] = await db
    .insert(leetcode)
    .values({
      ...rest,
      topics: topics ? JSON.stringify(topics) : null,
    })
    .returning();

  return c.json({ message: "Problem logged", id: result.id }, 201);
});

const validDifficulties = ["easy", "medium", "hard"] as const;
type LeetcodeDifficulty = typeof validDifficulties[number];

// List problems
app.get("/", async (c) => {
  const difficultyParam = c.req.query("difficulty");
  const limit = parseInt(c.req.query("limit") || "50");

  let query = db.select().from(leetcode);

  if (difficultyParam && validDifficulties.includes(difficultyParam as LeetcodeDifficulty)) {
    const difficulty = difficultyParam as LeetcodeDifficulty;
    query = query.where(eq(leetcode.difficulty, difficulty)) as typeof query;
  }

  const results = await query.orderBy(desc(leetcode.solvedDate)).limit(limit);
  return c.json(results);
});

// Stats
app.get("/stats/summary", async (c) => {
  const total = await db.select({ count: sql<number>`count(*)` }).from(leetcode);

  const byDifficulty = await db
    .select({
      difficulty: leetcode.difficulty,
      count: sql<number>`count(*)`,
    })
    .from(leetcode)
    .groupBy(leetcode.difficulty);

  return c.json({
    total: total[0].count,
    byDifficulty: Object.fromEntries(byDifficulty.map((d) => [d.difficulty, d.count])),
  });
});

export default app;
