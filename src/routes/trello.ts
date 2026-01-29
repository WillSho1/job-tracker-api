import { Hono } from "hono";
import {
  fetchBoards,
  fetchBoard,
  fetchRecentCards,
  formatBoardSummary,
  formatRecentCardsSummary,
} from "../lib/trello.js";

const app = new Hono();

/**
 * GET /trello/boards
 * List all boards for the authenticated Trello user
 */
app.get("/boards", async (c) => {
  try {
    const boards = await fetchBoards();
    return c.json(boards);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch boards";
    return c.json({ error: message }, 500);
  }
});

/**
 * GET /trello/boards/:id
 * Get a single board with all lists and cards
 */
app.get("/boards/:id", async (c) => {
  const boardId = c.req.param("id");

  try {
    const board = await fetchBoard(boardId);
    return c.json(board);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch board";
    return c.json({ error: message }, 500);
  }
});

/**
 * GET /trello/boards/:id/summary
 * Get an LLM-friendly markdown summary of the board
 */
app.get("/boards/:id/summary", async (c) => {
  const boardId = c.req.param("id");

  try {
    const board = await fetchBoard(boardId);
    const summary = formatBoardSummary(board);

    // Return as plain text for easy LLM consumption
    return c.text(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch board summary";
    return c.json({ error: message }, 500);
  }
});

/**
 * GET /trello/boards/:id/recent?days=7
 * Get cards modified within the last N days (default: 7)
 */
app.get("/boards/:id/recent", async (c) => {
  const boardId = c.req.param("id");
  const days = parseInt(c.req.query("days") || "7");

  try {
    // Fetch board name for the summary
    const board = await fetchBoard(boardId);
    const recentCards = await fetchRecentCards(boardId, days);

    // Check if client wants JSON or text
    const acceptHeader = c.req.header("Accept") || "";
    if (acceptHeader.includes("application/json")) {
      return c.json({
        boardId,
        boardName: board.name,
        days,
        cards: recentCards,
      });
    }

    // Default to LLM-friendly text
    const summary = formatRecentCardsSummary(board.name, recentCards, days);
    return c.text(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch recent cards";
    return c.json({ error: message }, 500);
  }
});

export default app;
