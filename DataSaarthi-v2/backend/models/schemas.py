from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class CSVUploadResponse(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int
    column_count: int
    dtypes: Dict[str, str]

class AnalyzeRequest(BaseModel):
    data: List[Dict[str, Any]]
    dataset_name: str = "Dataset"

class AnalyzeResponse(BaseModel):
    report: str

class CompareRequest(BaseModel):
    source: List[Dict[str, Any]]
    target: List[Dict[str, Any]]
    source_name: str = "Source"
    target_name: str = "Target"

class CompareResponse(BaseModel):
    report: str
    differences: List[str]
    summary: str

class ChatRequest(BaseModel):
    data: List[Dict[str, Any]]
    question: str
    history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    answer: str

class ChartRequest(BaseModel):
    data: List[Dict[str, Any]]
    x_column: str
    y_column: Optional[str] = None
    z_column: Optional[str] = None
    chart_type: str  # scatter, line, bar, histogram, pie, 3d_scatter

class SuggestChartRequest(BaseModel):
    data: List[Dict[str, Any]]
    x_column: str
    y_column: str

class DataSummaryRequest(BaseModel):
    data: List[Dict[str, Any]]
    columns: List[str]

class ExportCsvRequest(BaseModel):
    data: List[Dict[str, Any]]
    columns: List[str]
