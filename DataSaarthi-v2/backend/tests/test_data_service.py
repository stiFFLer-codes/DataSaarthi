import pytest
from services.data_service import (
    parse_csv,
    generate_summary,
    detect_anomalies,
    generate_discrepancy_report,
    create_pdf,
    export_csv,
    get_numeric_columns,
    get_categorical_columns,
)

def test_parse_csv():
    csv_content = b"id,name,age\n1,Alice,30\n2,Bob,\n3,Charlie,25"
    columns, records, dtypes = parse_csv(csv_content)
    
    assert columns == ["id", "name", "age"]
    assert len(records) == 3
    assert records[0] == {"id": 1, "name": "Alice", "age": 30.0}
    assert records[1]["name"] == "Bob"
    assert records[1]["age"] is None # Handling NaN as None

def test_generate_summary():
    data = [
        {"id": 1, "score": 10},
        {"id": 2, "score": 20},
        {"id": 3, "score": None},
        {"id": 4, "score": 30}
    ]
    columns = ["id", "score"]
    
    summary = generate_summary(data, columns)
    
    assert "score" in summary
    assert summary["score"]["non_null"] == 3
    assert summary["score"]["null_count"] == 1
    assert summary["score"]["mean"] == 20.0
    assert summary["score"]["min"] == 10.0
    assert summary["score"]["max"] == 30.0

def test_detect_anomalies():
    # Provide enough data to generate IQR outliers
    data = [{"val": 10}] * 20 + [{"val": 100}] # 100 is an outlier
    columns = ["val"]
    
    anomalies = detect_anomalies(data, columns)
    
    assert len(anomalies) > 0
    assert anomalies[0]["column"] == "val"
    assert anomalies[0]["value"] == 100.0
    
def test_detect_anomalies_empty_or_small():
    data = [{"val": 10}] * 3 # Less than 5 rows
    columns = ["val"]
    anomalies = detect_anomalies(data, columns)
    assert len(anomalies) == 0

def test_generate_discrepancy_report():
    source = [
        {"id": 1, "name": "Alice"},
        {"id": 2, "name": "Bob"}
    ]
    target = [
        {"id": 1, "name": "Alice"},
        {"id": 2, "name": "Bobby"},
        {"id": 3, "name": "Charlie"}
    ]
    
    report, diffs, summary = generate_discrepancy_report(source, target)
    
    assert "Bobby" in report
    assert len(diffs) > 0
    assert any("Bobby" in diff for diff in diffs)
    assert "Row count differs" in summary or "discrepancy types" in summary

def test_create_pdf():
    report_text = "Hello\nWorld"
    pdf_url = create_pdf(report_text)
    
    assert pdf_url.startswith("data:application/pdf;base64,")

def test_export_csv():
    data = [{"id": 1, "name": "Alice"}]
    columns = ["id", "name"]
    csv_str = export_csv(data, columns)
    
    assert "id,name\r\n" in csv_str or "id,name\n" in csv_str
    assert "1,Alice\r\n" in csv_str or "1,Alice\n" in csv_str

def test_get_columns():
    data = [{"id": 1, "name": "Alice", "score": 9.5}]
    columns = ["id", "name", "score"]
    
    num_cols = get_numeric_columns(data, columns)
    cat_cols = get_categorical_columns(data, columns)
    
    assert "id" in num_cols
    assert "score" in num_cols
    assert "name" not in num_cols
    
    assert "name" in cat_cols
    assert "id" not in cat_cols
