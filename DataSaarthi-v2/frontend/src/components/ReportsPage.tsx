import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderOpen, Trash2, Loader2, FileText } from "lucide-react";

interface Report {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

interface ReportsPageProps {
  userId: string;
}

export function ReportsPage({ userId }: ReportsPageProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getReports(userId);
      setReports(res.reports);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [userId]);

  const handleDelete = async (reportId: string) => {
    if (!window.confirm("Delete this report?")) return;
    setDeleting((p) => ({ ...p, [reportId]: true }));
    try {
      await api.deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting((p) => ({ ...p, [reportId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[hsl(var(--text-tertiary))]">
        <Loader2 className="h-12 w-12 mb-4 animate-spin opacity-30" />
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <span className="text-eyebrow text-[hsl(var(--accent))]">SAVED</span>
        <h1 className="text-h1 text-[hsl(var(--text-primary))] mt-1">Reports</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-[hsl(var(--danger))]/20 border-[hsl(var(--danger))]">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[hsl(var(--text-tertiary))]">
          <FolderOpen className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg">No saved reports</p>
          <p className="text-sm">Run an analysis or comparison and save it to see it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="bg-[hsl(var(--elevated))] border border-[hsl(var(--border-hairline))] shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-[hsl(var(--text-primary))] text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[hsl(var(--accent))] shrink-0" />
                      <span className="truncate">{report.title}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="border-[hsl(var(--border-strong))] text-[hsl(var(--text-secondary))]">
                        {new Date(report.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(report.id)}
                    disabled={deleting[report.id]}
                    className="text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/10 shrink-0"
                  >
                    {deleting[report.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <ScrollArea className="max-h-[120px] rounded-lg bg-[hsl(var(--canvas))] p-3 border border-[hsl(var(--border-hairline))]">
                  <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed whitespace-pre-wrap">
                    {report.content.length > 300 ? report.content.slice(0, 300) + "..." : report.content}
                  </p>
                </ScrollArea>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
