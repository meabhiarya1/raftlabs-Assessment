# Order Management Backend

Backend for the food delivery assessment.

The backend is now organized in a clean layered flow:

```text
route -> middleware -> controller -> service -> model -> database
```

This keeps the code easier to read, explain, and extend.

## Stack

- Node.js 20+
- Fastify
- MySQL
- Socket.IO
- Zod
- Vitest

## Folder Structure

```text
backend/
├── database/
│   └── schema.sql
├── scripts/
│   ├── ensure-env.js
│   ├── migrate.js
│   └── seed.js
├── src/
│   ├── associations/
│   ├── bootstrap/
│   ├── common/
│   ├── config/
│   ├── controllers/
│   ├── database/
│   ├── domain/
│   ├── middleware/
│   ├── models/
│   ├── realtime/
│   ├── routes/
│   ├── seeders/
│   ├── services/
│   ├── validators/
│   ├── app.js
│   └── server.js
├── tests/
│   ├── integration/
│   └── unit/
├── .env
├── .env.example
├── package.json
└── README.md
```

## Request Flow

### 1. Routes

Routes only define endpoints.

- [menu.routes.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/routes/menu.routes.js)
- [order.routes.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/routes/order.routes.js)

### 2. Middleware

All `/api/*` routes are protected by API key middleware.

- [api-key.middleware.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/middleware/api-key.middleware.js)

The client must send:

```text
x-api-key: your_api_key
```

### 3. Controllers

Controllers handle request/response and validation handoff.

- [menu.controller.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/controllers/menu.controller.js)
- [order.controller.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/controllers/order.controller.js)

### 4. Services

Services contain the business logic.

- [menu.service.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/services/menu.service.js)
- [order.service.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/services/order.service.js)

### 5. Models

Models contain direct SQL and database operations.

- [menu-item.model.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/models/menu-item.model.js)
- [order.model.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/models/order.model.js)
- [order-item.model.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/models/order-item.model.js)
- [order-status-history.model.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/models/order-status-history.model.js)

### 6. Associations

Associations are stored as readable metadata for the model relationships.

- [index.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/associations/index.js)
- [menu.associations.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/associations/menu.associations.js)
- [order.associations.js](/Users/abhishekkumar/Desktop/raftlabs-Assessment/backend/src/associations/order.associations.js)

## What The Backend Does

- returns menu items
- creates orders
- lists orders
- returns a single order with items and status history
- updates order details
- updates order status
- cancels an order
- simulates live order status progression
- pushes real-time status updates through Socket.IO

## Environment Variables

Important values in `.env`:

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=4000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=order_management
DB_USER=root
DB_PASSWORD=your_mysql_password

API_KEY=development-api-key
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

- `.env` is auto-created from `.env.example` if missing
- existing `.env` is never overwritten
- all `/api/*` routes require `x-api-key`

## Local Run

From `backend/`:

```bash
npm install
npm run dev
```

Default URL:

```text
http://localhost:4000
```

## Scripts

```bash
npm run dev
npm run start
npm run test
npm run test:coverage
npm run db:migrate
npm run db:seed
npm run db:setup
```

## Startup Flow

When the app starts:

1. `.env` is created if missing
2. environment variables are loaded
3. MySQL connection is prepared
4. database and tables are created if enabled
5. menu is seeded if enabled
6. API server starts
7. Socket.IO starts
8. order status simulation starts

## API Routes

Public:

- `GET /health`

Protected with `x-api-key`:

- `GET /api/menu`
- `GET /api/orders`
- `GET /api/orders/:orderId`
- `POST /api/orders`
- `PATCH /api/orders/:orderId`
- `PATCH /api/orders/:orderId/status`
- `DELETE /api/orders/:orderId`

## Real-Time Events

Client emits:

- `order:subscribe`
- `order:unsubscribe`

Server emits:

- `order.status.updated`

## Tests

Run:

```bash
npm test
```

Current tests cover:

- order pricing helpers
- order status rules
- protected API route behavior
- order creation validation

## Deployment Note

For deployment, only `.env` values need to be set correctly on the server.

Recommended production setup:

- frontend on Netlify
- backend on EC2 or App Runner
- database on AWS RDS MySQL
