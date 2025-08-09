### Gemini setup for backend

1) Create a `.env` file in `backend/` (next to `index.js`) with:

```
PGHOST=localhost
PGPORT=5432
PGDATABASE=todo
PGUSER=postgres
PGPASSWORD=your_password
JWT_SECRET=replace_with_strong_secret
GOOGLE_API_KEY=your_google_api_key_here
AI_MODEL=gemini-1.5-flash
```

2) Restart the backend:

```
cd backend
npm run dev
```

3) Test Gemini call:

```
node scripts/test_gemini.js
```

You should see `Response: pong`.


