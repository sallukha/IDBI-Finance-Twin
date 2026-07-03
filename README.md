# FinBuddy AI

FinBuddy AI is organized as one full-stack project with clearly separated client
and server code. The Express server exposes `/api/*`; in development it mounts
Vite as middleware, and in production it serves the compiled React application.

## Project structure

```text
finbuddy-ai/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── pages/
│   ├── index.html
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── app.ts
│   │   ├── db.ts
│   │   └── index.ts
│   └── tsconfig.json
├── data/                 # Created at runtime; keep persistent in production
├── dist/                 # Production build output
├── .env.example
└── package.json
```

## Local development

Requirements: Node.js 20 or newer.

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:3000`. Client requests continue to use the same relative
`/api` URLs, so no frontend API-path changes are required.

Authentication users are stored in MongoDB Atlas. Set `MONGODB_URI` and
`MONGODB_DB_NAME` in `.env`; the server verifies the connection and creates a
unique email index during startup. Local `.env` files and runtime database files
are excluded from Git.

## Validation and production

```bash
npm run typecheck
npm run build
```

Set `NODE_ENV=production`, provide a strong `JWT_SECRET`, and then run:

```bash
npm start
```

The build creates `dist/client` for browser assets and
`dist/server/index.cjs` for the Node.js server.

## Deploy on Render

The repository includes a `render.yaml` Blueprint for one full-stack web
service. In Render, create a new Blueprint from this repository and provide the
prompted `MONGODB_URI` and `GEMINI_API_KEY` values. Render generates
`JWT_SECRET`, builds with `npm ci && npm run build`, starts with `npm start`,
and checks `/api/health`.

Never commit the local `.env` file. You can also add its values from the
service's **Environment** page using **Add from .env**.
