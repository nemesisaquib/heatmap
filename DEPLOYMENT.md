# 🚀 Deploy — Free + Permanent (MongoDB Atlas)

Data now persists forever in MongoDB Atlas (free 512MB). Nothing wipes on restart.

---

## Run Local

```bash
npm install
npm start        # reads .env automatically
```

Open → `http://localhost:3000/dashboard.html`

> `.env` holds your `MONGODB_URI`. It is git-ignored — never committed.

---

## ⚠️ Windows DNS note (already fixed)

Node.js on this PC couldn't do `mongodb+srv://` SRV lookups (Kaspersky blocks
Node's DNS). Fixed by using the **non-SRV** connection string in `.env` —
connects to the 3 shard hosts directly. Works everywhere, including Render.

If you ever regenerate the string, keep the `mongodb://host1,host2,host3/...`
form, not `mongodb+srv://`.

---

## Go Live — Render.com (free)

### 1. MongoDB Atlas: allow all IPs
Atlas → **Network Access** → Add IP → `0.0.0.0/0` → Confirm.
(Render's servers need to reach your cluster.)

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "heatmap pro"
git remote add origin https://github.com/YOU/heatmap.git
git push -u origin main
```
`.gitignore` keeps `.env` and `node_modules` out. ✅

### 3. Create Render Web Service
render.com → **New Web Service** → connect repo:
- Build: `npm install`
- Start: `node server.js`
- Plan: **Free**

### 4. Add env vars in Render (Environment tab)
| Key | Value |
|-----|-------|
| `MONGODB_URI` | *(paste the non-SRV string from your `.env`)* |
| `DB_NAME` | `heatmappro` |

Deploy → `https://your-app.onrender.com`

---

## Put Tracker on Framer

Framer → **Site Settings → Custom Code → End of `<body>`**:

```html
<script src="https://your-app.onrender.com/tracker.js"></script>
<script>
  window.HMP_API_URL='https://your-app.onrender.com';
  HeatMapPro.init('YOUR-PROJECT-ID');
</script>
```

Get `YOUR-PROJECT-ID` from the dashboard's **Install Tracker** card after you
Analyze the URL.

Publish Framer → visitors click around → open dashboard → **real heatmap**.

---

## 🔐 Security TODO

Your DB password was shared in chat. After deploy works, **rotate it**:
Atlas → Database Access → Edit user → new password → update `.env` + Render env var.

---

## Endpoints

```
POST /api/projects              create project
POST /api/track                 record event
GET  /api/heatmap/:id?metric=   heatmap + stats  (clicks|scroll|move|attention)
GET  /api/export/:id/csv        CSV download
GET  /tracker.js                tracking script
GET  /dashboard.html            dashboard
GET  /api/health                status
```
