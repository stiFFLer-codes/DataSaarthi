import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app, get_current_user

client = TestClient(app)

# Mocking the dependency
def override_get_current_user():
    return {"id": "test_user", "email": "test@example.com"}

app.dependency_overrides[get_current_user] = override_get_current_user

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "DataSaarthi API v2.0", "status": "ok"}

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@patch("services.supabase_service.sign_up")
def test_register(mock_sign_up):
    mock_sign_up.return_value = {"user": {"id": "1"}}
    response = client.post("/auth/register", data={"email": "test@example.com", "password": "pass"})
    assert response.status_code == 200
    assert response.json()["status"] == "success"

@patch("services.supabase_service.sign_in")
def test_login(mock_sign_in):
    mock_sign_in.return_value = {"user": {"id": "1"}}
    response = client.post("/auth/login", data={"email": "test@example.com", "password": "pass"})
    assert response.status_code == 200

@patch("services.data_service.parse_csv")
def test_upload_csv(mock_parse):
    mock_parse.return_value = (["col1"], [{"col1": "val"}], {"col1": "str"})
    file_content = b"col1\nval"
    response = client.post(
        "/upload",
        files={"file": ("test.csv", file_content, "text/csv")}
    )
    assert response.status_code == 200
    assert "columns" in response.json()

def test_upload_csv_invalid_extension():
    response = client.post(
        "/upload",
        files={"file": ("test.txt", b"text", "text/plain")}
    )
    assert response.status_code == 400
    assert "Only CSV files are supported" in response.json()["detail"]

@patch("services.groq_service.analyze_dataset")
def test_analyze(mock_analyze):
    mock_analyze.return_value = "Mock Analysis Report"
    response = client.post("/analyze", json={"data": [{"a": 1}], "dataset_name": "Test"})
    assert response.status_code == 200
    assert response.json()["report"] == "Mock Analysis Report"

@patch("services.data_service.create_pdf")
def test_generate_pdf(mock_create_pdf):
    mock_create_pdf.return_value = "data:application/pdf;base64,mock"
    response = client.post("/report/pdf", data={"report_text": "text"})
    assert response.status_code == 200
    assert response.json()["pdf_url"] == "data:application/pdf;base64,mock"
