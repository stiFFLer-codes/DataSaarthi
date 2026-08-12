import os
import json
from typing import List, Dict, Any, Optional

try:
    from groq import Groq
except ImportError:
    Groq = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

_groq_client: Optional[Any] = None

GROQ_MODELS = {
    "analysis": "llama-3.3-70b-versatile",
    "chat": "llama-3.3-70b-versatile",
    "suggest": "llama-3.1-8b-instant",
}

OPENROUTER_MODELS = {
    "analysis": "nvidia/nemotron-3.5-content-safety:free",
    "chat": "nvidia/nemotron-3.5-content-safety:free",
    "suggest": "nvidia/nemotron-3.5-content-safety:free",
}


def _get_groq_client() -> Optional[Any]:
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if api_key and Groq is not None:
            _groq_client = Groq(api_key=api_key)
    return _groq_client


def _complete(messages: List[Dict[str, str]], task: str, temperature: float, max_tokens: int) -> str:
    """Try Groq first, then fall back to OpenRouter."""
    groq = _get_groq_client()

    if groq:
        try:
            response = groq.chat.completions.create(
                model=GROQ_MODELS[task],
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content
            if content:
                return content
        except Exception as e:
            print(f"Groq failed for {task}: {e}")

    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key and OpenAI is not None:
        try:
            client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=openrouter_key)
            response = client.chat.completions.create(
                model=OPENROUTER_MODELS[task],
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content
            if content:
                return content
        except Exception as e:
            print(f"OpenRouter failed for {task}: {e}")

    raise RuntimeError("No AI provider available. Set GROQ_API_KEY or OPENROUTER_API_KEY.")


def analyze_dataset(data: List[Dict[str, Any]], dataset_name: str = "Dataset") -> str:
    """Generate AI insights for a dataset."""
    sample = json.dumps(data[:50], indent=2, default=str)
    prompt = f"""You are an expert data analyst. Analyze the following dataset named '{dataset_name}'.

Dataset sample (first {min(len(data), 50)} rows):
{sample}

Total rows: {len(data)}

Please provide:
1. A brief summary of what this dataset appears to be about
2. Key patterns, trends, or anomalies you notice
3. Data quality issues (missing values, outliers, inconsistencies)
4. Actionable insights and recommendations
5. Suggestions for further analysis

Be concise but thorough. Use markdown formatting."""

    return _complete(
        messages=[{"role": "user", "content": prompt}],
        task="analysis",
        temperature=0.3,
        max_tokens=2048,
    )


def analyze_combined(data: List[Dict[str, Any]]) -> str:
    """Analyze combined datasets."""
    sample = json.dumps(data[:50], indent=2, default=str)
    prompt = f"""You are an expert data analyst. Analyze the following combined dataset.

Dataset sample (first {min(len(data), 50)} rows):
{sample}

Total rows: {len(data)}

Please provide insights across the combined data, highlighting:
1. Overall patterns and trends
2. Anomalies or inconsistencies
3. Correlations between variables
4. Recommendations

Be concise but thorough. Use markdown formatting."""

    return _complete(
        messages=[{"role": "user", "content": prompt}],
        task="analysis",
        temperature=0.3,
        max_tokens=2048,
    )


def suggest_chart(data: List[Dict[str, Any]], x_col: str, y_col: str) -> str:
    """Suggest the best chart type for two columns."""
    x_vals = [str(row.get(x_col, "")) for row in data[:10]]
    y_vals = [str(row.get(y_col, "")) for row in data[:10]]
    prompt = f"""Given two columns:
- {x_col}: sample values = {x_vals}
- {y_col}: sample values = {y_vals}

Available chart types: Scatter, Line, Bar, Histogram, Pie, 3D Scatter.

Suggest the best chart type and give a one-sentence reason. Keep it very brief."""

    return _complete(
        messages=[{"role": "user", "content": prompt}],
        task="suggest",
        temperature=0.3,
        max_tokens=256,
    )


def chat_with_data(
    data: List[Dict[str, Any]],
    question: str,
    history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """Answer a question about dataset rows."""
    sample = json.dumps(data[:100], indent=2, default=str)
    messages: List[Dict[str, str]] = []
    if history:
        for h in history:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    system_prompt = f"""You are a helpful data analyst assistant. Answer the user's question about the following data.

Data sample ({min(len(data), 100)} rows):
{sample}

Answer clearly and concisely. If the answer requires calculations, show your work. If the data doesn't contain the answer, say so."""
    
    messages.insert(0, {"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": question})

    return _complete(
        messages=messages,
        task="chat",
        temperature=0.3,
        max_tokens=2048,
    )
