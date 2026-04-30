# Order Management Frontend

React + Vite frontend for the food ordering assessment.

## Stack

- React
- Tailwind CSS
- Axios
- Socket.IO client

## Environment

A default `.env` is already present for local development. If you need a fresh file, copy `.env.example` to `.env` and update the values.

```env
VITE_API_URL=http://localhost:4000
VITE_API_KEY=development-api-key
VITE_SOCKET_URL=http://localhost:4000
```

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The frontend expects the backend routes:

- `GET /api/menu`
- `POST /api/orders`
- `GET /api/orders/:orderId`

It also listens for live updates on Socket.IO using:

- `order:subscribe`
- `order:unsubscribe`
- `order.status.updated`
