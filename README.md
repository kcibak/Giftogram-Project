# Giftogram Project

I made a full-stack messaging app with a React frontend, an Express API, and a MySQL database.

You can test it in two ways:
1. Through the frontend at http://localhost:5173.
2. Through API calls in Postman.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL 8
- Orchestration: Docker Compose

## Project Structure

- `giftogram-project/src` -> Frontend source
- `giftogram-project/backend/src` -> Backend source
- `giftogram-project/docker/mysql/init/001-schema.sql` -> MySQL schema initialization script

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Quick Start (Recommended: Docker)

From the workspace root:

```bash
cd giftogram-project
docker compose up --build
```

This starts:
1. MySQL at `localhost:3306`
2. API at `http://localhost:3000`
3. Frontend at `http://localhost:5173`

Frontend access (not originally listed in requirements):
- Open http://localhost:5173 in your browser.

## Reset the Database

If you want a clean schema and data reset:

```bash
cd giftogram-project
docker compose down -v
docker compose up --build
```

## API Endpoints

Public:
- `GET /` -> API running status
- `GET /health` -> health + DB status
- `POST /register` -> register user
- `POST /login` -> login user and create session token

Protected (Bearer token required):
- `GET /list_all_users`
- `POST /send_message`
- `GET /view_messages`
- `POST /block_user` (extra endpoint added)
- `POST /unblock_user` (extra endpoint added)

Auth format for protected endpoints:

```http
Authorization: Bearer <session_token>
```

### Manual validation used during development

Postman:
1. Register/login a user.
2. Copy returned session token.
3. Call protected endpoints with `Authorization: Bearer <token>`.
4. Verify message flow, user listing, and block/unblock behavior.

DBeaver:
1. Connect to MySQL at `localhost:3306`.
2. Inspect tables: `users`, `sessions`, `messages`, `user_blocks`.
3. Confirm inserts/updates after API calls (especially `user_blocks` for block/unblock).

## SQL Initialization on Docker Startup

Schema is defined in:
- `giftogram-project/docker/mysql/init/001-schema.sql`

Docker Compose mounts this file into MySQL init directory:
- `/docker-entrypoint-initdb.d/001-schema.sql`

Behavior:
- It runs automatically when the MySQL data volume is created for the first time.
- If the DB volume already exists, init scripts do not run again unless you reset with `docker compose down -v`.

## How to Evaluate the App Quickly

Option 1: Frontend flow
1. Open http://localhost:5173
2. Register/login
3. Use UI to list users and send/view messages

Option 2: API flow
1. Use Postman to hit `/register` and `/login`
2. Use token to call protected routes
3. Test `/block_user` and `/unblock_user`
