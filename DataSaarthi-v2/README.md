# DataSaarthi v2

An AI-powered data analysis and dataset inspection workbench designed to guide analysts from raw tabular data to actionable visualizations and persistent reports.

---

## Target User Journey

DataSaarthi v2 is structured around a streamlined, reliable 9-step analytical journey:

$$\text{LOGIN} \longrightarrow \text{UPLOAD} \longrightarrow \text{INSPECT} \longrightarrow \text{CHART} \longrightarrow \text{ANALYZE} \longrightarrow \text{SAVE} \longrightarrow \text{VIEW REPORTS} \longrightarrow \text{DELETE} \longrightarrow \text{LOGOUT}$$

1. **LOGIN** — Authenticate securely with Supabase Email/Password or jump in instantly via Guest Mode.
2. **UPLOAD** — Drag-and-drop CSV datasets with live schema parsing and optional reference dataset pairing.
3. **INSPECT** — Sort, filter, search, and edit tabular rows directly in an interactive AG Grid data workspace.
4. **CHART** — Render interactive 2D (Bar, Line, Scatter, Histogram, Pie) and 3D (Scatter, Line, Surface) Plotly visualizations with automatic axis defaults and AI suggestions.
5. **ANALYZE** — Run statistical analysis, anomaly detection, and LLM-driven executive synthesis (Individual or Combined).
6. **SAVE** — Persist generated markdown analysis directly to Supabase with custom title tagging.
7. **VIEW REPORTS** — Search, filter, expand, read, and export saved reports with formatted markdown and PDF downloads.
8. **DELETE** — Manage and prune stored reports with ownership protection.
9. **LOGOUT** — Securely invalidate session and return to the entry gateway.

---

## Architecture

```
React 19 Frontend  ──(REST + Bearer Token)──►  FastAPI Backend  ──►  Supabase (Auth + RLS PostgreSQL)
                                                     │
                                                     ▼
                                        Groq / OpenRouter (LLM Synthesis)
```

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + AG Grid + Plotly.js + Lucide Icons.
- **Backend**: Python 3.13 + FastAPI + Pandas + NumPy + SciPy + Supabase Service Client + Groq API.
- **Security & Authorization**: Supabase Auth JWT token extraction, application-level ownership verification, and PostgreSQL Row-Level Security (RLS) on reports.

---

## Project Structure

```
DataSaarthi-v2/
├── backend/
│   ├── main.py                  # FastAPI application & REST endpoints
│   ├── models/schemas.py        # Pydantic data & request/response schemas
│   ├── services/
│   │   ├── supabase_service.py  # Supabase client, auth & report persistence
│   │   ├── data_service.py      # Pandas parsing, summary stats, PDF generation
│   │   └── groq_service.py      # Groq / OpenRouter AI analysis & chat
│   ├── supabase/migrations/     # SQL migrations (reports table + RLS)
│   ├── tests/                   # Pytest test suite (30/30 passing)
│   ├── requirements.txt         # Python dependencies
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # UI pages & components
│   │   │   ├── SaarthiLogo.tsx  # Minimalist charioteer compass mark & spinner
│   │   │   ├── SimpleMarkdown.tsx # Markdown renderer
│   │   │   ├── AuthPage.tsx     # Login / Registration / Guest gateway
│   │   │   ├── UploadPage.tsx   # CSV dropzone & upload management
│   │   │   ├── DataEditor.tsx   # AG Grid inspection & table editing
│   │   │   ├── ChartsPage.tsx   # 2D/3D Plotly visualizer & AI suggest
│   │   │   ├── AnalysisPage.tsx # Statistical & AI executive report generation
│   │   │   ├── ComparePage.tsx  # Reference dataset comparison & discrepancy detection
│   │   │   ├── ChatPage.tsx     # Conversational dataset Q&A
│   │   │   ├── ReportsPage.tsx  # Persistent report repository, reader & PDF export
│   │   │   └── Layout.tsx       # Main navigation layout & session controls
│   │   ├── hooks/               # useAuth custom hook & token management
│   │   ├── services/api.ts      # Typed API client with Bearer auth headers
│   │   ├── types/               # TypeScript interfaces & domain types
│   │   └── __tests__/           # Vitest test suite (22/22 passing)
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## Quick Start

### 1. Prerequisites
- Python 3.13+
- Node.js 18+
- Supabase project credentials

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate    # macOS/Linux

pip install -r requirements.txt
cp .env.example .env            # Configure SUPABASE_URL, SUPABASE_SERVICE_KEY, GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Testing

### Backend Test Suite (Pytest)
```bash
cd backend
python -m pytest tests/ -v
# 30 passed in ~2.5s
```

### Frontend Test Suite (Vitest)
```bash
cd frontend
npm test
# 22 passed across 4 test suites
```

### Production Build Verification
```bash
cd frontend
npm run build
# tsc -b && vite build -> 0 errors
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project API URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `GROQ_API_KEY` | Groq API key for Llama 3 analysis |
| `OPENROUTER_API_KEY` | OpenRouter API key (fallback) |
| `GUEST_TOKEN` | Secret token for guest login mode |
| `ALLOW_ORIGINS` | Allowed CORS origins |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend REST URL (default: `http://localhost:8000`) |
| `VITE_GUEST_TOKEN` | Secret token matching backend guest token |
