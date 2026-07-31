import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
from io import BytesIO, StringIO
from sklearn.cluster import KMeans
from scipy import stats
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
import base64
import html

def parse_csv(content: bytes) -> Tuple[List[str], List[Dict[str, Any]], Dict[str, str]]:
    """Parse CSV bytes into structured data."""
    df = pd.read_csv(BytesIO(content))
    columns = df.columns.tolist()
    # Convert to records, handling NaN
    records = []
    for _, row in df.iterrows():
        record = {}
        for col in columns:
            val = row[col]
            if pd.isna(val):
                record[col] = None
            elif isinstance(val, (np.integer, np.floating)):
                record[col] = val.item()
            else:
                record[col] = val
        records.append(record)
    dtypes = {col: str(df[col].dtype) for col in columns}
    return columns, records, dtypes

def generate_summary(data: List[Dict[str, Any]], columns: List[str]) -> Dict[str, Any]:
    """Generate descriptive statistics."""
    df = pd.DataFrame(data)
    summary = {}
    for col in columns:
        if col not in df.columns:
            continue
        col_data = df[col]
        non_null = col_data.dropna()
        s = {
            "type": str(col_data.dtype),
            "non_null": int(non_null.count()),
            "null_count": int(col_data.isna().sum()),
            "unique": int(col_data.nunique()),
        }
        if pd.api.types.is_numeric_dtype(col_data):
            def safe_float(val):
                if val is None or (isinstance(val, float) and np.isnan(val)):
                    return None
                return round(float(val), 4)
            s["mean"] = safe_float(non_null.mean()) if len(non_null) > 0 else None
            s["std"] = safe_float(non_null.std()) if len(non_null) > 0 else None
            s["min"] = safe_float(non_null.min()) if len(non_null) > 0 else None
            s["max"] = safe_float(non_null.max()) if len(non_null) > 0 else None
        summary[col] = s
    return summary

def detect_anomalies(data: List[Dict[str, Any]], columns: List[str]) -> List[Dict[str, Any]]:
    """Detect anomalies using Z-score and IQR."""
    df = pd.DataFrame(data)
    anomalies = []
    numeric_cols = [c for c in columns if pd.api.types.is_numeric_dtype(df[c])]
    for col in numeric_cols:
        col_data = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(col_data) < 5:
            continue
        # Z-score outliers
        z_scores = np.abs(stats.zscore(col_data))
        outlier_indices = col_data.index[z_scores > 3].tolist()
        # IQR outliers
        q1 = col_data.quantile(0.25)
        q3 = col_data.quantile(0.75)
        iqr = q3 - q1
        iqr_outliers = col_data.index[(col_data < (q1 - 1.5 * iqr)) | (col_data > (q3 + 1.5 * iqr))].tolist()
        all_outliers = set(outlier_indices) | set(iqr_outliers)
        for idx in all_outliers:
            anomalies.append({
                "row": int(idx),
                "column": col,
                "value": float(df.loc[idx, col]) if not pd.isna(df.loc[idx, col]) else None,
                "method": "z-score" if idx in outlier_indices else "IQR",
            })
    return anomalies

def generate_discrepancy_report(source: List[Dict[str, Any]], target: List[Dict[str, Any]]) -> Tuple[str, List[str]]:
    """Compare two datasets row-by-row and column-by-column."""
    source_df = pd.DataFrame(source)
    target_df = pd.DataFrame(target)
    lines = []
    diffs = []

    lines.append(f"Source shape: {source_df.shape}")
    lines.append(f"Target shape: {target_df.shape}")
    lines.append("")

    source_cols = set(source_df.columns)
    target_cols = set(target_df.columns)
    missing = source_cols - target_cols
    extra = target_cols - source_cols
    common = source_cols & target_cols

    if missing:
        lines.append(f"Columns missing in target: {', '.join(missing)}")
        diffs.append(f"Missing columns: {', '.join(missing)}")
    else:
        lines.append("No columns missing in target.")

    if extra:
        lines.append(f"Extra columns in target: {', '.join(extra)}")
        diffs.append(f"Extra columns: {', '.join(extra)}")
    else:
        lines.append("No extra columns in target.")

    lines.append("")
    min_rows = min(len(source_df), len(target_df))
    row_diffs = []
    for i in range(min_rows):
        for col in common:
            sv = source_df.iloc[i][col]
            tv = target_df.iloc[i][col]
            if pd.isna(sv) and pd.isna(tv):
                continue
            if str(sv) != str(tv):
                row_diffs.append(f"Row {i+1}, Column '{col}': source='{sv}' vs target='{tv}'")
    if row_diffs:
        lines.append("Differences in common rows:")
        lines.extend(row_diffs)
        diffs.extend(row_diffs)
    else:
        lines.append("No differences found in common rows.")

    if len(source_df) != len(target_df):
        lines.append(f"\nRow count differs: Source={len(source_df)}, Target={len(target_df)}")
        diffs.append(f"Row count differs: Source={len(source_df)}, Target={len(target_df)}")

    summary = f"Found {len(diffs)} discrepancy types across {min_rows} compared rows."
    return "\n".join(lines), diffs, summary

def create_pdf(report_text: str, filename: str = "report.pdf") -> str:
    """Create a multi-page PDF from report text and return a base64 data URL."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    styles = getSampleStyleSheet()
    story = [
        Paragraph("<b>DataSaarthi Report</b>", styles["Title"]),
        Spacer(1, 0.2 * inch),
    ]
    for line in report_text.splitlines():
        safe = html.escape(line).replace("\t", "&nbsp;&nbsp;&nbsp;&nbsp;")
        if safe.strip() == "":
            story.append(Spacer(1, 0.1 * inch))
        else:
            story.append(Paragraph(safe, styles["BodyText"]))
    doc.build(story)
    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode()
    return f"data:application/pdf;base64,{b64}"

def export_csv(data: List[Dict[str, Any]], columns: List[str]) -> str:
    """Export data to CSV string."""
    df = pd.DataFrame(data, columns=columns)
    return df.to_csv(index=False)

def get_numeric_columns(data: List[Dict[str, Any]], columns: List[str]) -> List[str]:
    df = pd.DataFrame(data)
    return [c for c in columns if pd.api.types.is_numeric_dtype(df[c])]

def get_categorical_columns(data: List[Dict[str, Any]], columns: List[str]) -> List[str]:
    df = pd.DataFrame(data)
    return [c for c in columns if not pd.api.types.is_numeric_dtype(df[c])]
