const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ AUTHENTICATION CONFIG ============
// Change these credentials!
const USERS = {
  admin: 'admission@2024',
  manager: 'prime@2024'
};

// Session storage (in-memory)
const sessions = new Map();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isValidSession(token) {
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expires) {
    sessions.delete(token);
    return false;
  }
  return true;
}

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware for protected routes
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !isValidSession(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Serve static files (dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage
let leads = [];

// ============ AUTH ROUTES ============
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (USERS[username] && USERS[username] === password) {
    const token = generateToken();
    sessions.set(token, {
      username,
      expires: Date.now() + SESSION_DURATION
    });
    console.log('Login successful:', username);
    return res.json({ success: true, token, username });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    sessions.delete(token);
  }
  res.json({ success: true });
});

app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && isValidSession(token)) {
    const session = sessions.get(token);
    return res.json({ valid: true, username: session.username });
  }
  return res.json({ valid: false });
});

// ============ LEAD ROUTES ============
// Public - anyone can submit leads
app.post('/api/leads', (req, res) => {
  const lead = req.body;

  if (!lead.name || !lead.phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const newLead = {
    id: Date.now().toString(),
    ...lead,
    createdAt: new Date().toISOString(),
  };

  leads.push(newLead);
  console.log('New lead:', newLead.name, newLead.phone);

  res.status(201).json({ success: true, id: newLead.id });
});

// Protected - only authenticated users can view leads
app.get('/api/leads', requireAuth, (req, res) => {
  const sortedLeads = [...leads].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sortedLeads);
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   MyAdmissionGuide Server Running         ║
  ╠═══════════════════════════════════════════╣
  ║   Dashboard: http://localhost:${PORT}         ║
  ║   API:       http://localhost:${PORT}/api     ║
  ╚═══════════════════════════════════════════╝
  `);
});
