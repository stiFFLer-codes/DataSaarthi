import pytest
from unittest.mock import patch, MagicMock
from services import supabase_service

@pytest.fixture
def mock_env():
    with patch.dict("os.environ", {"SUPABASE_URL": "http://mock-url", "SUPABASE_KEY": "mock-key"}):
        yield

@pytest.fixture
def mock_supabase_client(mock_env):
    with patch("services.supabase_service.create_client") as mock_create:
        mock_client = MagicMock()
        mock_create.return_value = mock_client
        # Reset the global variable for each test
        supabase_service._supabase = None
        yield mock_client

def test_sign_up(mock_supabase_client):
    mock_auth_resp = MagicMock()
    mock_auth_resp.user.model_dump.return_value = {"id": "1"}
    mock_auth_resp.session.model_dump.return_value = {"access_token": "token"}
    mock_supabase_client.auth.sign_up.return_value = mock_auth_resp

    result = supabase_service.sign_up("test@example.com", "password")
    
    assert result["user"] == {"id": "1"}
    assert result["session"] == {"access_token": "token"}
    mock_supabase_client.auth.sign_up.assert_called_once_with({"email": "test@example.com", "password": "password"})

def test_sign_in(mock_supabase_client):
    mock_auth_resp = MagicMock()
    mock_auth_resp.user.model_dump.return_value = {"id": "1"}
    mock_auth_resp.session.model_dump.return_value = {"access_token": "token"}
    mock_supabase_client.auth.sign_in_with_password.return_value = mock_auth_resp

    result = supabase_service.sign_in("test@example.com", "password")
    
    assert result["user"] == {"id": "1"}

def test_get_user_by_token(mock_supabase_client):
    mock_auth_resp = MagicMock()
    mock_auth_resp.user.model_dump.return_value = {"id": "1"}
    mock_supabase_client.auth.get_user.return_value = mock_auth_resp

    result = supabase_service.get_user_by_token("valid_token")
    assert result == {"id": "1"}

def test_save_report(mock_supabase_client):
    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [{"id": 1, "title": "Test"}]
    mock_supabase_client.table.return_value.insert.return_value = mock_execute

    result = supabase_service.save_report("user_1", "Test", "Content")
    assert result == {"id": 1, "title": "Test"}
    mock_supabase_client.table.assert_called_once_with("reports")

def test_get_reports(mock_supabase_client):
    mock_execute = MagicMock()
    mock_execute.execute.return_value.data = [{"id": 1, "title": "Test"}]
    mock_order = MagicMock()
    mock_order.order.return_value = mock_execute
    mock_eq = MagicMock()
    mock_eq.eq.return_value = mock_order
    mock_select = MagicMock()
    mock_select.select.return_value = mock_eq
    mock_supabase_client.table.return_value = mock_select

    result = supabase_service.get_reports("user_1")
    assert result == [{"id": 1, "title": "Test"}]
