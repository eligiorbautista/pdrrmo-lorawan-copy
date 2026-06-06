# PDRRMO Mesh — Client (PWA)

React + TypeScript + Vite frontend for the PDRRMO emergency mesh communication system.

## Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your values (defaults work for local development)
VITE_WS_URL=ws://localhost:3000/api/ws
VITE_API_URL=http://localhost:3000/api
```

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun dev
# → http://localhost:5173
```

## Production Build

```bash
# Generate optimized production bundle
bun run build
# Output: dist/

# Preview production build locally
bun run preview
# → http://localhost:4173
```

## PWA Configuration

The app is built with `vite-plugin-pwa` and includes:
- Service worker with Workbox runtime caching
- Web App Manifest for installability
- Offline-capable via IndexedDB and service worker precaching

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS v4
- Zustand (state management)
- Lucide React (icons)
- Leaflet (maps)
- Vite PWA Plugin
