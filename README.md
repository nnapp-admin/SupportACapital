# 🤖 AI Customer Support Agent System

Welcome to the **SupportAgent2** repository!

This project is a modern, AI-powered customer support system built as a **Monorepo**. It simulates a real-world help desk where an AI understands your request and routes you to the correct specialist (Order, Billing, or General Support) to solve your problem.

---

## 📂 Project Structure Visualized

Here is exactly how the folders and files are organized in this project. Think of it like a house where every room has a specific purpose.

```plaintext
SupportAgent2/              <-- 🏠 ROOT (Main House)
├── apps/                   <-- 🏗️ WORKSPACES (The main rooms)
│   ├── api/                <-- 🧠 BACKEND (The Brain)
│   │   ├── prisma/         <-- 💾 DATABASE (Memory Storage)
│   │   │   └── schema.prisma   # Defines what data we save (Users, Agents, Payments)
│   │   ├── src/            <-- ⚙️ API LOGIC (Thinking Process)
│   │   │   ├── agents/         # 🤖 The AI Personalities (Router, Support, Order, Billing)
│   │   │   ├── chat/           # 💬 Chat Message Handling (Sending/Receiving text)
│   │   │   ├── db/             # 🔌 Connection to Database
│   │   │   ├── tools/          # 🛠️ Tools the Agents use (e.g., "Check Order Status")
│   │   │   └── index.ts        # 🚦 Entry Point (Server Start)
│   │   └── package.json    <-- 📦 API Dependencies
│   │
│   └── web/                <-- 🖥️ FRONTEND (The Service Counter)
│       ├── src/
│       │   ├── api/            # 📡 Client Logic (Talking to the Brain)
│       │   ├── pages/          # 📄 Web Pages (Screens you see)
│       │   │   ├── User.tsx        # 👤 User Chat Screen
│       │   │   └── Admin.tsx       # ⚙️ Admin Dashboard
│       │   └── App.tsx         # 🗺️ Navigation Router
│       └── package.json    <-- 📦 Web Dependencies
│
├── package.json            <-- 📋 Root Dependencies (Project Manager)
├── pnpm-workspace.yaml     <-- 📍 Workspace Config (Map of the house)
└── turbo.json              <-- ⏩ Turbo Config (Fast Builder)
```

---

## 🧐 Thorough Analysis: What Does Each Part Do?

Simple explanation suitable for anyone to understand!

### 1. The **ROOT** (`SupportAgent2/`)
This is the main container. It doesn't do the work itself, but **manages** the two big workers inside: `api` and `web`. It uses tools like `pnpm` and `turbo` to make sure both workers run fast and share tools.

### 2. The **BRAIN** (`apps/api/`)
This is the backend server. It's invisible to the user but does all the thinking.
*   **`src/agents/`**: This is where our AI characters live.
    *   **Router Agent**: The receptionist. It asks "How can I help you?" and decides where to send you.
    *   **Order Agent / Billing Agent**: The specialists. They have special instructions to handle specific tasks.
*   **`src/tools/`**: These are the "hands" of the AI. Providing capabilities like "Look up Order #123" or "Process Refund". Without tools, the AI can only talk; with tools, it can *act*.
*   **`src/chat/`**: This handles the flow of conversation. It makes sure messages go back and forth smoothly between the User and the Agents.
*   **`prisma/`**: This manages our long-term memory (Database). It remembers who the agents are and what their instructions are.

### 3. The **FACE** (`apps/web/`)
This is the website you actually see and click on.
*   **`pages/User.tsx`**: The Chat Interface. It looks like WhatsApp or iMessage. It displays the AI's response and lets you type.
*   **`pages/Admin.tsx`**: The Control Panel. This is for the "Boss". You can hire/fire agents (add/remove) and change their instructions (brainwash them) in real-time!
*   **`api/client.ts`**: The Messenger. It runs back and forth between the FACE and the BRAIN delivering messages.

---

## 🔗 How It All connects (Visual Flow)

Imagine you are sending a message. Here is the journey your message takes through the code:

```mermaid
graph TD
    User([👤 USER]) -->|Types 'Where is my order?'| UI[🖥️ FRONTEND (User.tsx)]
    
    UI -->|sends request| Client[📡 API CLIENT (client.ts)]
    Client -->|HTTP POST| Server[🚦 BACKEND SERVER (index.ts)]
    
    Server -->|Routes to| ChatService[💬 CHAT SERVICE]
    ChatService -->|Asks| RouterAgent[🔀 ROUTER AGENT (router.agent.ts)]
    
    RouterAgent -->|Decides: 'This is an Order question!'| OrderAgent[📦 ORDER AGENT (order.agent.ts)]
    
    OrderAgent -->|Uses Tool| DB[(💾 DATABASE / TOOLS)]
    DB -->|Returns: 'Order #123 is Shipped'| OrderAgent
    
    OrderAgent -->|Generates Reply| ChatService
    ChatService -->|Streams Text| UI
    
    UI -->|Displays: 'Your order is shipped!'| User
```

### In Simple Terms:
1.  **You** type in the **Web App**.
2.  The **Web App** calls the **Backend**.
3.  The **Backend** asks the **Router Agent** "Who should handle this?".
4.  The **Router** picks the **Order Agent**.
5.  The **Order Agent** checks the **Database**.
6.  The **Order Agent** writes a reply.
7.  The **Backend** sends the reply back to the **Web App**.
8.  **You** see the answer!

---

## 🚀 How to Run It

1.  **Install dependencies**: `pnpm install`
2.  **Start Database**: Ensure your database is running.
3.  **Run Development**: `pnpm dev`
    *   Web: `http://localhost:5173`
    *   API: `http://localhost:3000`

---
*Generated by Antigravity for SupportAgent2*
