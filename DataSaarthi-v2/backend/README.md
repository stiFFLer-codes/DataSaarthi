# Backend Setup

This backend uses FastAPI with Supabase for auth and saved reports.

## Required environment

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GUEST_TOKEN`
- `ALLOW_ORIGINS`

Optional AI providers:

- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`

## Supabase migration

Run [`supabase/migrations/20250129_create_reports.sql`](supabase/migrations/20250129_create_reports.sql) in the Supabase SQL editor before using report save/load endpoints.

## Local run

1. Create `backend/.env` from the values above.
2. Install dependencies with `pip install -r requirements.txt`.
3. Start the server with `uvicorn main:app --reload --port 8000`.

The frontend expects the backend at `http://localhost:8000` by default.