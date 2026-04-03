# Comprehensive Build Prompt: Verifiable AI Agent Dashboard on OpenGradient

---

## 🧠 PROJECT OVERVIEW

You are building **"ProofAgent"** — a production-ready, full-stack web application that serves as a beautiful dashboard for creating, running, monitoring, and auditing AI agents powered by OpenGradient's verifiable inference infrastructure.

The core value proposition is this: **every AI decision made by every agent is cryptographically provable and auditable on-chain.** Users can create agents, watch them reason in real-time, and inspect the full proof trail of every action — something no centralized AI platform (OpenAI, Anthropic, etc.) can offer.

This is not a toy or a demo. It is a polished, production-grade product.

---

## 🏗️ TECH STACK

### Frontend
- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui component library
- **Animations:** Framer Motion for all transitions and micro-interactions
- **State Management:** Zustand for global state, TanStack Query (React Query) for all server state and caching
- **Charts & Visualizations:** Recharts for time-series data, React Flow for agent pipeline visualization
- **Real-time:** Server-Sent Events (SSE) or WebSockets for live agent run streaming
- **Forms:** React Hook Form + Zod for all validation
- **Icons:** Lucide React
- **Theme:** Dark mode first, with light mode support via next-themes

### Backend (Next.js API Routes / Route Handlers)
- **Runtime:** Node.js via Next.js Route Handlers (app/api/*)
- **OpenGradient SDK:** `opengradient` Python SDK called via a lightweight FastAPI microservice, OR direct HTTP calls to x402 Gateway from Node
- **MemSync:** REST API calls to `https://api.memchat.io/v1` from backend route handlers
- **Database:** PlanetScale (MySQL) or Supabase (Postgres) for storing agent configs, run history, and user data — use Prisma as the ORM
- **Auth:** NextAuth.js with email/password + wallet connect (optional)
- **Queue:** Simple in-memory queue or BullMQ with Redis for managing concurrent agent runs

### Infrastructure
- **Deployment:** Vercel (frontend + API routes) + Railway or Render (Python microservice if needed)
- **Environment Variables:** Managed via Vercel environment settings

---

## 📁 PROJECT STRUCTURE

```
proofagent/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Dashboard shell with sidebar
│   │   ├── page.tsx                    # Home / overview
│   │   ├── agents/
│   │   │   ├── page.tsx                # Agent list
│   │   │   ├── new/page.tsx            # Agent creation wizard
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Agent detail / config
│   │   │       └── runs/[runId]/page.tsx  # Individual run audit view
│   │   ├── runs/
│   │   │   └── page.tsx                # Global run history
│   │   ├── memory/
│   │   │   └── page.tsx                # MemSync memory explorer
│   │   ├── models/
│   │   │   └── page.tsx                # Model Hub browser
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── agents/
│   │   │   ├── route.ts                # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET, PUT, DELETE agent
│   │   │       └── run/route.ts        # POST trigger agent run
│   │   ├── runs/
│   │   │   ├── route.ts                # GET all runs
│   │   │   └── [runId]/
│   │   │       ├── route.ts            # GET run details + proof
│   │   │       └── stream/route.ts     # SSE stream for live run
│   │   ├── memory/
│   │   │   ├── route.ts                # GET/POST memories
│   │   │   └── search/route.ts         # POST semantic search
│   │   └── models/
│   │       └── route.ts                # GET model hub list
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn/ui base components
│   ├── agents/
│   │   ├── AgentCard.tsx
│   │   ├── AgentCreationWizard.tsx
│   │   ├── AgentPipelineView.tsx       # React Flow visualization
│   │   └── AgentStatusBadge.tsx
│   ├── runs/
│   │   ├── RunTimeline.tsx             # Step-by-step run breakdown
│   │   ├── ProofInspector.tsx          # TEE attestation / proof viewer
│   │   ├── LiveRunStream.tsx           # Real-time run output
│   │   └── RunHistoryTable.tsx
│   ├── memory/
│   │   ├── MemoryCard.tsx
│   │   ├── MemorySearchBar.tsx
│   │   └── UserProfilePanel.tsx
│   ├── dashboard/
│   │   ├── StatsBar.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── NetworkStatusWidget.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── TopNav.tsx
│       └── CommandPalette.tsx          # Cmd+K global search
├── lib/
│   ├── opengradient.ts                 # OpenGradient x402 client wrapper
│   ├── memsync.ts                      # MemSync API client
│   ├── db.ts                           # Prisma client
│   └── utils.ts
├── hooks/
│   ├── useAgentRun.ts
│   ├── useMemorySearch.ts
│   └── useLiveStream.ts
├── store/
│   └── useAppStore.ts                  # Zustand global store
├── types/
│   └── index.ts                        # All TypeScript interfaces
└── prisma/
    └── schema.prisma
```

---

## 🗄️ DATABASE SCHEMA (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  apiKey        String?   // OpenGradient API key (encrypted)
  memSyncKey    String?   // MemSync API key (encrypted)
  createdAt     DateTime  @default(now())
  agents        Agent[]
  runs          AgentRun[]
}

model Agent {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  name          String
  description   String?
  systemPrompt  String    @db.Text
  model         String    // e.g. "gpt-4o", "claude-3-5-sonnet"
  triggerType   String    // "manual" | "scheduled" | "webhook"
  triggerConfig Json?     // cron expression, webhook URL, etc.
  memoryEnabled Boolean   @default(true)
  agentId       String    // MemSync agent_id
  status        String    @default("active") // "active" | "paused" | "archived"
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  runs          AgentRun[]
}

model AgentRun {
  id            String    @id @default(cuid())
  agentId       String
  agent         Agent     @relation(fields: [agentId], references: [id])
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  status        String    // "running" | "completed" | "failed"
  input         String    @db.Text
  output        String?   @db.Text
  steps         Json      // Array of RunStep objects
  memoriesUsed  Json?     // Array of memory IDs retrieved from MemSync
  proofHash     String?   // On-chain transaction hash
  proofData     Json?     // Full TEE attestation / proof payload
  tokenCount    Int?
  durationMs    Int?
  startedAt     DateTime  @default(now())
  completedAt   DateTime?
}
```

---

## 🔌 OPENGRADIENT INTEGRATION

### x402 LLM Inference Client (`lib/opengradient.ts`)

```typescript
// This wraps the x402 HTTP Gateway for verifiable LLM inference
// All calls go through OpenGradient's TEE-verified infrastructure

const OG_GATEWAY_URL = process.env.OG_GATEWAY_URL // x402 endpoint
const OG_API_KEY = process.env.OG_API_KEY

export interface InferenceResult {
  content: string
  proofHash: string        // On-chain settlement tx hash
  attestation: {
    teeProvider: string    // e.g. "AWS Nitro Enclave"
    enclaveHash: string    // Cryptographic hash of the enclave code
    timestamp: number
    signature: string      // Hardware attestation signature
  }
  promptHash: string       // Cryptographic hash of the exact prompt used
  model: string
  tokenUsage: {
    prompt: number
    completion: number
    total: number
  }
}

export async function runVerifiableInference(params: {
  model: string
  systemPrompt: string
  userMessage: string
  memories?: string[]      // Injected from MemSync
}): Promise<InferenceResult> {
  // 1. Build prompt with injected memories
  // 2. Call x402 Gateway
  // 3. Return result with full proof metadata
}

export async function streamVerifiableInference(params: {
  model: string
  systemPrompt: string
  userMessage: string
  memories?: string[]
  onChunk: (chunk: string) => void
  onProof: (proof: InferenceResult['attestation']) => void
}): Promise<InferenceResult>
```

### MemSync Client (`lib/memsync.ts`)

```typescript
const MEMSYNC_BASE = "https://api.memchat.io/v1"

export interface Memory {
  id: string
  memory: string
  categories: string[]
  type: "semantic" | "episodic"
  vector_distance: number
  rerank_score: number
  source: string
  created_at: string
}

export interface UserProfile {
  user_bio: string
  profiles: Record<string, string>
  insights: string[]
}

// Store a conversation turn as memories
export async function storeConversationMemory(params: {
  apiKey: string
  messages: Array<{ role: "user" | "assistant"; content: string }>
  agentId: string
  threadId: string
}): Promise<void>

// Search memories before inference — inject as context
export async function searchMemories(params: {
  apiKey: string
  query: string
  limit?: number
  rerank?: boolean
}): Promise<{ user_bio: string; memories: Memory[] }>

// Get full user profile
export async function getUserProfile(apiKey: string): Promise<UserProfile>
```

---

## 📄 PAGE-BY-PAGE SPECIFICATION

---

### 1. DASHBOARD HOME (`/`)

**Purpose:** Give the user an instant pulse on their agent ecosystem.

**Layout:** 4-column stats bar at the top, then a 2-column layout with activity feed on the left and network status + quick actions on the right.

**Components:**
- **StatsBar:** 4 animated number cards — Total Agents, Total Runs (all time), Successful Proofs, Tokens Used. Numbers count up on load with Framer Motion.
- **ActivityFeed:** Real-time list of the last 20 agent runs across all agents. Each item shows: agent name, status badge (green/red/yellow), time ago, and a "View Proof" button. Auto-refreshes every 10 seconds.
- **NetworkStatusWidget:** Shows OpenGradient testnet status — block height (live), TPS, number of inference nodes online. Pull from OpenGradient's public RPC.
- **QuickRunPanel:** A simple text input where the user can type a message and instantly run it against their default agent without navigating away.

---

### 2. AGENTS LIST (`/agents`)

**Purpose:** Browse, search, and manage all agents.

**Layout:** Search + filter bar at top. Grid of AgentCards below (3 columns on desktop, 1 on mobile).

**AgentCard contains:**
- Agent name + description
- Status badge (Active / Paused)
- Model used (e.g. "GPT-4o via TEE")
- Memory enabled indicator
- Last run time + status
- Total runs count
- Quick action buttons: Run Now, Edit, Pause/Resume, Delete

**Interactions:**
- Clicking a card navigates to `/agents/[id]`
- "Run Now" opens a slide-over panel with an input field
- Filter by: status, model, memory enabled
- Sort by: last run, total runs, created date

---

### 3. AGENT CREATION WIZARD (`/agents/new`)

**Purpose:** Guide the user through creating a new agent in a multi-step wizard.

**Steps:**

**Step 1 — Identity**
- Agent name (required)
- Description (optional)
- Avatar/icon picker (emoji or color)

**Step 2 — Intelligence**
- Model selector: dropdown showing available OpenGradient-supported LLMs (GPT-4o, Claude 3.5, Llama 3, etc.)
- System prompt textarea with character count
- Template picker: pre-built system prompts for common use cases (Research Assistant, Data Analyst, Code Reviewer, etc.)
- "Test Prompt" button — runs a quick inference and shows the result + proof inline

**Step 3 — Memory**
- Toggle: Enable MemSync memory
- If enabled: show memory configuration
  - Agent ID (auto-generated or custom)
  - Memory categories to track (multi-select: career, interests, goals, etc.)
  - Memory retention: semantic only / episodic only / both
- Preview: show existing memories from MemSync if any exist

**Step 4 — Triggers**
- Trigger type selector:
  - **Manual:** run on demand from dashboard
  - **Scheduled:** cron-style scheduler with a friendly UI (every X hours/days, at specific times)
  - **Webhook:** generates a unique POST endpoint the user can call externally

**Step 5 — Review & Deploy**
- Summary of all configuration
- Animated deploy button
- On success: confetti animation + redirect to agent detail page

---

### 4. AGENT DETAIL PAGE (`/agents/[id]`)

**Purpose:** The command center for a single agent. Most important page in the app.

**Layout:** 3-panel layout
- Left panel (30%): Agent config overview + edit controls + memory panel
- Center panel (50%): Run input + live output stream
- Right panel (20%): Recent runs history

**Left Panel — Config & Memory:**
- Agent name, description, status (editable inline)
- Model badge
- System prompt (collapsible, with edit button)
- **Memory Panel:** Shows the auto-generated user bio from MemSync + last 5 retrieved memories from the most recent run. Has a "View All Memories" link to `/memory`

**Center Panel — Run Interface:**
- Large textarea for user input message
- "Run Agent" button with loading state
- **Live Output Stream:** As the agent runs, stream the output token by token (like ChatGPT). Below the streaming text, show a live "Proof Status" indicator that goes through states:
  - 🔄 Inference running...
  - 🔐 TEE attestation received
  - ⛓️ Settling on-chain...
  - ✅ Proof confirmed (tx: 0x...)
- After completion: full output + a "View Full Proof" button that expands the ProofInspector

**Right Panel — Run History:**
- Scrollable list of last 20 runs for this agent
- Each run: timestamp, status, input preview, proof hash (truncated)
- Click any run → navigate to `/agents/[id]/runs/[runId]`

---

### 5. RUN AUDIT PAGE (`/agents/[id]/runs/[runId]`)

**Purpose:** The most unique page in the app. A full cryptographic audit trail of a single agent run. This is the page that will wow the OpenGradient team.

**Layout:** Full-width, single column, document-style

**Sections:**

**Section 1 — Run Summary Header**
- Agent name + run ID
- Status badge, timestamp, duration
- Large "Verified by OpenGradient" banner with a checkmark if proof is confirmed

**Section 2 — The Reasoning Chain (RunTimeline)**
A beautiful step-by-step timeline showing exactly what happened:

```
Step 1: Memory Retrieval
  → Query: "What is the user working on?"
  → Retrieved 3 memories from MemSync:
    • "User is building a trading bot" (semantic, score: 0.94)
    • "User prefers Python" (semantic, score: 0.87)
    • "User currently debugging API timeout issue" (episodic, score: 0.82)

Step 2: Prompt Construction
  → System prompt injected
  → 3 memories injected as context
  → User message appended
  → Final prompt hash: 0xabc123...

Step 3: Verifiable Inference
  → Model: GPT-4o via OpenGradient TEE
  → TEE Provider: AWS Nitro Enclave
  → Enclave hash: 0xdef456...
  → Inference duration: 1,240ms
  → Tokens used: 847

Step 4: Output Generated
  → [full output shown here]

Step 5: On-Chain Settlement
  → Proof submitted to OpenGradient network
  → Validators: 12/15 confirmed
  → Transaction hash: 0xghi789...
  → Block: #1,043,221
  → Settled in: 2.3 seconds
```

**Section 3 — ProofInspector**
A collapsible, syntax-highlighted JSON panel showing the raw proof data:
- Full TEE attestation payload
- Prompt hash + prompt content
- Model metadata
- On-chain settlement data
- Link to Block Explorer for the tx hash

**Section 4 — Memory Impact**
- Memories used in this run (cards)
- New memories extracted from this run (cards, highlighted in green)
- Before/after user bio comparison if it changed

**Section 5 — Share & Export**
- "Share Proof" button — generates a public, read-only URL for this audit page
- "Export JSON" — downloads the full proof payload
- "Verify Independently" — instructions for how to verify the proof yourself using the block explorer

---

### 6. MEMORY EXPLORER (`/memory`)

**Purpose:** Let the user explore and manage all memories stored in MemSync.

**Layout:** Search bar at top, user profile panel on right (25%), memory grid on left (75%)

**Features:**
- **Semantic Search:** Type any query, get relevant memories ranked by similarity score. Show the rerank score as a visual bar.
- **Filter by:** type (semantic/episodic), category (career/interests/etc.), source, date range
- **User Profile Panel:** Auto-generated user bio, profile insights from MemSync
- **Memory Card:** Shows memory text, type badge, category chips, created date, source (chat/document/etc.), relevance score
- **Delete memory** with confirmation
- **Memory timeline:** A chronological view of when memories were created, grouped by day

---

### 7. MODEL HUB BROWSER (`/models`)

**Purpose:** Browse the 1,000+ models available on OpenGradient's decentralized Model Hub.

**Layout:** Search + filter sidebar, model grid

**Features:**
- Search by name/architecture
- Filter by: type (LLM/ML/embedding), size, verification method (TEE/ZKML/Vanilla)
- Model card: name, description, architecture, version, verification badge
- "Use in Agent" button — pre-fills model selection in agent creation wizard

---

### 8. SETTINGS (`/settings`)

- API Keys section: OpenGradient API key input, MemSync API key input (masked, with test connection button)
- Default model preference
- Notification preferences
- Danger zone: delete all data

---

## 🎨 DESIGN SYSTEM

### Color Palette (Dark Mode Primary)
```
Background:     #0A0A0F  (near black, slight blue tint)
Surface:        #111118  (cards, panels)
Surface Hover:  #1A1A24
Border:         #2A2A3A
Primary:        #6366F1  (indigo — OpenGradient brand feel)
Primary Hover:  #4F46E5
Success:        #10B981  (green — verified/confirmed)
Warning:        #F59E0B  (amber — pending/running)
Error:          #EF4444  (red — failed)
Text Primary:   #F1F5F9
Text Secondary: #94A3B8
Text Muted:     #475569
```

### Typography
- **Font:** Inter (system fallback), loaded via next/font
- **Scale:** Use Tailwind's default type scale
- **Monospace:** JetBrains Mono for proof hashes, JSON, code

### Key Design Principles
- **Dense but breathable:** Information-rich like a professional tool, not a landing page
- **Proof is the hero:** Every verified action should feel meaningful — use subtle green glows, animated checkmarks, and badge treatments to make verification feel premium
- **Real-time feedback:** Nothing should feel static. Use skeleton loaders, streaming text, animated counters, and live status indicators everywhere
- **Responsive:** Full mobile support. Dashboard collapses to tab-based navigation on mobile.

### Animations (Framer Motion)
- Page transitions: fade + slight upward slide (0.2s ease-out)
- Card hover: subtle scale(1.01) + border glow
- Stats numbers: count-up animation on mount
- Proof confirmation: green pulse ripple effect
- Stream output: each token fades in
- Wizard steps: slide left/right transitions

---

## ⚙️ AGENT RUN FLOW (Full Technical Detail)

This is the most important flow in the app. Here is the exact sequence for when a user triggers an agent run:

```
1. User submits input via UI
      ↓
2. POST /api/agents/[id]/run
      ↓
3. API Route:
   a. Load agent config from DB
   b. If memory enabled:
      → Call MemSync search with user's input as query
      → Retrieve top 5 relevant memories
      → Retrieve user bio
   c. Build full prompt:
      → System prompt + user bio injection + memory injection + user input
   d. Save run record to DB with status "running"
   e. Return runId to client immediately
      ↓
4. Client opens SSE connection to /api/runs/[runId]/stream
      ↓
5. Stream handler:
   a. Calls OpenGradient x402 streaming inference
   b. Streams tokens to client as they arrive
   c. On inference complete:
      → Receives TEE attestation + proof hash
      → Updates run record in DB
      → Emits proof event to SSE stream
   d. Store conversation in MemSync for future memory extraction
   e. Update run record: status "completed", proofData, completedAt
   f. Close SSE stream
      ↓
6. Client receives:
   a. Streaming tokens → rendered in real-time
   b. Proof event → ProofInspector updates live
   c. Stream close → run marked complete, View Proof button appears
```

---

## 🔐 SECURITY CONSIDERATIONS

- **API Key Storage:** Never store raw API keys in the database. Encrypt using AES-256 with a server-side secret before persisting. Decrypt only in server-side route handlers, never expose to client.
- **Route Protection:** All `/api/*` and dashboard routes must require authenticated session via NextAuth middleware.
- **Input Sanitization:** Sanitize all user-provided system prompts and inputs before sending to inference APIs.
- **Rate Limiting:** Implement per-user rate limiting on `/api/agents/[id]/run` to prevent abuse (max 10 concurrent runs per user).
- **SSE Security:** Verify that the requesting user owns the runId before opening an SSE stream.

---

## 🚀 IMPLEMENTATION ORDER

Build in this exact order to always have a working, demo-able product:

**Week 1 — Foundation**
1. Next.js project setup, Tailwind, shadcn/ui, auth
2. Database schema + Prisma migrations
3. Dashboard layout: sidebar, topnav, routing
4. MemSync client library + memory explorer page (easiest API to test with)

**Week 2 — Core Agent Features**
5. OpenGradient x402 client wrapper
6. Agent creation wizard (all 5 steps)
7. Agent list page + agent cards
8. Basic agent run (no streaming yet) + run history

**Week 3 — The Impressive Parts**
9. Live streaming run output via SSE
10. Proof confirmation flow + ProofInspector component
11. Run Audit page (the showstopper)
12. Memory injection into agent runs

**Week 4 — Polish**
13. Dashboard home with live stats + activity feed
14. Model Hub browser
15. Animations, mobile responsiveness, loading states
16. Settings page + API key management

---

## 📦 KEY PACKAGES TO INSTALL

```bash
# Core
npx create-next-app@latest proofagent --typescript --tailwind --app

# UI
npx shadcn-ui@latest init
npm install framer-motion lucide-react next-themes

# Data
npm install @tanstack/react-query zustand
npm install react-hook-form @hookform/resolvers zod

# Visualization
npm install recharts reactflow

# Database
npm install prisma @prisma/client
npm install @auth/prisma-adapter next-auth

# Utilities
npm install date-fns clsx tailwind-merge
npm install @types/node
```

---

## 🎯 THE CORE DIFFERENTIATOR TO ALWAYS KEEP IN MIND

Every design and engineering decision should reinforce this single idea:

> **"You don't have to trust that the AI did what it said. You can prove it."**

This means:
- Every run shows a proof hash. Always.
- The ProofInspector is never hidden behind too many clicks.
- Verified badges and on-chain confirmation should feel rewarding, not bureaucratic.
- The audit page should be shareable — so users can show others the proof.

This is what makes ProofAgent fundamentally different from any AI wrapper built on OpenAI or Anthropic. Lean into it.

---

*Built on OpenGradient — Verifiable AI Infrastructure*
*x402 Gateway + MemSync + HACA Architecture*
