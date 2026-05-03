# The Tower Server

Small Fastify server for The Tower game. It serves run data from `src/engine/config.json` and picks monster moves during battle.

## What this README covers

- how to install and start the server
- how to change the game configuration
- where to find the full technical guide

For the full server flow, endpoint details, data model, endless mode behavior, and the current heroes, monsters, items, shop content, and environments, see [SERVER_README.md](./SERVER_README.md).

## Requirements

- Node.js 20+
- npm

## Install

```bash
npm install
```

## Environment setup

Copy `.env.example` to `.env` and adjust values if needed.

```env
NODE_ENV=development
PORT=3000
HTTPS_ENABLED=false
HTTPS_KEY_PATH=
HTTPS_CERT_PATH=
```

Notes:

- `PORT` controls the HTTP or HTTPS port.
- `HTTPS_ENABLED=true` requires both `HTTPS_KEY_PATH` and `HTTPS_CERT_PATH`.
- If HTTPS is off, the server runs over plain HTTP.

## Start the server

Development mode:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Default local URLs:

- `http://localhost:3000` when `HTTPS_ENABLED=false`
- `https://localhost:3000` when `HTTPS_ENABLED=true`

Quick health check:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "ok": true }
```

## Change game configuration

All game content is currently defined in [src/engine/config.json](/c:/Users/aksaa/Documents/Projects/the-tower-server/src/engine/config.json).

This file controls:

- heroes
- encounter order
- monster stats and moves
- move definitions
- item definitions
- environments
- shop inventory
- level progression
- endless mode scaling
- XP and coin reward scaling

After editing `src/engine/config.json`, restart the server if needed. In `npm run dev`, `tsx watch` should reload server code automatically, but JSON/config changes are safest to verify with a restart.

## Main endpoints

- `GET /health` returns a simple health check
- `GET /run/config` returns the full run configuration
- `POST /run/next-encounter` returns the next endless-mode encounter
- `GET /battle/monster-move` returns a monster move from a `state` query parameter
- `POST /battle/monster-move` returns a monster move from a JSON request body

## Project structure

```txt
src/
  api/routes/        Fastify routes
  config/env.ts      Environment variable parsing
  engine/config.json Game content
  engine/config.ts   Config loading and validation
  engine/gameEngine.ts
                     Run config, endless encounter generation, monster AI
  engine/types.ts    Shared data types
  app.ts             Fastify app builder
  index.ts           Server startup
```
