export interface Dataset {
  id: string;
  filename: string;
  columns: string[];
  rows: Record<string, any>[];
  row_count: number;
  column_count: number;
  dtypes: Record<string, string>;
  summary?: Record<string, any>;
  anomalies?: any[];
}

export interface User {
  id: string;
  email: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChartType = "scatter" | "line" | "bar" | "histogram" | "pie" | "3d_scatter";
export type Page = "upload" | "editor" | "charts" | "analysis" | "compare" | "chat";
