# Plan: Torn RW Feed Frontend Client

A sleek, responsive, dark-themed dashboard tailored specifically for tracking Ranked Wars in real-time. This frontend operates as a decoupled client, communicating entirely via JSON with the compiled C++ Oat++ backend deployed on Render.

---

## 🛠️ Tech Stack & Architecture

* **Core:** HTML5, Semantic JavaScript (ES6+ Async/Await)
* **Styling:** Tailwind CSS (via CDN or Play CDN for rapid, utility-first dark mode development)
* **State Management:** Lightweight Vanilla JS state object or Alpine.js (for reactive UI components without build-step overhead)
* **Hosting:** Cloudflare Pages or Vercel (Free, ultra-fast static hosting with global edge routing)

---

## 📋 Core Features & Requirements

### 1. Secure Authentication & Key Pooling
* **API Key Input:** A clean, minimal login block matching the original aesthetic to capture a user's Torn API Key (Public/Limited).
* **Persistence:** Encrypt or safely store the API key locally in the browser’s `localStorage` to persist sessions.
* **Handshake validation:** Send a payload verification request to the Render C++ backend to authorize access.

### 2. Real-Time Ranked War Dashboard
* **Faction War Progress:** Dynamic visual progress bars showing respect, points, or lead margins between the two competing factions.
* **Live Target Tracker:** A high-visibility table/grid displaying assigned war targets, including current status (Okay, Hospital, Traveling).
* **Stats Integration:** Unified data displays blending baseline profiles with external lookups (TornStats/FFScouter data cached by the backend).

### 3. Mobile-First Optimization
* **Responsive Layouts:** Zero side-scrolling. Single-column stacks for mobile devices so faction members can track active chains and targets cleanly mid-flight on mobile browsers.

---

## 🗺️ UI/UX & Component Wireframe

### Page 1: Gateway (`/login`)
* **Hero Text:** "Torn RW Feed — Dominate Ranked Wars with real-time intelligence."
* **Component:** Dark card grid summarizing features (Real-time updates, Stats integration, Mobile support, Efficient API usage).
* **Auth Box:** Floating right-hand (or centered on mobile) form with a single masked password input for the Torn API Key and a prominent "Connect" button.

### Page 2: Main Command Dashboard (`/dashboard`)
* **Header:** Connected Faction Name, Current War Status, and an explicit "Disconnect/Logout" button.
* **Sidebar/Top Navigation:** * 🎯 Targets Tracker
    * 🛡️ Faction Members
    * 📊 War Statistics
* **Main Workspace:**
    * **Target Cards:** Dynamic cards displaying target name, level, current life/status badge (Green for Okay, Red for Hospital with an optional countdown timer if exposed by the API).

---

## 🔗 Backend API Integration Mapping

The frontend client expects to map interactions to the underlying database structures exposed by your C++ controllers:

| Frontend View | Backend Resource Endpoint | DB Table Association |
| :--- | :--- | :--- |
| **Authentication Form** | `POST /api/v1/auth` or equivalent | `api_keys`, `users` |
| **Target Grid** | `GET /api/v1/targets` | `targets` |
| **Faction Overview** | `GET /api/v1/factions` | `factions` |
| **Member List / Scouter** | `GET /api/v1/members` | `member_stats` |

---

## 🚀 Step-by-Step Development Roadmap

### Phase 1: Environment & Layout Foundations
* [ ] Initialize a single-page template (`index.html`) with Tailwind CSS configured natively for dark mode (`bg-zinc-950 text-zinc-50`).
* [ ] Construct the login interface mockup to replicate the clean dark layout of `rw.tornlabs.de`.
* [ ] Implement toggleable UI views (`#login-view` vs `#dashboard-view`) using hidden utility classes to avoid complex frontend routing routers.

### Phase 2: State Logic & Network Integration
* [ ] Write the core JavaScript `API` client wrapper containing `fetch()` templates preset with global config headers targeting `https://tornrwfeed.onrender.com`.
* [ ] Add automated session checking: If an API key exists in `localStorage`, skip the login card and automatically render the dashboard workspace.
* [ ] Handle network failure states: Render explicit user-friendly warnings if Render's free-tier container is waking up from a cold spin-down.

### Phase 3: Component Populating
* [ ] Build the dynamic data-injector functions to map incoming JSON arrays from your target/member endpoints into modular HTML card rows.
* [ ] Add visual status styling maps (e.g., mapping target status strings directly to vibrant Tailwind badge styles like `bg-red-500/10 text-red-400`).

### Phase 4: Refinement & Live Polling
* [ ] Implement an explicit refresh polling cycle (e.g., fetching fresh payloads every 30 seconds during active wars) using a controlled `setInterval` routine.
* [ ] Audit responsive break-points on desktop and mobile viewports.