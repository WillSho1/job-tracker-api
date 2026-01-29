/**
 * Trello API client for fetching boards, lists, and cards.
 * Docs: https://developer.atlassian.com/cloud/trello/rest/
 */

const TRELLO_API_BASE = "https://api.trello.com/1";

interface TrelloCredentials {
  apiKey: string;
  token: string;
}

export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  url: string;
  closed: boolean;
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  dueComplete: boolean;
  closed: boolean;
  idList: string;
  labels: TrelloLabel[];
  dateLastActivity: string;
  url: string;
}

export interface BoardWithDetails extends TrelloBoard {
  lists: TrelloList[];
  cards: TrelloCard[];
}

function getCredentials(): TrelloCredentials {
  const apiKey = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_TOKEN;

  if (!apiKey || !token) {
    throw new Error("TRELLO_API_KEY and TRELLO_TOKEN must be set in environment variables");
  }

  return { apiKey, token };
}

function buildUrl(path: string, params: Record<string, string> = {}): string {
  const { apiKey, token } = getCredentials();
  const url = new URL(`${TRELLO_API_BASE}${path}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("token", token);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

async function trelloFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = buildUrl(path, params);
  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Trello API error: ${response.status} - ${text}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch all boards for the authenticated user
 */
export async function fetchBoards(): Promise<TrelloBoard[]> {
  return trelloFetch<TrelloBoard[]>("/members/me/boards", {
    filter: "open",
    fields: "id,name,desc,url,closed",
  });
}

/**
 * Fetch a single board with its lists and cards
 */
export async function fetchBoard(boardId: string): Promise<BoardWithDetails> {
  const [board, lists, cards] = await Promise.all([
    trelloFetch<TrelloBoard>(`/boards/${boardId}`, {
      fields: "id,name,desc,url,closed",
    }),
    trelloFetch<TrelloList[]>(`/boards/${boardId}/lists`, {
      filter: "open",
      fields: "id,name,closed,pos",
    }),
    trelloFetch<TrelloCard[]>(`/boards/${boardId}/cards`, {
      fields: "id,name,desc,due,dueComplete,closed,idList,labels,dateLastActivity,url",
    }),
  ]);

  return { ...board, lists, cards };
}

/**
 * Fetch cards modified within the last N days
 */
export async function fetchRecentCards(boardId: string, days: number = 7): Promise<TrelloCard[]> {
  const cards = await trelloFetch<TrelloCard[]>(`/boards/${boardId}/cards`, {
    fields: "id,name,desc,due,dueComplete,closed,idList,labels,dateLastActivity,url",
  });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return cards.filter((card) => new Date(card.dateLastActivity) >= cutoffDate);
}

/**
 * Format a board with its lists and cards into an LLM-friendly markdown summary
 */
export function formatBoardSummary(board: BoardWithDetails): string {
  const lines: string[] = [];

  lines.push(`# Board: ${board.name}`);
  if (board.desc) {
    lines.push("");
    lines.push(board.desc);
  }
  lines.push("");

  // Sort lists by position
  const sortedLists = [...board.lists].sort((a, b) => a.pos - b.pos);

  for (const list of sortedLists) {
    const listCards = board.cards.filter((card) => card.idList === list.id && !card.closed);

    if (listCards.length === 0) {
      continue;
    }

    lines.push(`## List: ${list.name}`);
    lines.push("");

    for (const card of listCards) {
      lines.push(`- **${card.name}**`);

      if (card.due) {
        const dueDate = new Date(card.due).toLocaleDateString();
        const status = card.dueComplete ? "(completed)" : "";
        lines.push(`  - Due: ${dueDate} ${status}`);
      }

      if (card.labels.length > 0) {
        const labelNames = card.labels.map((l) => l.name || l.color).join(", ");
        lines.push(`  - Labels: ${labelNames}`);
      }

      if (card.desc) {
        // Truncate long descriptions
        const desc = card.desc.length > 200 ? card.desc.slice(0, 200) + "..." : card.desc;
        lines.push(`  - ${desc.replace(/\n/g, " ")}`);
      }

      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Format recent cards into an LLM-friendly markdown summary
 */
export function formatRecentCardsSummary(
  boardName: string,
  cards: TrelloCard[],
  days: number
): string {
  const lines: string[] = [];

  lines.push(`# Recent Activity: ${boardName}`);
  lines.push(`Cards modified in the last ${days} days:`);
  lines.push("");

  if (cards.length === 0) {
    lines.push("No recent activity.");
    return lines.join("\n");
  }

  // Sort by last activity, most recent first
  const sortedCards = [...cards].sort(
    (a, b) => new Date(b.dateLastActivity).getTime() - new Date(a.dateLastActivity).getTime()
  );

  for (const card of sortedCards) {
    const activityDate = new Date(card.dateLastActivity).toLocaleDateString();
    lines.push(`- **${card.name}** (${activityDate})`);

    if (card.labels.length > 0) {
      const labelNames = card.labels.map((l) => l.name || l.color).join(", ");
      lines.push(`  - Labels: ${labelNames}`);
    }

    if (card.desc) {
      const desc = card.desc.length > 150 ? card.desc.slice(0, 150) + "..." : card.desc;
      lines.push(`  - ${desc.replace(/\n/g, " ")}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}
