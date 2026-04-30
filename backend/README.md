# Order Management Backend

JavaScript backend for the food delivery order management assessment.

This service exposes menu and order APIs, stores data in MySQL, pushes live order status updates through Socket.IO, and auto-prepares the local environment so the project is easy to run for a reviewer or interviewer.

## What This Backend Includes

- REST APIs for menu and order management
- MySQL persistence using `mysql2/promise`
- WebSocket-based live order tracking with Socket.IO
- automatic `.env` creation from `.env.example` if `.env` is missing
- automatic database and table creation on startup
- automatic menu seeding when the menu table is empty
- unit and integration tests with Vitest

## Tech Stack

- Node.js 20+
- JavaScript with ESM modules
- Fastify
- MySQL
- Socket.IO
- Zod
- Vitest

## Project Structure

```text
backend/
├── database/
│   └── schema.sql
├── scripts/
│   ├── ensure-env.js
│   ├── migrate.js
│   └── seed.js
├── src/
│   ├── bootstrap/
│   ├── common/
│   ├── config/
│   ├── database/
│   ├── lib/
│   └── modules/
├── tests/
│   ├── integration/
│   └── unit/
├── .env.example
├── package.json
└── README.md
```

## How The App Starts

When you run `npm run dev` or `npm start`, the backend follows this flow:

1. Check whether `.env` exists.
2. If `.env` is missing, copy `.env.example` into `.env`.
3. Load environment variables from `.env`.
4. Connect to MySQL.
5. Create the database if needed.
6. Create all required tables from `database/schema.sql`.
7. Seed menu data if the `menu_items` table is empty.
8. Start the HTTP API and Socket.IO server.
9. Start the order status simulator if it is enabled.

This keeps the local and EC2 setup very small. In most cases, only the `.env` values need to be adjusted.

## Prerequisites

- Node.js `20` or newer
- MySQL running locally or remotely
- a MySQL user with permission to:
  - connect to MySQL
  - create a database when `AUTO_MIGRATE_DB=true`
  - create tables
  - read and write application data

## Quick Start

From the `backend/` folder:

```bash
npm install
npm run dev
```

Default local URL:

```text
http://localhost:4000
```

If `.env` is missing, it is created automatically from `.env.example`. After that, update the database values in `.env` if your MySQL credentials are different from the example values.

## Environment Variables

The backend uses `.env` for local and server configuration.

### Required for most setups

- `DB_HOST`: MySQL host
- `DB_PORT`: MySQL port
- `DB_NAME`: database name
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password

### Common app settings

- `NODE_ENV`: `development`, `test`, or `production`
- `HOST`: API bind host
- `PORT`: API port
- `CORS_ORIGIN`: allowed frontend origin
- `LOG_LEVEL`: Fastify log level

### Runtime automation flags

- `AUTO_MIGRATE_DB`: create database and tables automatically
- `AUTO_SEED_MENU`: insert seed menu data if empty
- `ORDER_STATUS_SIMULATION_ENABLED`: enable automatic status progression
- `ORDER_STATUS_STEP_MS`: minimum wait between each status transition
- `STATUS_POLL_INTERVAL_MS`: how often the scheduler checks pending orders
- `DB_POOL_LIMIT`: MySQL connection pool size

### Example `.env`

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=4000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=order_management
DB_USER=root
DB_PASSWORD=your_mysql_password

CORS_ORIGIN=http://localhost:5173
AUTO_MIGRATE_DB=true
AUTO_SEED_MENU=true
ORDER_STATUS_SIMULATION_ENABLED=true
ORDER_STATUS_STEP_MS=15000
STATUS_POLL_INTERVAL_MS=5000
DB_POOL_LIMIT=10
LOG_LEVEL=info
```

Notes:

- `CORS_ORIGIN` supports comma-separated URLs.
- `.env` is only auto-created when missing.
- an existing `.env` is never overwritten.

## Available Scripts

Run these from `backend/`.

```bash
npm run dev
npm run start
npm run build
npm run test
npm run test:coverage
npm run db:migrate
npm run db:seed
npm run db:setup
```

What they do:

- `npm run dev`: create `.env` if needed, load it, and start the backend in watch mode
- `npm run start`: create `.env` if needed, load it, and start the backend normally
- `npm run build`: placeholder only, no build step is required for this JavaScript backend
- `npm run test`: run the Vitest test suite
- `npm run test:coverage`: run tests with coverage
- `npm run db:migrate`: create the database and tables from `database/schema.sql`
- `npm run db:seed`: seed the menu catalog
- `npm run db:setup`: run migrate and seed together

`npm run db:migrate` and `npm run db:seed` also create `.env` automatically if it is missing.

## API Overview

### Health

- `GET /health`

Returns a simple status response so hosting platforms or interviewers can confirm the backend is alive.

### Menu

- `GET /api/menu`

Returns the seeded menu items available for ordering.

### Orders

- `GET /api/orders`
- `GET /api/orders/:orderId`
- `POST /api/orders`
- `PATCH /api/orders/:orderId`
- `PATCH /api/orders/:orderId/status`
- `DELETE /api/orders/:orderId`

## Example Create Order Payload

`POST /api/orders`

```json
{
  "customerName": "Abhishek Kumar",
  "customerAddress": "221B Baker Street, London, NW1 6XE",
  "customerPhone": "+91 9876543210",
  "items": [
    {
      "menuItemId": "menu-margherita-pizza",
      "quantity": 2
    },
    {
      "menuItemId": "menu-garlic-bread",
      "quantity": 1
    }
  ]
}
```

Important validation rules:

- customer name must be at least 2 characters
- address must be at least 10 characters
- phone number must match the allowed phone pattern
- each item must include a valid `menuItemId`
- quantity must be between `1` and `20`
- the order must contain at least one item

## Order Status Flow

Supported statuses:

```text
RECEIVED
PREPARING
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
```

Normal automatic progression:

```text
RECEIVED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED
```

Business rules:

- order details can be edited only while the order is `RECEIVED` or `PREPARING`
- cancellation is allowed only while the order is `RECEIVED` or `PREPARING`
- once an order is `DELIVERED` or `CANCELLED`, it becomes terminal

## WebSocket Events

The backend uses Socket.IO for live tracking.

### Client emits

- `order:subscribe`
- `order:unsubscribe`

The client joins an order-specific room using the `orderId`.

### Server emits

- `order.status.updated`

The payload is the latest order object after a status change.

## Manual Database Commands

If you want to prepare the database before starting the server:

```bash
npm run db:migrate
npm run db:seed
```

This is optional when `AUTO_MIGRATE_DB=true` and `AUTO_SEED_MENU=true`, because startup already handles both.

## Testing

Run:

```bash
npm test
```

Current test coverage focuses on:

- order pricing helpers
- order status transition rules
- API route behavior

## AWS Deployment Notes

Recommended deployment for this project:

- Frontend: Netlify
- Backend: AWS EC2 or AWS App Runner
- Database: AWS RDS MySQL

### Minimal EC2 Flow

1. Clone the repository on the EC2 instance.
2. Go to `backend/`.
3. Run `npm install`.
4. Review `.env` values.
5. Run `npm start`.

Because the backend auto-creates `.env`, auto-prepares the schema, and auto-seeds the menu, the deployment setup stays simple.

### Production Advice

- set `NODE_ENV=production`
- set `CORS_ORIGIN` to your Netlify domain
- use an RDS MySQL user with the correct permissions
- if the DB user cannot create databases, create the database manually and set `AUTO_MIGRATE_DB=false`

## Troubleshooting

### Access denied for user

If you see a MySQL error like `Access denied for user 'root'@'localhost'`:

- check `DB_USER`
- check `DB_PASSWORD`
- confirm MySQL is running
- confirm the user has permission to connect from that host

### Port already in use

If port `4000` is already occupied, change:

```env
PORT=4000
```

to another port in `.env`.

### Frontend cannot connect

Check:

- `CORS_ORIGIN` matches the frontend URL
- the frontend uses the correct API base URL
- the frontend uses the correct Socket.IO server URL
