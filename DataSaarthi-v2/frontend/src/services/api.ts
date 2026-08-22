import type { Dataset, ChatMessage } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const STORAGE_KEY = "dsaarthi_user";

function getToken(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as { token: string }).token;
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function uploadFile(file: File, lightweight = false): Promise<Dataset> {
  const form = new FormData();
  form.append("file", file);
  const endpoint = lightweight ? "/upload/raw" : "/upload";
  const data = await postForm<Dataset>(endpoint, form);
  return { ...data, id: crypto.randomUUID() };
}

export const api = {
  uploadFile,
  guestLogin: async () => {
    const res = await fetch(`${API_BASE}/auth/guest`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Guest login failed");
    return data as { access_token: string; user: { id: string; email: string } };
  },
  analyze: (data: unknown[], name: string) =>
    post<{ report: string }>("/analyze", { data, dataset_name: name }),
  analyzeCombined: (data: unknown[]) =>
    post<{ report: string }>("/analyze/combined", { data, dataset_name: "Combined" }),
  suggestChart: (data: unknown[], x: string, y: string) =>
    post<{ suggestion: string }>("/charts/suggest", { data, x_column: x, y_column: y }),
  compare: (source: unknown[], target: unknown[]) =>
    post<{ report: string; differences: string[]; summary: string }>("/compare", {
      source,
      target,
      source_name: "Reference",
      target_name: "Dataset",
    }),
  chat: (data: unknown[], question: string, history?: ChatMessage[]) =>
    post<{ answer: string }>("/chat", { data, question, history: history || [] }),
  generatePdf: (report_text: string) => {
    const form = new FormData();
    form.append("report_text", report_text);
    return postForm<{ pdf_url: string }>("/report/pdf", form);
  },
  exportCsv: (data: unknown[], columns: string[]) =>
    post<{ csv: string }>("/export/csv", { data, columns }),
  dataSummary: (data: unknown[], columns: string[]) =>
    post<{
      summary: Record<string, any>;
      anomalies: any[];
      numeric_columns: string[];
      categorical_columns: string[];
    }>("/data/summary", { data, columns }),
  saveReport: (userId: string, title: string, content: string) => {
    const form = new FormData();
    form.append("user_id", userId);
    form.append("title", title);
    form.append("content", content);
    return postForm<{ status: string; report: { id: string; user_id: string; title: string; content: string; created_at: string } }>("/reports/save", form);
  },
  getReports: (userId: string) =>
    get<{ reports: { id: string; user_id: string; title: string; content: string; created_at: string }[] }>(`/reports/${userId}`),
  deleteReport: (reportId: string) =>
    del<{ status: string }>(`/reports/${reportId}`),
  // Auth proxy
  register: (email: string, password: string) => {
    const form = new FormData();
    form.append("email", email);
    form.append("password", password);
    return postForm<{ status: string; data?: any; detail?: string }>("/auth/register", form);
  },
  login: (email: string, password: string) => {
    const form = new FormData();
    form.append("email", email);
    form.append("password", password);
    return postForm<{ status: string; data?: any; detail?: string }>("/auth/login", form);
  },
};
