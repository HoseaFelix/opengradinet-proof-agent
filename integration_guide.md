# 🚀 ProofAgent Integration Guide

The frontend UI, state management, and full dashboard experience for **ProofAgent** have been built successfully and compile with zero errors. Currently, it uses a mock data layer (Zustand + simulated API delays) so the UI can be tested immediately.

To make ProofAgent **completely functional** and production-ready, follow these implementation steps:

## 1. Set Up the Database (Prisma)

The application needs a persistent database (like PlanetScale MySQL or Supabase Postgres) to store Users, Agents, and Runs.

1. **Initialize Prisma**:
   ```bash
   npx prisma init
   ```
2. **Copy Schema**: Copy the schema provided in the original specification into `prisma/schema.prisma`.
3. **Database URL**: Add your `DATABASE_URL` to the `.env` file.
4. **Push Schema**:
   ```bash
   npx prisma db push
   ```
5. **Generate Client**:
   ```bash
   npx prisma generate
   ```
6. **Create DB Client**: Create `lib/db.ts` to instantiate the global Prisma client.

## 2. Implement Authentication (NextAuth.js)

To associate agents and runs with specific users, you need authentication.

1. Create the Auth API route at `app/api/auth/[...nextauth]/route.ts`.
2. Configure providers (e.g., Email/Password with CredentialsProvider or GitHub/Google OAuth).
3. Use the `@auth/prisma-adapter` to automatically link users to your Prisma database.
4. Wrap the app with `<SessionProvider>` in [app/providers.tsx](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/app/providers.tsx).
5. Update [app/(dashboard)/layout.tsx](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/app/%28dashboard%29/layout.tsx) to redirect unauthenticated users to `/login`.

## 3. Connect the Real OpenGradient x402 Gateway

Currently, [lib/opengradient.ts](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/opengradient.ts) simulates the TEE attestation and streaming. You must replace this with actual HTTP calls to the OpenGradient network.

1. Open [lib/opengradient.ts](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/opengradient.ts).
2. In [runVerifiableInference](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/opengradient.ts#38-73) and [streamVerifiableInference](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/opengradient.ts#74-207), replace the simulated [sleep()](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/utils.ts#42-45) and array yielding with a real [fetch](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/opengradient.ts#218-345) request to `process.env.OG_GATEWAY_URL`.
3. For streaming, you'll need to parse the Server-Sent Events (SSE) or chunked response from the OpenGradient gateway to yield `token` and `proof` events to the frontend.

## 4. Connect the Real MemSync API

Currently, [lib/memsync.ts](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/memsync.ts) returns hardcoded mock memories and profiles. Keep the interface exactly the same, but swap the internals.

1. Open [lib/memsync.ts](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/memsync.ts).
2. In [storeConversationMemory](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/memsync.ts#89-99), execute a real `POST` request to `https://api.memchat.io/v1/memory` using the user's `memSyncKey`.
3. In [searchMemories](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/memsync.ts#100-117), execute a real `POST` request to `https://api.memchat.io/v1/memory/search` using the `query` provided.
4. In [getUserProfile](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/memsync.ts#118-122), `GET` the real user insights from MemSync.

## 5. Migrate State from Zustand to Server State (React Query/API Routes)

The UI is currently driven by a global Zustand store ([store/useAppStore.ts](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/store/useAppStore.ts)). You need to move this logic to Next.js API Routes and fetch with React Query.

1. **Create API Routes**:
   - `app/api/agents/route.ts` (GET all agents, POST new agent)
   - `app/api/agents/[id]/route.ts` (GET, PUT, DELETE specific agent)
   - `app/api/agents/[id]/run/route.ts` (POST to trigger a run)
   - `app/api/runs/route.ts` (GET all runs)
   - `app/api/runs/[runId]/stream/route.ts` (GET SSE stream for live token output)
2. **Update Components**: 
   - Instead of using `useAppStore()`, use TanStack Query (`useQuery`, `useMutation`) to fetch from your new API routes.
   - For example, in [AgentsPage](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/app/%28dashboard%29/agents/page.tsx#10-180), replace `const { agents } = useAppStore()` with `const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents })`.
3. **SSE for Live Runs**: In [AgentDetailPage](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/app/%28dashboard%29/agents/%5Bid%5D/page.tsx#28-405), replace the direct call to [streamVerifiableInference](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/opengradient.ts#74-207) with an `EventSource` connection pointing to your `/api/runs/[runId]/stream` route.

## Summary Checklist

- [ ] `npx prisma db push`
- [ ] Configure `NextAuth.js` wrappers
- [ ] Wire up [lib/opengradient.ts](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/opengradient.ts) to `api.opengradient.ai/v1`
- [ ] Wire up [lib/memsync.ts](file:///home/hosea/Desktop/my%20backup/my_portfolio/web3/opengradient/lib/memsync.ts) to `api.memchat.io/v1`
- [ ] Create Next.js API Route Handlers for Agents and Runs
- [ ] Replace Zustand `useAppStore()` calls with `@tanstack/react-query` hooks fetching from your API routes
