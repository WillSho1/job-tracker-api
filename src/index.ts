import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import "dotenv/config";

import { bearerAuth } from "./middleware/auth.js";
import applications from "./routes/applications.js";
import leetcodeRoutes from "./routes/leetcode.js";
import trelloRoutes from "./routes/trello.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

// Public health check endpoint (no auth required)
app.get("/health", (c) => c.json({ status: "ok" }));

// Apply bearer auth to all API routes
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.warn("WARNING: API_KEY not set. Authentication is disabled.");
}

if (apiKey) {
  app.use("/applications/*", bearerAuth(apiKey));
  app.use("/leetcode/*", bearerAuth(apiKey));
  app.use("/trello/*", bearerAuth(apiKey));
}

app.route("/applications", applications);
app.route("/leetcode", leetcodeRoutes);
app.route("/trello", trelloRoutes);

const port = parseInt(process.env.PORT || "8000");

console.log(`Server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
