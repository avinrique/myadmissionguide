// Hardcoded users (change these!)
const USERS = {
  admin: 'admission@2024',
  manager: 'prime@2024'
};

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (USERS[username] && USERS[username] === password) {
    // Create a simple token (base64 encoded username:timestamp)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    return res.status(200).json({ success: true, token, username });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
}
