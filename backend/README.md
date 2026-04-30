# Order Management Backend

A production-ready backend for the assessment's food delivery order management feature. It includes:

- Fastify REST APIs
- MySQL persistence with direct SQL
- Socket.IO order status updates
- Auto-seeded menu data
- Simulated order progression
- Unit and route-level tests with Vitest

## Tech Stack

- Node.js
- JavaScript (ESM)
- Fastify
- MySQL
- mysql2/promise
- Socket.IO
- Vitest

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update `DATABASE_URL`
3. Keep `CORS_ORIGIN` pointed at the frontend origin

## Local Run

```bash
npm install
npm run dev
```

The API starts on `http://localhost:4000` by default.
On startup it can auto-create tables and seed menu data from `.env` alone.

## Useful Scripts

```bash
npm run dev
npm run build
npm run start
npm run test
npm run test:coverage
npm run db:migrate
npm run db:seed
npm run db:setup
```

For EC2, the default path can be just:

```bash
npm install
npm run start
```

That works as long as `.env` is present and `AUTO_MIGRATE_DB=true`.

## API Endpoints

- `GET /health`
- `GET /api/menu`
- `GET /api/orders`
- `GET /api/orders/:orderId`
- `POST /api/orders`
- `PATCH /api/orders/:orderId`
- `PATCH /api/orders/:orderId/status`
- `DELETE /api/orders/:orderId`

## WebSocket Events

Client events:

- `order:subscribe` with `orderId`
- `order:unsubscribe` with `orderId`

Server events:

- `order.status.updated`

## Status Simulation

When `ORDER_STATUS_SIMULATION_ENABLED=true`, the backend progresses orders like this:

`RECEIVED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED`

This keeps the demo flow strong for interviews and frontend demos without needing an admin panel first.

## Deployment Notes

Recommended direct deployment:

- Frontend: Netlify
- Backend: AWS App Runner or EC2
- Database: AWS RDS MySQL

Deployment flow:

1. Set environment variables
2. Run `npm install`
3. Start with `npm run start`

By default the backend will:

- ensure the MySQL schema exists
- seed menu data if the menu table is empty
- start the API and WebSocket server
