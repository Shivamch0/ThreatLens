# ThreatLens Frontend

React 19 + Vite security dashboard. The frontend uses Axios with credentialed requests, in-memory access-token storage, automatic refresh-cookie exchange, and React Toastify notifications.

## Setup

```bash
npm install
```

Optional `Frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

Run `npm run dev`, `npm run lint`, and `npm run build`. Configure the backend `CORS_ORIGINS` to include the frontend origin. The API refresh endpoint sets an HTTP only cookie; do not configure the API and frontend origins in a way that requires cross-site cookies without setting up an appropriate HTTPS and SameSite policy.
