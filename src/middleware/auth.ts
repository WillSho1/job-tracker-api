import type { Context, Next } from "hono";

/**
 * Bearer token authentication middleware.
 * Validates the Authorization header against the provided API key.
 */
export const bearerAuth = (apiKey: string) => {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
      return c.json({ error: "Missing Authorization header" }, 401);
    }

    if (authHeader !== `Bearer ${apiKey}`) {
      return c.json({ error: "Invalid API key" }, 401);
    }

    await next();
  };
};
