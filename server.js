require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'heatmappro';

if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI. Create a .env file (see .env.example).');
  process.exit(1);
}

let projects, events, ready = false;

async function connectDB() {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(DB_NAME);
  projects = db.collection('projects');
  events = db.collection('events');
  await events.createIndex({ project_id: 1, type: 1 });
  ready = true;
  console.log(`✅ MongoDB connected → db "${DB_NAME}"`);
}

// Guard: 503 until DB ready
app.use('/api', (req, res, next) => {
  if (!ready) return res.status(503).json({ error: 'Database connecting, try again in a moment' });
  next();
});

// 1. Create project
app.post('/api/projects', async (req, res) => {
  try {
    const { name, url } = req.body;
    const project = { _id: uuidv4(), name, url, created_at: new Date() };
    await projects.insertOne(project);
    res.json(project);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Analyze (no screenshot — dashboard uses live iframe)
app.post('/api/analyze', (req, res) => {
  res.json({ screenshotId: uuidv4(), url: req.body.url, message: 'Ready to track' });
});

// 3. Track event (tracker.js calls this)
app.post('/api/track', async (req, res) => {
  try {
    const { projectId, type, x, y, element, scrollDepth, timestamp, sessionId, userAgent, viewport } = req.body;
    const event = {
      _id: uuidv4(),
      project_id: projectId,
      type, x, y, element,
      scroll_depth: scrollDepth,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      session_id: sessionId,
      user_agent: userAgent,
      viewport,
      created_at: new Date()
    };
    await events.insertOne(event);
    res.json({ success: true, eventId: event._id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. Heatmap data + stats
app.get('/api/heatmap/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { metric = 'clicks' } = req.query;
    const data = await events.find({ project_id: projectId, type: metric }).toArray();

    const gridSize = 20;
    const heatmap = {};
    data.forEach(e => {
      if (e.x != null && e.y != null) {
        const gx = Math.floor(e.x / gridSize) * gridSize;
        const gy = Math.floor(e.y / gridSize) * gridSize;
        const key = `${gx},${gy}`;
        heatmap[key] = (heatmap[key] || 0) + 1;
      }
    });

    const maxCount = Math.max(...Object.values(heatmap), 1);
    const heatmapData = Object.entries(heatmap).map(([key, count]) => {
      const [x, y] = key.split(',').map(Number);
      return { x: x + gridSize / 2, y: y + gridSize / 2, count, intensity: count / maxCount };
    });

    const uniqueSessions = new Set(data.map(e => e.session_id)).size;
    const avgScrollDepth = data.length
      ? data.reduce((a, e) => a + (e.scroll_depth || 0), 0) / data.length : 0;

    res.json({ projectId, metric, totalEvents: data.length, uniqueSessions, avgScrollDepth, heatmapData });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. Export CSV
app.get('/api/export/:projectId/csv', async (req, res) => {
  try {
    const data = await events.find({ project_id: req.params.projectId }).toArray();
    let csv = 'EventID,Type,X,Y,ScrollDepth,SessionID,Timestamp\n';
    data.forEach(e => {
      csv += `${e._id},${e.type},${e.x || ''},${e.y || ''},${e.scroll_depth || ''},${e.session_id || ''},${e.timestamp ? e.timestamp.toISOString() : ''}\n`;
    });
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="heatmap-${req.params.projectId}.csv"`);
    res.send(csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Static
app.get('/tracker.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'tracker.js'));
});
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/stats.html', (req, res) => res.sendFile(path.join(__dirname, 'stats.html')));
app.get('/', (req, res) => res.redirect('/dashboard.html'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: ready ? 'connected' : 'connecting' }));

// Start
connectDB()
  .then(() => app.listen(PORT, () => {
    console.log(`🔥 Heatmap API on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
  }))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   → Check MONGODB_URI and whitelist 0.0.0.0/0 in Atlas Network Access.');
    process.exit(1);
  });
