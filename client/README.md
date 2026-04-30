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

For EC2-only deployment, the production frontend uses same-origin requests through [client/.env.production](/Users/abhishekkumar/Desktop/raftlabs-Assessment/client/.env.production):

```env
VITE_API_URL=/
VITE_API_KEY=development-api-key
VITE_SOCKET_URL=/
```

That makes the frontend call:

- `/api/...`
- `/socket.io/...`

and lets Nginx forward those requests to the backend running on `localhost:4000`.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## EC2 Deployment

Use one EC2 instance for both frontend and backend:

1. Keep the backend running with PM2 on `localhost:4000`.
2. Build the frontend:

```bash
npm install
npm run build
```

3. Copy the built frontend to an Nginx-served directory:

```bash
sudo mkdir -p /var/www/order-management-client
sudo cp -r dist/* /var/www/order-management-client/
```

4. Configure Nginx so:
   - `/` serves the React app
   - `/api` proxies to the backend
   - `/socket.io` proxies to the backend
   - `/health` proxies to the backend

Example Nginx server block:

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

5. Reload Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

After that, open `http://<your-ec2-public-ip>/` and the frontend and backend will work on the same origin with no mixed-content issue.

## Tests

```bash
npm test
npm run test:coverage
```

The frontend expects the backend routes:

- `GET /api/menu`
- `POST /api/orders`
- `GET /api/orders/:orderId`

It also listens for live updates on Socket.IO using:

- `order:subscribe`
- `order:unsubscribe`
- `order.status.updated`
