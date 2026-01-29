# Job Tracker API

A TypeScript sidecar API for tracking job applications, LeetCode progress, and Trello board summaries. Designed to work alongside [Khoj](https://khoj.dev) as part of a personal AI assistant platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  DigitalOcean Droplet                       │
│                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│   │    Khoj     │     │   Sidecar   │     │  PostgreSQL │   │
│   │   :42110    │────▶│    :8000    │────▶│    :5432    │   │
│   └─────────────┘     └─────────────┘     └─────────────┘   │
│         │                   │                               │
│         │                   ▼                               │
│         │             ┌───────────┐                         │
│         │             │  Trello   │                         │
│         │             │   API     │                         │
│         │             └───────────┘                         │
│         ▼                                                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Khoj** provides persistent memory, document indexing, custom agents, and AI analysis.

**This sidecar** provides structured data storage and external API integrations.

## Features

- **Job Applications**: Track applications with status, company, role, salary range, and notes
- **LeetCode Progress**: Log solved problems with difficulty, topics, and solution approaches
- **Trello Integration**: Fetch boards and generate LLM-friendly summaries for AI analysis
- **Bearer Token Auth**: Secure API access with configurable API key
- **Docker Ready**: Multi-stage Dockerfile for production deployment

## Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Node.js 20 |
| Language | TypeScript |
| Framework | [Hono](https://hono.dev) |
| ORM | [Drizzle](https://orm.drizzle.team) |
| Validation | [Zod](https://zod.dev) |
| Database | PostgreSQL 15 |
| Package Manager | pnpm |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker and Docker Compose (for database)

### Local Development

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/yourusername/job-tracker-api.git
   cd job-tracker-api
   pnpm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start the database**

   ```bash
   docker compose up db -d
   ```

4. **Run migrations**

   ```bash
   pnpm db:migrate
   ```

5. **Start the dev server**

   ```bash
   pnpm dev
   ```

   The API is now running at http://localhost:8000

### Docker Deployment

Run the entire stack (API + database) with Docker Compose:

```bash
# Build and start all services
docker compose up -d

# Run migrations (first time only)
docker compose exec api node -e "console.log('Run migrations manually or add to entrypoint')"

# View logs
docker compose logs -f api
```

## API Reference

All endpoints (except `/health`) require authentication via Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:8000/applications
```

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Returns `{ "status": "ok" }` |

### Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/applications` | Create a new application |
| GET | `/applications` | List applications (supports `?status=` and `?limit=` query params) |
| GET | `/applications/:id` | Get a single application |
| PATCH | `/applications/:id` | Update an application |
| GET | `/applications/stats/summary` | Get application statistics |

#### Create Application

```bash
curl -X POST http://localhost:8000/applications \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Acme Corp",
    "role": "Software Engineer",
    "url": "https://acme.com/jobs/123",
    "status": "applied",
    "salaryRange": "$120k-$150k",
    "location": "Remote",
    "notes": "Referred by John"
  }'
```

#### Application Statuses

- `applied` (default)
- `interviewing`
- `rejected`
- `offer`
- `accepted`

### LeetCode

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/leetcode` | Log a solved problem |
| GET | `/leetcode` | List problems (supports `?difficulty=` and `?limit=`) |
| GET | `/leetcode/stats/summary` | Get LeetCode statistics |

#### Log Problem

```bash
curl -X POST http://localhost:8000/leetcode \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "problemName": "Two Sum",
    "problemNumber": 1,
    "difficulty": "easy",
    "topics": ["array", "hash-table"],
    "timeMinutes": 15,
    "notes": "Used HashMap for O(n) solution",
    "solutionApproach": "Iterate and check complement in map"
  }'
```

### Trello

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trello/boards` | List all boards |
| GET | `/trello/boards/:id` | Get board with lists and cards |
| GET | `/trello/boards/:id/summary` | Get LLM-friendly markdown summary |
| GET | `/trello/boards/:id/recent?days=7` | Get recently modified cards |

The `/summary` and `/recent` endpoints return plain text markdown, optimized for LLM consumption.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `API_KEY` | No* | Bearer token for API authentication |
| `TRELLO_API_KEY` | No | Trello API key (from [trello.com/power-ups/admin](https://trello.com/power-ups/admin)) |
| `TRELLO_TOKEN` | No | Trello OAuth token |
| `PORT` | No | Server port (default: 8000) |

*If `API_KEY` is not set, authentication is disabled (not recommended for production).

## Development Commands

```bash
pnpm dev          # Start dev server with hot reload
pnpm build        # Compile TypeScript to dist/
pnpm start        # Run compiled JavaScript
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run pending migrations
pnpm db:studio    # Open Drizzle Studio GUI
```

## Project Structure

```
src/
├── index.ts              # App entry point, middleware setup
├── middleware/
│   └── auth.ts           # Bearer token authentication
├── lib/
│   └── trello.ts         # Trello API client
├── routes/
│   ├── applications.ts   # Job application endpoints
│   ├── leetcode.ts       # LeetCode tracking endpoints
│   └── trello.ts         # Trello integration endpoints
└── db/
    ├── index.ts          # Database connection
    └── schema.ts         # Drizzle schema definitions
```

## Deployment Notes

### DigitalOcean Droplet

1. Provision a $12/mo droplet (2GB RAM recommended)
2. Install Docker and Docker Compose
3. Clone this repository
4. Create production `.env` with secure `API_KEY`
5. Run `docker compose up -d`
6. Set up Caddy or nginx for HTTPS reverse proxy

### Caddy Example

```caddyfile
api.yourdomain.com {
    reverse_proxy localhost:8000
}
```

## License

ISC
