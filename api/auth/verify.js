export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(200).json({ valid: false });
  }

  try {
    // Decode token (base64 encoded username:timestamp)
    const decoded = Buffer.from(token, 'base64').toString();
    const [username, timestamp] = decoded.split(':');

    // Check if token is less than 24 hours old
    const age = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (username && age < maxAge) {
      return res.status(200).json({ valid: true, username });
    }
  } catch (e) {
    // Invalid token format
  }

  return res.status(200).json({ valid: false });
}
