import pytest
from unittest.mock import patch, MagicMock
from services import groq_service

@pytest.fixture
def mock_groq_client():
    with patch("services.groq_service._get_groq_client") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client
        yield mock_client

@pytest.fixture
def mock_openai_client():
    with patch("services.groq_service.OpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        yield mock_client

@pytest.fixture
def mock_env():
    with patch.dict("os.environ", {"GROQ_API_KEY": "test_key", "OPENROUTER_API_KEY": "test_key"}):
        yield

def test_analyze_dataset_success(mock_groq_client, mock_env):
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Mocked dataset analysis"))]
    mock_groq_client.chat.completions.create.return_value = mock_response

    data = [{"col1": 1}, {"col1": 2}]
    result = groq_service.analyze_dataset(data, "TestDataset")
    
    assert result == "Mocked dataset analysis"
    mock_groq_client.chat.completions.create.assert_called_once()

def test_analyze_dataset_fallback_openrouter(mock_groq_client, mock_openai_client, mock_env):
    # Make Groq fail
    mock_groq_client.chat.completions.create.side_effect = Exception("Groq down")
    
    # OpenRouter succeeds
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="OpenRouter analysis"))]
    mock_openai_client.chat.completions.create.return_value = mock_response

    data = [{"col1": 1}]
    result = groq_service.analyze_dataset(data, "TestDataset")
    
    assert result == "OpenRouter analysis"
    mock_openai_client.chat.completions.create.assert_called_once()

def test_analyze_dataset_no_providers(mock_groq_client, mock_openai_client, mock_env):
    mock_groq_client.chat.completions.create.side_effect = Exception("Groq down")
    mock_openai_client.chat.completions.create.side_effect = Exception("OpenRouter down")

    with pytest.raises(RuntimeError, match="No AI provider available"):
        groq_service.analyze_dataset([{"col1": 1}], "TestDataset")

def test_suggest_chart(mock_groq_client, mock_env):
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Scatter Plot"))]
    mock_groq_client.chat.completions.create.return_value = mock_response

    data = [{"x": 1, "y": 2}]
    result = groq_service.suggest_chart(data, "x", "y")
    
    assert result == "Scatter Plot"

def test_chat_with_data(mock_groq_client, mock_env):
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Mock answer"))]
    mock_groq_client.chat.completions.create.return_value = mock_response

    data = [{"col": "val"}]
    result = groq_service.chat_with_data(data, "What is this?", [{"role": "user", "content": "hello"}])
    
    assert result == "Mock answer"
