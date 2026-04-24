# the-tower-server

Minimal backend boilerplate for a turn-based RPG server.

## Stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- dotenv
- zod

## Install

```bash
npm install
```

## Configure

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Update `DATABASE_URL` so it points to your PostgreSQL database.

## Run Migrations

```bash
npm run migrate
```

This creates the initial `sessions` table.

## Development

```bash
npm run dev
```

The server starts on `PORT` from `.env` or `3000` by default.

## Production Build

```bash
npm run build
npm start
```

## Endpoints

- `GET /health`
- `POST /api/sessions`
