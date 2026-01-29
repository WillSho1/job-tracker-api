import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import "dotenv/config";

import applications from "./routes/applications.js";
import leetcodeRoutes from "./routes/leetcode.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/applications", applications);
app.route("/leetcode", leetcodeRoutes);

const port = parseInt(process.env.PORT || "8000");

console.log(`Server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
