# Torn RW Feed Frontend

A sleek, responsive, dark-themed dashboard for tracking Ranked Wars in real-time.

## Structure

- `index.html` - Single-page application with toggleable login/dashboard views
- `app.js` - Vanilla JavaScript client with WebSocket integration

## Features

### Phase 1: Environment & Layout (Complete)
- ✅ Dark mode with Tailwind CSS (zinc-950 background)
- ✅ Login interface with API key input
- ✅ Dashboard view with navigation tabs
- ✅ Responsive design (mobile-first)

### Phase 2: State Logic & Network Integration (Complete)
- ✅ API client wrapper with fetch() templates
- ✅ Session persistence via localStorage
- ✅ WebSocket connection for real-time updates

### Phase 3: Component Populating (Complete)
- ✅ Dynamic target rendering with status badges
- ✅ War progress bars
- ✅ Member status tracking

### Phase 4: Refinement (Partial)
- ⏳ Polling cycle (replaced with WebSocket real-time)
- ⏳ Mobile breakpoint audit

## Deployment

Deploy to Cloudflare Pages or Vercel by pointing to this `public/` directory.