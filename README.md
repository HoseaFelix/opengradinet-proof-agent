## ProofAgent (Firebase + OpenGradient)

This is a Next.js App Router app for verifiable AI agents with:
- Firebase Auth (email/password)
- Firestore persistence for agents, runs, and user settings
- Protected API routes using verified Firebase ID tokens
- OpenGradient direct HTTP integration via server-side proxy routes (`/api/opengradient/*`)
- Optional MemSync integration via server-side proxy routes (`/api/memsync/*`)

## Required Environment Variables

Create `.env.local` from `.env.example`.

Server-side (Firebase Admin):
```bash
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Client-side (Firebase Web SDK):
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

OpenGradient:
```bash
OG_LLM_BASE_URL=https://llm.opengradient.ai/v1
OG_PRIVATE_KEY=... # optional fallback if user setting is empty
OG_PY_SERVER_URL=... # optional: local Python SDK server (x402)
```

MemSync (optional):
```bash
MEMSYNC_BASE_URL=https://api.memchat.io/v1
MEMSYNC_API_KEY=... # optional fallback if user setting is empty
```

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and create an account on `/login`.
Then put your credentials in `Settings`:
- OpenGradient API Key
- MemSync API Key (optional)

## API Endpoints

All endpoints require `Authorization: Bearer <firebase-id-token>`.

- `GET /api/agents`
- `POST /api/agents`
- `GET /api/agents/:id`
- `PUT /api/agents/:id`
- `DELETE /api/agents/:id`
- `GET /api/runs`
- `POST /api/runs`
- `GET /api/runs/:runId`
- `PUT /api/runs/:runId`
- `GET /api/settings`
- `PUT /api/settings`
- `DELETE /api/account`
- `POST /api/opengradient/chat`
- `POST /api/opengradient/stream`
- `GET /api/opengradient/models`
- `GET /api/opengradient/network`
- `GET /api/memsync/memories`
- `POST /api/memsync/search`
- `GET /api/memsync/profile`
- `POST /api/memsync/store`
- `DELETE /api/memsync/memories/:memoryId`
