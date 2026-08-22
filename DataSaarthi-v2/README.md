# DataSaarthi v2

AI-powered data analytics platform for CSV data exploration, visualization, and insight generation. Upload a dataset, explore it in an interactive grid, generate charts, and get AI-driven analysis — all from your browser.

## Architecture

```
React Frontend  →  FastAPI Backend  →  Supabase (Auth + PostgreSQL)
                        ↓
                  Groq / OpenRouter (AI analysis)
```

The frontend communicates with the backend over REST. The backend handles CSV parsing, statistical analysis, and PDF export, while delegating authentication and persistence to Supabase and AI tasks to Groq (with OpenRouter as fallback).

## Features

- **Authentication** — Email/password sign-up and login via Supabase, plus a guest mode for quick access
- **CSV Upload & Parsing** — Upload CSV files and parse them server-side with Pandas
- **Interactive Data Editor** — Edit, sort, filter, and search data with AG Grid
- **2D & 3D Charts** — Create a wide range of visualizations with Plotly.js
- **AI Analysis** — Get automated data summaries, chart suggestions, and insight generation powered by Groq/OpenRouter
- **Dataset Comparison** — Compare two datasets and detect discrepancies
- **Conversational Q&A** — Ask natural-language questions about your data
- **Report Persistence** — Save, view, and delete reports stored in Supabase
- **Export** — Download results as PDF or CSV

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Python 3.13, FastAPI, Supabase (auth + PostgreSQL), Pandas, NumPy, SciPy, Groq, OpenRouter |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Plotly.js, AG Grid, shadcn/ui, Lucide icons |

## Project Structure

```
DataSaarthi-v2/
├── backend/
│   ├── main.py                  # FastAPI application
│   ├── models/schemas.py        # Pydantic models
│   ├── services/
│   │   ├── supabase_service.py  # Auth + database
│   │   ├── data_service.py      # CSV parsing, stats, PDF
│   │   └── groq_service.py      # AI analysis
│   ├── supabase/migrations/     # SQL migrations
│   ├── tests/                   # Pytest tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks
│   │   ├── services/api.ts      # API client
│   │   └── types/               # TypeScript types
│   ├── package.json
│   └── .env.example
└── README.md
```

## Setup

### Prerequisites

- Python 3.13+
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the migration at `backend/supabase/migrations/20250129_create_reports.sql`.
3. Copy your **Project URL** and **Service Role Key** from Settings → API.

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `GROQ_API_KEY` | Groq API key (optional) |
| `OPENROUTER_API_KEY` | OpenRouter API key (optional, fallback) |
| `GUEST_TOKEN` | Secret token for guest mode |
| `ALLOW_ORIGINS` | CORS allowed origins |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (default: `http://localhost:8000`) |
| `VITE_GUEST_TOKEN` | Must match backend `GUEST_TOKEN` |

## Testing

```bash
# Backend tests
cd backend
python -m pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

## Known Limitations

- Some frontend tests have React 19 compatibility issues (test-environment only; production is unaffected).
- AI features require a Groq or OpenRouter API key.
- CSV upload is limited to 5 MB and 5,000 rows.
- Guest mode uses a static token — not suitable for production.
