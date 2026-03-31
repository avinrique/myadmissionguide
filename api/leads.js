/**
 * Leads API with MongoDB Atlas storage (free tier)
 *
 * Setup:
 * 1. Go to https://mongodb.com/atlas and create free account
 * 2. Create a free cluster (M0)
 * 3. Create database user (username/password)
 * 4. Get connection string (Database > Connect > Drivers)
 * 5. Add to Vercel Environment Variables:
 *    - MONGODB_URI = mongodb+srv://username:password@cluster.xxxxx.mongodb.net/predictor?retryWrites=true&w=majority
 */

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'predictor1';
const COLLECTION_NAME = 'leads';

let cachedClient = null;

async function getClient() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

async function getCollection() {
  const client = await getClient();
  return client.db(DB_NAME).collection(COLLECTION_NAME);
}

// Simple auth check
function isValidToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [username, timestamp] = decoded.split(':');
    const age = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000;
    return username && age < maxAge;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if MongoDB is configured
  if (!MONGODB_URI) {
    return res.status(500).json({ error: 'Database not configured. Set MONGODB_URI.' });
  }

  try {
    const collection = await getCollection();

    // POST - Submit lead (public)
    if (req.method === 'POST') {
      const lead = req.body || {};

      if (!lead.name || !lead.phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
      }

      const newLead = {
        ...lead,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(newLead);
      console.log('New lead:', newLead.name, newLead.phone);

      return res.status(201).json({ success: true, id: result.insertedId });
    }

    // GET - Fetch leads (requires auth)
    if (req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!isValidToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const leads = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(leads);
    }

    // DELETE - Remove lead by ID (requires auth)
    if (req.method === 'DELETE') {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!isValidToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Lead ID is required' });
      }

      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}
