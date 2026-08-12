import os
from typing import Optional, Dict, Any
from supabase import create_client, Client

_supabase: Optional[Client] = None

def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        _supabase = create_client(url, key)
    return _supabase

def sign_up(email: str, password: str) -> Dict[str, Any]:
    sb = get_supabase()
    resp = sb.auth.sign_up({"email": email, "password": password})
    return {
        "user": resp.user.model_dump() if resp.user else None,
        "session": resp.session.model_dump() if resp.session else None,
        "error": None,
    }

def sign_in(email: str, password: str) -> Dict[str, Any]:
    sb = get_supabase()
    resp = sb.auth.sign_in_with_password({"email": email, "password": password})
    return {
        "user": resp.user.model_dump() if resp.user else None,
        "session": resp.session.model_dump() if resp.session else None,
        "error": None,
    }

def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    sb = get_supabase()
    resp = sb.auth.get_user(token)
    if resp.user:
        return resp.user.model_dump()
    return None

def save_report(user_id: str, title: str, content: str) -> Dict[str, Any]:
    sb = get_supabase()
    result = sb.table("reports").insert({
        "user_id": user_id,
        "title": title,
        "content": content,
    }).execute()
    return result.data[0] if result.data else {}

def get_reports(user_id: str) -> list:
    sb = get_supabase()
    result = sb.table("reports").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data if result.data else []
