# myadmissionguide

Backend API and dashboard for MyAdmissionGuide college rank predictor leads.

## Setup

### Environment Variables

Set the following environment variable (in Vercel or `.env` locally):

```
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/predictor?retryWrites=true&w=majority
```

### Local Development

```bash
npm install
npm start
```

Access at http://localhost:3000

### Deploy to Vercel

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add `MONGODB_URI` in Vercel Environment Variables
4. Deploy

## API Endpoints

### POST /api/leads
Submit a new lead (public).

### GET /api/leads
Fetch all leads (requires auth).

### POST /api/auth/login
Login with username/password.

### GET /api/auth/verify
Verify auth token.
