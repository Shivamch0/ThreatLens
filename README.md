# ThreatLens

ThreatLens is a defensive security monitoring demo for collecting authentication events, flagging repeated failed logins, and reviewing explainable alerts.

## Current capabilities

- React and Vite dashboard with responsive overview, event search, and alert status actions.
- Express API with explicit credentialed CORS allowlist.
- MongoDB persistence for users, security events, and alerts.
- Password hashing with bcrypt; short lived JWT access token plus rotating refresh token in an HTTP only cookie.
- Protected event and dashboard endpoints, basic authentication rate limiting, and validation.
- Rule heuristic: five or more failed logins for an account/source within five minutes creates or updates a deduplicated alert. Ten or more is classified High; otherwise Medium. This is a review signal, not proof of malicious activity.
- Axios API client with single-flight token refresh and one retry; Toastify user feedback.

## Requirements and setup

Use Node.js compatible with the installed Vite version and MongoDB. Install dependencies in each app with `npm install`.

Backend: create `Backend/.env` with:

```env
PORT=5000
DB_URL=mongodb://127.0.0.1:27017
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173
```

`DB_URL` is connected using the database name `threatlens`. Keep `.env` private. Set `NODE_ENV=production` behind HTTPS so refresh cookies are marked Secure. `CORS_ORIGINS` accepts a comma separated allowlist.

Frontend: optionally set `Frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the API from `Backend` with `npm run dev` and the frontend from `Frontend` with `npm run dev`. Create an account through the UI; registration requires a password of at least 10 characters. No default administrator account is seeded.

## API summary

- `GET /api/health`
- `POST /api/auth/register`, `/login`, `/refresh`, `/logout`
- `GET /api/dashboard` (access token required)
- `GET /api/events?page=1&limit=25&type=login_failure&search=...` (access token required)
- `POST /api/events` (access token required; supports login_success, login_failure, access_denied, other)
- `GET /api/alerts` and `PATCH /api/alerts/:id/status` (access token required; status: Open, Resolved, False positive)

The frontend lets an authenticated analyst add demonstration events. Five failure events using the same account and IP within five minutes demonstrate alert creation. Alerts and events are scoped to the shared demonstration database; create separate local databases when testing with multiple environments.

## Project layout

```text
Backend/src/{config,middleware,models,routes,utils}/
Frontend/src/{components,services}/
```

## Limitations

This initial implementation covers authentication, event entry/search, the overview, and one explainable detection rule. CSV/JSON file ingestion, historical baseline rules, configurable detection thresholds, investigation notes, report exports, and automated test coverage are not implemented yet. The current UI is a functional starting point rather than the full feature list in the original project brief.
