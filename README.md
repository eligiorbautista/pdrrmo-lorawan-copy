# PDRRMO Mesh — Emergency Communication

A Progressive Web App for PDRRMO (Provincial Disaster Risk Reduction and Management Office) field communication via Meshtastic LoRa mesh networks.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 PDRRMO Command Center            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Dashboard │  │ Dispatch │  │ Backend (Bun) │  │
│  │ (Web UI)  │  │ (Web UI) │  │ + SQLite DB   │  │
│  └─────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│        └──────┬───────┘              │           │
│               │ WebSocket            │           │
│               └──────────┬──────────┘           │
│                          │ Serial/HTTP          │
│                    ┌─────┴─────┐                │
│                    │  Gateway  │                │
│                    │  Node     │                │
│                    └─────┬─────┘                │
└──────────────────────────┼──────────────────────┘
                           │ LoRa Mesh
        ┌──────────────────┼──────────────────┐
        │                  │                   │
  ┌─────┴─────┐      ┌────┴────┐        ┌────┴────┐
  │ Field Ops │      │ Vehicle │        │ Weather │
  │ (PWA + BT)│      │(PWA + BT)│       │ Station │
  └───────────┘      └─────────┘        └─────────┘
```

## Features

### Field Operations (PWA)
- **Bluetooth connection** to Meshtastic LoRa devices via Web Bluetooth API
- **Send/receive text messages** on the mesh network
- **Emergency button** — one-tap alert to command center with GPS location
- **Node discovery** — view nearby Meshtastic nodes with position and battery info
- **Node map** — view discovered nodes on an interactive Leaflet map with status indicators and GPS locations, allowing browser location sharing to update the device's hardware position
- **Offline-capable** — PWA with service worker, IndexedDB persistence

### Command Center (Backend)
- **Dashboard** — overview of all nodes, messages, and active alerts
- **Dispatch view** — alert queue with acknowledge/resolve workflow
- **Real-time WebSocket** updates from gateway node
- **SQLite** database for message and alert history
- **REST API** for alert management and message retrieval

## Prerequisites

- **Bun** ≥ 1.2 (JavaScript runtime & package manager)
- **Chromium-based browser** (Chrome, Edge, Opera, Brave) — required for Web Bluetooth API
- **Meshtastic device** (e.g., Heltec, RAK, LilyGo T-Beam) with firmware ≥ 2.5
- **HTTPS** or **localhost** — Web Bluetooth requires secure context

## Quick Start

### 1. Clone and install dependencies

```bash
git clone https://github.com/Yano-ai/pdrrmo-lorawan.git
cd pdrrmo-lorawan

# Install client dependencies
cd client
bun install

# Install server dependencies
cd ../server
bun install
```

### 2. Configure environment variables (REQUIRED before starting)

Both the client and server require `.env` files. You **must** create them from the provided templates **before** starting the dev servers.

```bash
# From the project root

# Client — copy template and remove the .example extension
cd client
cp .env.example .env

# Server — copy template and remove the .example extension
cd ../server
cp .env.example .env
```

> **Important:** After copying, open each `.env` file and update any variables needed for your environment. The defaults work for local development, but you should still verify them (e.g., `VITE_WS_URL`, `VITE_API_URL`, `PORT`, `CORS_ORIGINS`) before running the servers.

#### Client (`client/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_WS_URL` | `ws://localhost:3000/api/ws` | Backend WebSocket endpoint for real-time updates |
| `VITE_API_URL` | `http://localhost:3000/api` | Backend REST API base URL |

#### Server (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `HOST` | `0.0.0.0` | Bind address |
| `DB_PATH` | `./pdrrmo.db` | SQLite database file path |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Comma-separated allowed origins for CORS |
| `GATEWAY_URL` | — | Optional external gateway URL (e.g., LoRaWAN network server) |

### 3. Start the development server

```bash
# Terminal 1: Start the PWA frontend
cd client
bun dev
# → http://localhost:5173

# Terminal 2: Start the command center backend (optional)
cd server
bun dev
# → http://localhost:3000
```

### 3. Connect to a Meshtastic device

1. Power on your Meshtastic device (ensure Bluetooth is enabled)
2. Open the PWA in a Chromium-based browser
3. Click **Connect** in the top bar
4. Select your Meshtastic device from the Bluetooth picker
5. Wait for the status to show "Connected"

### 4. Send your first message

1. Navigate to **Field Ops**
2. Select a destination (Broadcast or a specific node)
3. Type a message and press Enter or click Send

## Project Structure

```
pdrrmo-lorawan/
├── client/                          # React PWA (frontend)
│   ├── .env.example                 # Client environment template
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── AlertCard.tsx         # Alert notification card
│   │   │   ├── ConnectionStatus.tsx  # BLE connection indicator
│   │   │   ├── EmergencyButton.tsx   # Panic button with confirmation
│   │   │   ├── ErrorBoundary.tsx     # React error boundary
│   │   │   ├── InstallPrompt.tsx     # PWA install prompt
│   │   │   ├── Layout.tsx           # App shell with navigation
│   │   │   ├── LogoIcon.tsx         # App logo component
│   │   │   ├── MessageThread.tsx    # Chat interface
│   │   │   ├── NodeList.tsx         # Connected nodes list
│   │   │   ├── PageWrapper.tsx      # Uniform page layout wrapper
│   │   │   └── Toast.tsx            # Toast notifications
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useEmergency.ts      # Emergency alert + retry logic
│   │   │   ├── useMessages.ts       # Message send/receive
│   │   │   ├── useMeshtastic.ts     # BLE connection lifecycle
│   │   │   ├── useNodes.ts          # Node DB accessors
│   │   │   ├── useOffline.ts        # Online/offline detection
│   │   │   ├── useReconnect.ts      # Exponential backoff reconnect
│   │   │   └── useWebSocket.ts      # Backend WS connection
│   │   ├── lib/                     # Utility modules
│   │   │   ├── db.ts               # IndexedDB persistence
│   │   │   ├── emergency.ts        # Emergency message format
│   │   │   ├── env.ts              # Environment variable validation
│   │   │   ├── meshtastic.ts       # MeshDevice initialization
│   │   │   └── types.ts            # App type definitions
│   │   ├── routes/                  # Page components
│   │   │   ├── Dashboard.tsx        # Command center overview
│   │   │   ├── Dispatch.tsx         # Alert dispatch queue
│   │   │   ├── FieldOps.tsx         # Field agent view
│   │   │   └── Map.tsx              # Interactive node map (Leaflet)
│   │   ├── store/                   # Zustand state stores
│   │   │   ├── deviceStore.ts       # Device + connection state
│   │   │   └── messageStore.ts      # Messages + alerts state
│   │   ├── App.tsx                  # Root component + routing
│   │   └── main.tsx                 # Entry point
│   └── public/                      # Static assets + PWA manifest
├── server/                          # Bun + Hono backend
│   ├── .env.example                 # Server environment template
│   └── src/
│       ├── db/                      # Database layer
│       │   ├── schema.ts           # SQLite schema + init
│       │   └── queries.ts          # Query helpers
│       ├── lib/                     # Backend utilities
│       │   ├── gateway.ts          # Meshtastic gateway stub
│       │   └── types.ts            # Server type definitions
│       ├── routes/                  # REST API endpoints
│       │   ├── alerts.ts           # Alert CRUD
│       │   ├── messages.ts         # Message history
│       │   └── nodes.ts           # Node registry
│       ├── ws/                      # WebSocket
│       │   └── handler.ts          # WS broadcast handler
│       └── index.ts                 # Hono server entry
└── README.md
```

## Environment Variables

Configuration is centralized via `.env` files in both the `client/` and `server/` directories. Copy `.env.example` to `.env` in each directory and customize as needed.

> **Note:** `.env` files are gitignored. Never commit secrets or production credentials. Use `.env.example` as a template.

### Client (`client/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_WS_URL` | `ws://localhost:3000/api/ws` | Backend WebSocket endpoint for real-time mesh updates |
| `VITE_API_URL` | `http://localhost:3000/api` | Backend REST API base URL |

### Server (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `HOST` | `0.0.0.0` | Bind address |
| `DB_PATH` | `./pdrrmo.db` | SQLite database file path |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Comma-separated allowed origins for CORS |
| `GATEWAY_URL` | — | Optional external gateway URL (e.g., LoRaWAN network server) |

## Browser Compatibility

| Feature | Chrome | Edge | Opera | Firefox | Safari |
|---|---|---|---|---|---|
| Web Bluetooth | ✅ | ✅ | ✅ | ❌ | ❌ |
| PWA Install | ✅ | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ | ✅ |

**Web Bluetooth is Chromium-only.** For non-Chromium browsers, use the command center backend with a dedicated gateway node (connected via serial/HTTP).

## Building for Production

```bash
# Build the PWA client
cd client
bun run build
# Output: client/dist/

# Build the server
cd server
bun build src/index.ts --target=bun --outdir=dist
# Output: server/dist/index.js

# Serve the PWA
cd client
bun run preview
# → http://localhost:4173

# Run the server
cd server
PORT=3000 bun run dist/index.js
```

## Deployment Notes

### Field Tablets
- Pre-pair the Meshtastic device via Chrome's Bluetooth settings
- Install the PWA to the home screen for offline access
- Use `bun run build` and serve `client/dist/` from any static host (nginx, Vercel, etc.)

### Command Center
- The backend (`server/`) runs on Bun; deploy to any VPS or on-premises server
- Connect a dedicated Meshtastic gateway node via USB serial
- Configure `DB_PATH` to a persistent volume for data retention

## License

GPL-3.0 — See the Meshtastic project for upstream license details.
