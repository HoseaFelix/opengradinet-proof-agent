## Setup Checklist (Firebase + OpenGradient)

This app is coded for Firebase Auth + Firestore + direct OpenGradient/MemSync HTTP calls.

### 1. Firebase project
1. Open Firebase Console.
2. Create/select project.

### 2. Enable Authentication
1. `Authentication` -> `Sign-in method`.
2. Enable `Email/Password`.

### 3. Create Firestore
1. `Firestore Database` -> Create database.
2. Choose production mode and region.

### 4. Firestore Rules
1. Open `Rules` tab.
2. Paste from `firestore.rules`.
3. Publish.

### 5. Firebase client env vars
From Project Settings -> General -> Web App config, set in `.env.local`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### 6. Firebase admin env vars
From Project Settings -> Service Accounts -> Generate private key JSON:
- `FIREBASE_PROJECT_ID` <- `project_id`
- `FIREBASE_CLIENT_EMAIL` <- `client_email`
- `FIREBASE_PRIVATE_KEY` <- `private_key` with `\\n` escaping

Example:
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nABC...\\n-----END PRIVATE KEY-----\\n"
```

### 7. OpenGradient credential
Pick one:
1. Preferred: set credential in app Settings (`OpenGradient API Key`) per user.
2. Fallback: set `OG_PRIVATE_KEY` in `.env.local`.

Also set:
- `OG_LLM_BASE_URL=https://llm.opengradient.ai/v1`

### 8. MemSync API key (optional)
- Leave MemSync unset to disable paid memory features.
- If you have a key, set it in app Settings (`MemSync API Key`) or `MEMSYNC_API_KEY` in `.env.local`.
- `MEMSYNC_BASE_URL` defaults to `https://api.memchat.io/v1`.

### 9. Run app
```bash
npm install
npm run dev
```

### 10. First-use flow
1. Open `/login`.
2. Register/sign in.
3. Go to `/settings`, set OpenGradient key and MemSync key.
4. Create agent and run.
5. (Optional) Open `/memory` after configuring MemSync.

## Data model
Per-user Firestore paths:
- `users/{uid}/agents/{agentId}`
- `users/{uid}/runs/{runId}`
- `users/{uid}/meta/settings`
