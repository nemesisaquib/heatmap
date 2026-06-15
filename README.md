# 🔥 Heatmap Pro — 100% Free, Zero Config

Real-time click / scroll / mouse / attention heatmaps overlaid on your live site.
No database signup. No Puppeteer. No Python. No fees.

```bash
npm install
npm start
# open http://localhost:3000/dashboard.html
# click "Demo data" → heatmap appears instantly
```

---

## What's Inside

| File | Role |
|------|------|
| `server.js` | Express API + JSON file storage (`data.json`) |
| `tracker.js` | Embed on any site to track real users |
| `dashboard.html` | Live dashboard — iframe preview + heatmap overlay |
| `package.json` | 3 deps: express, cors, uuid |
| `DEPLOYMENT.md` | Go-live guide + hosting notes |

---

## Features

- ✅ Live website preview (iframe) with heatmap overlaid on top
- ✅ 4 layers: **Clicks · Scroll · Mouse · Attention**
- ✅ One-click **Demo data** — seeds real events through the live API
- ✅ Auto-refresh **Live** mode (4s polling)
- ✅ Copy-paste **install snippet** (project ID auto-filled)
- ✅ Export CSV + heatmap image
- ✅ Light / dark theme
- ✅ Accessible: SVG icons, aria-live toasts, keyboard, reduced-motion

---

## How It Works

1. Embed `tracker.js` on your site (snippet from dashboard's *Install* card).
2. Visitors click/scroll/move → `tracker.js` POSTs events to `/api/track`.
3. Server stores them in `data.json`.
4. Dashboard polls `/api/heatmap/:id` and paints the overlay.

No screenshots needed — the dashboard loads your **live page** in an iframe and
draws the heatmap on top.

> Note: sites that send `X-Frame-Options: DENY` can't be framed. The heatmap
> then renders on a neutral grid — data still works, just no page background.

---

## Deploy Free

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** — works on Render, Railway, Fly.io,
Glitch. One caveat documented there: free tiers wipe the JSON file on restart
(fine for demos; swap to a free cloud DB for permanent storage — ask and it's a
small change).

---

**Cost: $0. Setup: one `npm install`.**
