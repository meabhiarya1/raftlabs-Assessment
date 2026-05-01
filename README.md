# OrderFlow Kitchen

Full-stack food ordering and order tracking application built for the Senior Full Stack Developer assessment.

This repository contains:

- a `backend/` service built with Fastify, MySQL, Socket.IO, and Vitest
- a `client/` application built with React, Vite, Tailwind CSS, Axios, and Vitest
- an EC2-first deployment setup using PM2 and Nginx

## Links

Update these before submission if any URL changes.

| Item | Link |
| --- | --- |
| Live App | `http://13.60.189.28/` |
| Backend Health | `http://13.60.189.28/health` |
| Demo Video 1 | `Add Loom link here` |
| Demo Video 2 | `Add extra demo link here if needed` |

Note:

- the current live URL uses the instance public IP
- if the EC2 instance is stopped and started again, the IP may change unless an Elastic IP is attached

## Assessment Scope Covered

This project implements the main assessment requirements:

- menu display with name, description, price, and image
- cart and checkout flow
- order placement with delivery details
- order status tracking
- real-time status updates with Socket.IO
- REST API for menu and orders
- MySQL persistence
- backend and frontend testing
- deployment on AWS EC2

## Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- Axios
- Socket.IO Client
- Vitest
- Testing Library

### Backend

- Node.js 20+
- Fastify
- MySQL
- Socket.IO
- Zod
- Vitest

### Deployment

- AWS EC2
- PM2
- Nginx

## Project Structure

```text
raftlabs-Assessment/
├── backend/
│   ├── database/
│   ├── scripts/
│   ├── src/
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── client/
│   ├── src/
│   ├── .env.example
│   ├── .env.production
│   ├── package.json
│   └── README.md
└── README.md
```

## Architecture

### Backend Flow

The backend follows a layered structure:

```text
route -> middleware -> controller -> service -> model -> database
```

This keeps responsibilities clear and makes the code easier to explain in an interview.

### Production Flow

On EC2, the app runs like this:

```text
Browser
  -> Nginx on port 80
    -> static React build for /
    -> Fastify backend on localhost:4000 for /api and /socket.io
```

PM2 keeps the backend process alive after reboot.

## Features

### Frontend

- menu listing
- cart state management
- quantity increase and decrease
- checkout form with validation
- live order status tracking
- manual order lookup by order ID
- responsive single-page UI

### Backend

- menu retrieval
- order creation
- order listing
- single order detail with items and status history
- order details update
- order status update
- order cancel flow
- automatic status progression
- real-time Socket.IO events
- auto schema setup and seed support

## API Summary

### Public

- `GET /health`

### Protected with `x-api-key`

- `GET /api/menu`
- `GET /api/orders`
- `GET /api/orders/:orderId`
- `POST /api/orders`
- `PATCH /api/orders/:orderId`
- `PATCH /api/orders/:orderId/status`
- `DELETE /api/orders/:orderId`

### Real-Time Events

Client emits:

- `order:subscribe`
- `order:unsubscribe`

Server emits:

- `order.status.updated`

## Local Development

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd raftlabs-Assessment
```

### 2. Backend setup

```bash
cd backend
npm install
npm run dev
```

Important backend environment values live in `backend/.env`.

Default backend URL:

```text
http://localhost:4000
```

### 3. Frontend setup

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

## Environment Notes

### Backend

The backend uses `backend/.env` and auto-creates it from `backend/.env.example` if missing.

Important values:

```env
HOST=0.0.0.0
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=order_management
DB_USER=order_app
DB_PASSWORD=your_password
API_KEY=development-api-key
CORS_ORIGIN=http://localhost:5173
AUTO_MIGRATE_DB=true
AUTO_SEED_MENU=true
ORDER_STATUS_SIMULATION_ENABLED=true
```

### Frontend

For local development, `client/.env` points to the backend directly.

For EC2 deployment, `client/.env.production` uses same-origin values:

```env
VITE_API_URL=/
VITE_API_KEY=development-api-key
VITE_SOCKET_URL=/
```

That allows Nginx to serve the frontend and proxy the backend from the same host.

## Testing

### Backend tests

From `backend/`:

```bash
npm test
npm run test:db
npm run test:all
npm run test:coverage
```

What is covered:

- order pricing logic
- order status transition rules
- route validation
- API behavior
- real MySQL integration flows
- stock updates
- status history persistence

### Frontend tests

From `client/`:

```bash
npm test
npm run test:coverage
```

What is covered:

- app flow
- menu rendering
- cart interactions
- checkout submission
- order tracker behavior

## Deployment on AWS EC2

This project is currently designed to run both frontend and backend on the same EC2 instance.

### Backend deployment

From `backend/`:

```bash
npm install
pm2 start npm --name order-management-backend -- start
pm2 save
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs order-management-backend
pm2 restart order-management-backend
```

### Frontend deployment

From `client/`:

```bash
npm install
npm run build
sudo mkdir -p /var/www/order-management-client
sudo cp -r dist/* /var/www/order-management-client/
```

### Nginx configuration

Example server block:

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/order-management-client;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location = /health {
        proxy_pass http://127.0.0.1:4000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Then:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### AWS networking

Inbound rules should allow:

- `22` for SSH
- `80` for HTTP
- `4000` only if you want to test the backend directly without Nginx

Port `3306` should not be publicly exposed.

## Current Deployment Notes

- frontend is served by Nginx
- backend runs on PM2
- MySQL runs on the same EC2 instance
- the app is accessible via the EC2 public IP

## Known Tradeoffs

- the project currently uses an API key header for protected routes
- this is acceptable for assessment/demo purposes, but it is not strong browser-side security for a public production app
- the current deployment uses a public IP instead of a fixed domain

## Submission Checklist

- [x] frontend implemented
- [x] backend implemented
- [x] MySQL persistence implemented
- [x] real-time status updates implemented
- [x] frontend tests added
- [x] backend tests added
- [x] AWS EC2 deployment completed
- [ ] attach Elastic IP for stable URL
- [ ] add Loom demo link
- [ ] add final GitHub repository link if needed elsewhere

## Additional Docs

- Backend details: [backend/README.md](backend/README.md)
- Frontend details: [client/README.md](client/README.md)
