# katalyst_ — Cloud Dev Environments with AI & Live Collaboration

Zero-setup, multiplayer, AI-native coding—right in your browser. Spin up full-stack environments in seconds with Monaco’s developer-grade editor, WebContainers’ in-browser Node.js runtime, Yjs-powered real-time collaboration, and Llama-driven code intelligence. Build, run, debug, and co-create without installs, context-switching, or merge hell.**.

---

## 🧭 Overview

Developers waste hours fighting local setup, mismatched dependencies, and brittle environments.  
**katalyst_** fixes this by delivering a **cloud-native IDE** that runs entirely in the browser:

- Launch a production‑grade Node.js workspace in seconds with in‑browser WebContainers—no installs, no Docker, no waiting.
- Code with Monaco’s developer‑grade editor, complete with inline AI suggestions, refactors, and chat that understands your context.
- Pair‑program for real with Yjs: live cursors, instant merges, and sub‑100ms sync that feels like Google Docs for code.
- Save, star, resume, and share from a clean, persistent dashboard—your projects follow you across devices, ready to run.

---

## 🚀 Key Features

### 🧩 Zero-install Dev Environments
- Node.js runtime directly in browser (WebContainers)
- Live terminal (Xterm) with npm, vite, next, etc.

### 👥 Multiplayer Collaboration
- Yjs CRDT + WebRTC
- Presence (avatars), shared cursors
- Works on localhost without server

### 🔗 GitHub Integration
- Import repo → instant workspace

### 💡 Monaco Editor + AI
- Inline suggestions
- Chat for bug fixes, refactors, and docstrings
- Llama 3.3 70B via GROQ

### 🗂️ Persistent Dashboard
- Saved projects, starred items, recent history

### 🔐 Auth + DB
- NextAuth (Google/GitHub)
- MongoDB via Prisma

---

## 🏗️ Architecture
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind & shadcn/ui  
- **Editor & Terminal:** Monaco Editor + Xterm.js  
- **Execution Engine:** WebContainers API (Node.js in-browser)  
- **AI:** Llama 3.3-70B via GROQ (code completion + chat)  
- **Collaboration:** Yjs + y-monaco + y-webrtc (peer-to-peer)  
- **Auth:** NextAuth  
- **DB:** Prisma + MongoDB  

---

## 🧱 Tech Stack
**Core:** Next.js 15, TypeScript  
**UI:** TailwindCSS, shadcn/ui, Lucide Icons  
**Editor:** Monaco, y-monaco  
**Collaboration:** Yjs, y-webrtc, y-protocols Awareness  
**Execution:** WebContainers, Xterm.js  
**AI:** GROQ Llama 3.3  
**Auth:** NextAuth.js  
**Database:** Prisma ORM + MongoDB  

---

## 🔄 Product Workflow
1. User signs in via OAuth (Google/GitHub)
2. Lands on Dashboard → sees list of Playgrounds (starred/recent)
3. Creates a Playground from a template or imports GitHub repo
4. Editor loads Monaco + WebContainers → terminal bootstraps environment
5. AI suggestions show inline; user can also chat with AI
6. Collaboration via link → teammates join and code simultaneously
7. Project auto-saves to DB; user can export or deploy

---

## 🖥️ Screens & UX
- **Landing:** CTA → Get Started  
- **Auth:** OAuth → NextAuth flow  
- **Dashboard:**
  - Sidebar: Starred + Recent
  - Actions: New, Duplicate, Delete  
- **Playground:**
  - File Explorer (tree)
  - Tabs for open files
  - Monaco Editor (left)
  - Preview or Terminal (right)
  - Header controls: Save, AI toggle, Collaboration toggle, Settings  
- **Active Users:**
  - Avatars with colors and initials
  - Presence count + Connected status

---

## 🤖 AI Assistant Capabilities
### Inline Suggestions (Monaco)
- Ghost text suggestions at cursor  
- Tab to accept, Escape to dismiss  

### Chat Commands
- “Explain this code”  
- “Fix lint errors”  
- “Refactor function to be pure”  
- “Add TypeScript types”  

### Context
- Active file, file path, and recent edits  

### API
`/api/code-completion` (serverless route)

---

## 🧩 Collaboration Details
**Yjs Integration**
- Doc per playground: `roomName = playground-${id}`
- Per file binding: `ydoc.getText("monaco-${fileId}")`
- Awareness protocol for presence + cursors

**Transport**
- y-webrtc (peer-to-peer)
- Uses public signaling servers (no setup)

**UI**
- ActiveUsers component (avatars, count, status)
- CollaborationToggle (enable/disable live mode)

**Behavior**
- In collaborative mode, Yjs is source of truth  
- Local onChange suppressed to avoid double updates  

---

## 🧰 Templates & Runtimes
**Available templates (extensible):**
- React (Vite)
- Next.js
- Express.js
- Vue
- Hono
- Angular

Each includes:
- index files (`src/main.tsx`, `pages/index.tsx`, `server.ts`, etc.)
- `package.json` scripts
- WebContainers-ready settings

---

## 🗃️ Data Model

```prisma
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String?
  email     String?  @unique
  image     String?
  playgrounds Playground[]
  Starmark  StarMark[]
}

model Playground {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  description String?
  template    String
  userId      String   @db.ObjectId
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  Starmark    StarMark[]
}

model StarMark {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @db.ObjectId
  playgroundId String   @db.ObjectId
  isMarked     Boolean  @default(false)
  user         User      @relation(fields: [userId], references: [id])
  playground   Playground @relation(fields: [playgroundId], references: [id])

  @@unique([userId, playgroundId])
}
````

---

## 🛠️ API Endpoints (Selected)

### 🔐 Authentication

```
/api/auth/[...nextauth]
```

### 🤖 AI

```
POST /api/code-completion
```

### 🧩 Playground

```
GET /api/template/[id] – load template JSON
```

### 💬 Chat

```
POST /api/chat – AI chat actions
```

### 🔗 GitHub

```
POST /api/github – import
```

---

## 💻 Local Development

### 🧱 Prerequisites

* Node 18+
* MongoDB (local or Atlas)
* npm / pnpm / bun

### ⚙️ Install

```bash
npm install
```

### 🧾 Env

Copy `.env.example` → `.env.local`

### ▶️ Dev

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Environment Variables

Create `.env.local`:

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

GITHUB_ID=...
GITHUB_SECRET=...

MONGODB_URI=mongodb+srv://...

GROQ_API_KEY=...
```

Optional (custom signaling):

```bash
YJS_SIGNALING_WS=ws://localhost:4444
```

---

## 🧩 Project Structure

```text
└── katalyst_/
    ├── README.md
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── prisma/
    │   └── schema.prisma
    │
    ├── app/
    │   ├── (root)/              # Landing Page
    │   ├── auth/                # Sign-in & Auth Layouts
    │   ├── dashboard/           # Dashboard pages
    │   ├── playground/          # Editor & Runtime View
    │   └── api/                 # API routes (auth, chat, github, template)
    │
    ├── components/
    │   ├── ui/                  # shadcn/ui Components
    │   └── providers/           # Theme & Global Providers
    │
    ├── hooks/
    │   └── use-mobile.ts
    │
    ├── lib/
    │   ├── db.ts                # Prisma DB Client
    │   ├── utils.ts             # Helpers
    │   └── template.ts          # Template Loader
    │
    ├── modules/
    │   ├── ai-chat/             # AI Sidebar & Chat Integration
    │   ├── auth/                # Auth Hooks & Components
    │   ├── collaboration/       # Yjs Collaboration & Presence
    │   ├── dashboard/           # Sidebar, Project Table, etc.
    │   ├── playground/          # File Explorer, Editor, Dialogs
    │   └── webcontainers/       # Terminal & Preview Runtime
    │
    ├── public/
    │   ├── logo.svg
    │   └── assets/
    │
    ├── prisma/
    │   └── schema.prisma
    │
    ├── vibecode-starters/       # Built-in Starter Templates
    │   ├── nextjs/              # Next.js Base Template
    │   ├── vite-shadcn/         # Vite + Shadcn Template
    │   ├── astro-shadcn/        # Astro + Shadcn Template
    │   └── react-ts/            # React + TS Starter
    │
    └── .github/
        └── workflows/           # CI/CD & Formatter Actions
            ├── prettier.yml
            ├── package-lock-sync.yml
            └── test.yml
```

---

## 🧪 Testing Guide

### 🧍 Manual testing scenarios

* **Auth Flow:** Sign in/out, refresh dashboard
* **Create Playground:** Select template, verify files and preview
* **Editor:** Typing, tabs, language modes
* **Terminal:** Install & run scripts (vite/next/dev)
* **AI:** Inline suggestion triggers, accept/reject, latency
* **Collaboration:**

  * Open same playground in two tabs → both see “Connected” and “2 users”
  * Type in one tab → appears in other
  * Toggle off → disconnects cleanly
* **Save/Load:** Modify files → Save → Reload → Verify persistence
* **Star/Recent:** Mark/unmark starred → Dashboard updates

---

## 🚀 Deployment

### ☁️ Vercel (Recommended)

1. Set environment variables in Vercel dashboard
2. Configure MongoDB Atlas
3. NextAuth callback URLs

**Notes**

* WebContainers require secure context (https)
* Peer-to-peer may be constrained by corporate firewalls

---

## 🗺️ Roadmap

* Export/Import Workspaces (zip)
* Git push from WebContainers
* Live session invite links with roles
* Persistent files via durable object storage
* LLM context window upgrades
* Multi-file AI refactors
* Template marketplace

---

## 💡 Pitch (Hackathon)

**Problem:** Setup friction, brittle environments, async collaboration pains.
**Solution:** One-click, AI-native, multiplayer coding in-browser.
**Differentiators:** Zero-setup runtime, built-in AI+collab, portable workspaces.
**Impact:** Faster ideation, fewer blockers, better onboarding, more velocity.
**Market:** Teams, bootcamps, OSS projects, hackathons, rapid MVPs.
**Business Model:** Free tier + Pro + Team subscriptions.

---

## 👨‍💻 Team

**Team:** dailyWageDevs
**Team ID:** YDTRSK
**Members:** Kushagra Singh, Tanmay Tiwari, Abhijeet Yadav, Yashdeep

---
