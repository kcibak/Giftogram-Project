# Giftogram Technical Assessment

**Candidate:** Kira C
**Estimated Time Spent:** 5–8 hours

---

## Overview

This project is a RESTful API backend for a 1:1 messaging application, built according to the Giftogram technical assessment requirements.

The application supports:

- User registration
- User authentication (login)
- Sending messages between users
- Viewing message history between two users
- Listing all registered users (excluding the requester)

Additionally, I implemented a **user blocking system** to prevent unwanted interactions.

A minimal frontend was included to simplify testing.

---

## Tech Stack

### Backend
- Node.js
- Express
- MySQL 8
- REST API (JSON responses)

### Frontend (Optional)
- React
- Vite

### Infrastructure & Tooling
- Docker + Docker Compose
- Postman (API testing)
- DBeaver (database inspection)
- VS Code
- GitHub + GitHub Copilot
- Codex
- CodeRabbit (code review)
- ChatGPT (planning and architecture)

---

## Project Structure
```
giftogram-project/
├── src/                      # Frontend (React)
├── backend/src/              # Backend (Express API)
├── docker/mysql/init/
│   └── 001-schema.sql        # DB schema
└── docker-compose.yml
```

---

## Setup Instructions

### Prerequisites
- Node.js 20+
- npm 10+
- Docker + Docker Compose (or local MySQL 8 for non-Dockerized setup)

### Run with Docker (Recommended)
```bash
cd giftogram-project
docker compose up --build
```

This starts three services:

| Service | URL | Notes |
|---------|-----|-------|
| MySQL | `localhost:3306` | Initialized with schema from `docker/mysql/init/001-schema.sql` |
| Backend API | `http://localhost:3000` | Express server with authentication and messaging endpoints |
| Frontend | `http://localhost:5173` | Vite dev server with React tester UI |

### Run Locally (Development)

Install dependencies:
```bash
cd giftogram-project
npm install
```

Start the backend (from root):
```bash
npm run dev:backend
```

In another terminal, start the frontend:
```bash
npm run dev
```

The backend runs on `http://localhost:3000` and the frontend on `http://localhost:5173`.

### Database Initialization

Schema is defined in `docker/mysql/init/001-schema.sql` and runs automatically on first Docker container startup.

To reset the database (Docker):
```bash
docker compose down -v
docker compose up --build
```

---

## API Endpoints

### Public

| Method | Endpoint    | Description          |
|--------|-------------|----------------------|
| GET    | `/`         | API status           |
| GET    | `/health`   | Health + DB status   |
| POST   | `/register` | Register a user      |
| POST   | `/login`    | Authenticate a user  |

### Protected (Bearer Token Required)

| Method | Endpoint | Description | Required Input |
|--------|----------|-------------|---------------:|
| GET | `/list_all_users` | List all users (excludes requester) | Query: `requester_user_id` (UUID) |
| POST | `/send_message` | Send a message to a user | Body: `sender_user_id`, `receiver_user_id` (UUID), `message` |
| GET | `/view_messages` | View conversation history | Query: `user_id_a`, `user_id_b` (both UUID) |
| POST | `/block_user` | Block a user | Body: `blocked_user_id` (UUID) |
| POST | `/unblock_user` | Unblock a user | Body: `blocked_user_id` (UUID) |

### Auth Format
```
Authorization: Bearer <session_token>
```

---

## How to Test

### Option 1: Frontend (Recommended for Quick Demo)

1. Start the stack: `docker compose up --build` (or `npm run dev` + `npm run dev:backend` locally)
2. Open `http://localhost:5173` in a browser
3. Register two test accounts
4. Log in with the first account, use the UI to:
   - View all registered users (excluding yourself)
   - Send a message to another user
   - View conversation history
   - Block/unblock a user and verify messaging is prevented

### Option 2: API (Postman or `curl`)

1. Get the API health:
   ```bash
   curl http://localhost:3000/health
   ```

2. Register a user:
   ```bash
   curl -X POST http://localhost:3000/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234","first_name":"Test","last_name":"User"}'
   ```

3. Log in and copy the returned `token`:
   ```bash
   curl -X POST http://localhost:3000/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234"}'
   ```

4. Use the token in subsequent protected requests:
   ```bash
   curl http://localhost:3000/list_all_users?requester_user_id=<user_id> \
     -H "Authorization: Bearer <token>"
   ```

5. Test blocking, messaging, and conversation viewing with the required query/body parameters

### Option 3: Database Validation (DBeaver or MySQL CLI)

1. Connect to `localhost:3306` with credentials from `.env`
2. Inspect the following tables:
   - `users` — registered accounts and profiles
   - `sessions` — active and expired tokens
   - `messages` — conversation history (indexed by sender/receiver/epoch for performance)
   - `user_blocks` — blocking relationships (unique constraint prevents duplicates)

---

## Development Process

1. **Schema Design** — Designed a minimal relational schema covering `users`, `sessions`, `messages`, and `user_blocks` with composite indexes for query performance
2. **Core API** — Implemented all five required endpoints: `register`, `login`, `send_message`, `view_messages`, `list_all_users` with input validation
3. **Authentication** — Session-based stateful authentication with 64-character hex tokens, hashed with SHA256 server-side, validated by Bearer token middleware
4. **Messaging** — 1:1 messaging only, sender and receiver identified by public UUIDs, messages stored with Unix epoch timestamps and retrieved in chronological order
5. **Blocking System** — Bonus feature: prevents both sending and viewing messages in either direction when either user blocks the other (implementation in `sendMessage` and `viewMessages` services)
6. **Frontend Tester** — Minimal React UI to simplify integration testing and demonstrate the API (login, register, user list, message send/view, block/unblock)
7. **Docker Orchestration** — Multi-stage Dockerfile and Docker Compose for reproducible local and evaluation setups with health checks

---

## Error Handling

All error responses follow the required format:
```json
{
  "error_code": 1101,
  "error_title": "Login Failure",
  "error_message": "Email or password was invalid."
}
```

Common error codes include:
- `1001` — Validation error (400)
- `1002` — Email already registered (409)
- `1101` — Login failure (401)
- `1201`/`1202` — View messages failures (404/500)
- `1301`/`1302` — Send message failures (404/500)
- `1601`/`1602`/`1603` — Auth errors: missing token, invalid session, expired session (401)
- `1701`–`1706` — Block/unblock errors (400–500)
- `1500` — Internal server error (500)

---

## Environment Variables

The application requires database credentials (all required when running locally or in Docker). These are validated in [backend/src/config/db.js](giftogram-project/backend/src/config/db.js):

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DB_HOST` | string | **required** | MySQL hostname (`db` in Docker, `localhost` locally) |
| `DB_USER` | string | **required** | MySQL user |
| `DB_PASSWORD` | string | **required** | MySQL password |
| `DB_NAME` | string | **required** | MySQL database name |
| `DB_PORT` | number | 3306 | MySQL port |
| `PORT` | number | 3000 | Backend server port |
| `SESSION_DURATION_DAYS` | number | 7 | Session token TTL in days |
| `VITE_API_BASE_URL` | string | `http://localhost:3000` | Frontend API base URL (Docker only) |
| `MYSQL_ROOT_PASSWORD` | string | **required** | MySQL root password (Docker compose only) |
| `MYSQL_DATABASE` | string | giftogram_db | Database name (Docker compose only) |

See [.env.example](giftogram-project/.env.example) for a template.

---

## Design Decisions

- **Session Tokens over JWT** — Simpler to implement and easier to manage at this scope
- **Minimal Schema** — Focused strictly on required functionality
- **Dockerized Environment** — Ensures consistent setup and easy evaluation
- **1:1 Messaging Only** — Keeps logic simple and aligned with requirements

---

## Features & Limitations

### Implemented
- User registration with email validation (RFC 5322–like) and secure password hashing (scrypt)
- Session-based stateful authentication with 7-day token expiry (configurable via `SESSION_DURATION_DAYS`)
- 1:1 messaging with chronological ordering (Unix epoch timestamps)
- User listing with pagination (limit/offset) and optional `exclude_blocked` filtering
- Bidirectional user blocking: prevents both sending and viewing messages in either direction
- RESTful API with standardized error response format (error_code, error_title, error_message)
- Minimal React frontend for testing (login, register, user list, message send/view, block/unblock)
- Full Docker + Docker Compose setup with health checks and volume persistence

### Not Implemented
- Message deletion or editing
- Password reset or email verification
- Read receipts or typing indicators
- Rate limiting or brute-force protection
- Token rotation on each request (tokens static until expiry)
- WebSocket/real-time messaging
- Logout endpoint (tokens remain valid until expiry; client-side token clearing)
- Message pagination (entire conversation history retrieved in one request)

---

## Suggested Improvements

### Security
- Implement rate limiting to prevent brute-force attacks on `/login` and `/register`
- Add token rotation: generate and return a new token on each authenticated request
- Implement token revocation on explicit logout (delete row from `sessions` table)
- Enforce stronger password policies (e.g., require uppercase, special characters)
- Add HTTPS/TLS in production

### API & Database
- Implement cursor-based pagination for `/view_messages` to handle large conversation histories
- Add optional sorting and filtering parameters to `/list_all_users` (e.g., by name, email)
- Standardize success response format across all endpoints (currently only errors are structured)
- Add expiration cleanup job to remove expired sessions from the database automatically

### Usability & Frontend
- Add real-time typing indicators (requires WebSocket or Server-Sent Events)
- Display human-readable message timestamps (currently Unix epoch only)
- Add loading states and optimistic UI updates for message send
- Improve user search and discovery on the frontend

### Architecture & Observability
- Add structured logging with timestamp, request ID, user context
- Implement request/response body logging for debugging
- Add APM (Application Performance Monitoring) integration
- Migrate to JWT with refresh tokens for stateless API (if scalability becomes critical)

---

## Summary

This project fulfills all five required backend specifications (registration, login, messaging, user listing, and conversation viewing) using a clean, minimal architecture. The implementation prioritizes correctness over feature completeness:

- **Session-based authentication** with 7-day expiry (configurable) and server-side token hashing
- **1:1 messaging** with bidirectional blocking that prevents both sending and viewing messages
- **RESTful API** with standardized error responses and Bearer token authentication
- **Dockerized production-ready setup** with MySQL 8, Express 5, and automated health checks
- **Minimal React tester frontend** to simplify integration testing and demonstrate the API

The codebase uses a modular service/repository pattern for separation of concerns, includes comprehensive input validation, and provides a single `docker compose up --build` command for instant evaluation. The blocking system (bonus) and frontend are included as practical demonstrations of considerations beyond the base requirements.