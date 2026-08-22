"""
DataSaarthi v2 Backend
FastAPI + Groq + Supabase
"""
import os
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

from models.schemas import (
    AnalyzeRequest, AnalyzeResponse,
    CompareRequest, CompareResponse,
    ChatRequest, ChatResponse,
    SuggestChartRequest,
    DataSummaryRequest, ExportCsvRequest,
)
from services import groq_service, supabase_service, data_service

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("DataSaarthi backend starting...")
    yield
    print("DataSaarthi backend shutting down...")

app = FastAPI(
    title="DataSaarthi API",
    description="AI-powered data analytics backend",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
allow_origins = os.getenv("ALLOW_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allow_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

# ──────────────────────────────────────────────
# Auth dependency
# ──────────────────────────────────────────────
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    token = credentials.credentials if credentials else None
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    if token == os.getenv("GUEST_TOKEN"):
        return {"id": "guest", "email": "guest@datasaarthi.local"}

    try:
        user = supabase_service.get_user_by_token(token)
    except Exception:
        user = None

    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

# ──────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "DataSaarthi API v2.0", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# ──────────────────────────────────────────────
# Auth (proxy to Supabase)
# ──────────────────────────────────────────────
@app.post("/auth/register")
def register(email: str = Form(...), password: str = Form(...)):
    try:
        result = supabase_service.sign_up(email, password)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
def login(email: str = Form(...), password: str = Form(...)):
    try:
        result = supabase_service.sign_in(email, password)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/auth/guest")
def guest_login():
    token = os.getenv("GUEST_TOKEN")
    if not token:
        raise HTTPException(status_code=503, detail="Guest mode is not configured")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": "guest", "email": "guest@datasaarthi.local"},
    }

# ──────────────────────────────────────────────
# CSV Upload & Data Processing
# ──────────────────────────────────────────────
@app.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(413, "File too large. Maximum size is 5MB.")
    try:
        columns, rows, dtypes = data_service.parse_csv(content)
        # Limit rows to prevent OOM
        if len(rows) > 5000:
            rows = rows[:5000]
        summary = data_service.generate_summary(rows, columns)
        anomalies = data_service.detect_anomalies(rows, columns)
        return {
            "filename": file.filename,
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "column_count": len(columns),
            "dtypes": dtypes,
            "summary": summary,
            "anomalies": anomalies,
        }
    except Exception as e:
        raise HTTPException(400, f"Error parsing CSV: {str(e)}")

@app.post("/upload/raw")
async def upload_csv_raw(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Lightweight upload — just parse, no analysis."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(413, "File too large. Maximum size is 5MB.")
    try:
        columns, rows, dtypes = data_service.parse_csv(content)
        # Limit rows to prevent OOM
        if len(rows) > 5000:
            rows = rows[:5000]
        return {
            "filename": file.filename,
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "column_count": len(columns),
            "dtypes": dtypes,
        }
    except Exception as e:
        raise HTTPException(400, f"Error parsing CSV: {str(e)}")

# ──────────────────────────────────────────────
# Data Summary & Stats
# ──────────────────────────────────────────────
@app.post("/data/summary")
def data_summary(
    req: DataSummaryRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    try:
        summary = data_service.generate_summary(req.data, req.columns)
        anomalies = data_service.detect_anomalies(req.data, req.columns)
        numeric = data_service.get_numeric_columns(req.data, req.columns)
        categorical = data_service.get_categorical_columns(req.data, req.columns)
        return {
            "summary": summary,
            "anomalies": anomalies,
            "numeric_columns": numeric,
            "categorical_columns": categorical,
        }
    except Exception as e:
        raise HTTPException(400, str(e))

# ──────────────────────────────────────────────
# AI Analysis
# ──────────────────────────────────────────────
@app.post("/analyze")
def analyze(req: AnalyzeRequest, user: Dict[str, Any] = Depends(get_current_user)):
    try:
        report = groq_service.analyze_dataset(req.data, req.dataset_name)
        return AnalyzeResponse(report=report)
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {str(e)}")

@app.post("/analyze/combined")
def analyze_combined(req: AnalyzeRequest, user: Dict[str, Any] = Depends(get_current_user)):
    try:
        report = groq_service.analyze_combined(req.data)
        return AnalyzeResponse(report=report)
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {str(e)}")

# ──────────────────────────────────────────────
# Chart Suggestions
# ──────────────────────────────────────────────
@app.post("/charts/suggest")
def suggest_chart(req: SuggestChartRequest, user: Dict[str, Any] = Depends(get_current_user)):
    try:
        suggestion = groq_service.suggest_chart(req.data, req.x_column, req.y_column)
        return {"suggestion": suggestion}
    except Exception as e:
        raise HTTPException(500, f"Suggestion failed: {str(e)}")

# ──────────────────────────────────────────────
# Reference Comparison
# ──────────────────────────────────────────────
@app.post("/compare")
def compare(req: CompareRequest, user: Dict[str, Any] = Depends(get_current_user)):
    try:
        report, diffs, summary = data_service.generate_discrepancy_report(
            req.source, req.target
        )
        return CompareResponse(report=report, differences=diffs, summary=summary)
    except Exception as e:
        raise HTTPException(400, f"Comparison failed: {str(e)}")

# ──────────────────────────────────────────────
# Chat with Data
# ──────────────────────────────────────────────
@app.post("/chat")
def chat(req: ChatRequest, user: Dict[str, Any] = Depends(get_current_user)):
    try:
        answer = groq_service.chat_with_data(req.data, req.question, req.history or [])
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(500, f"Chat failed: {str(e)}")

# ──────────────────────────────────────────────
# PDF Report Generation
# ──────────────────────────────────────────────
@app.post("/report/pdf")
def generate_pdf(
    report_text: str = Form(...),
    user: Dict[str, Any] = Depends(get_current_user),
):
    try:
        data_url = data_service.create_pdf(report_text)
        return {"pdf_url": data_url}
    except Exception as e:
        raise HTTPException(500, f"PDF generation failed: {str(e)}")

# ──────────────────────────────────────────────
# CSV Export
# ──────────────────────────────────────────────
@app.post("/export/csv")
def export_csv(
    req: ExportCsvRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    try:
        csv = data_service.export_csv(req.data, req.columns)
        return {"csv": csv}
    except Exception as e:
        raise HTTPException(400, str(e))

# ──────────────────────────────────────────────
# Reports (saved to Supabase)
# ──────────────────────────────────────────────
def verify_ownership(user: Dict[str, Any], target_user_id: str):
    if user["id"] != target_user_id:
        raise HTTPException(403, "Forbidden: Cannot access reports for another user")

@app.post("/reports/save")
def save_report(
    user_id: str = Form(...),
    title: str = Form(...),
    content: str = Form(...),
    user: Dict[str, Any] = Depends(get_current_user),
):
    verify_ownership(user, user_id)
    try:
        report = supabase_service.save_report(user_id, title, content)
        return {"status": "success", "report": report}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/reports/{user_id}")
def get_reports(user_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    verify_ownership(user, user_id)
    try:
        reports = supabase_service.get_reports(user_id)
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.delete("/reports/{report_id}")
def delete_report(report_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    try:
        report = supabase_service.get_report_by_id(report_id)
        if not report:
            raise HTTPException(404, "Report not found")
        verify_ownership(user, report["user_id"])
        supabase_service.delete_report(report_id)
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
