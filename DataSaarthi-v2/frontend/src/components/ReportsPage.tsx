import { useState, useEffect, useMemo } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  Trash2,
  Loader2,
  FileText,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";

import { SaarthiLoader } from "@/components/SaarthiLogo";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";

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
  const [downloadingPdf, setDownloadingPdf] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getReports(userId);
      setReports(res.reports || []);
      if (res.reports && res.reports.length > 0 && !expandedId) {
        setExpandedId(res.reports[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [userId]);

  const handleDelete = async (reportId: string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    setDeleting((p) => ({ ...p, [reportId]: true }));
    try {
      await api.deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (expandedId === reportId) {
        setExpandedId(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete report");
    } finally {
      setDeleting((p) => ({ ...p, [reportId]: false }));
    }
  };

  const handleDownloadPdf = async (report: Report) => {
    setDownloadingPdf((p) => ({ ...p, [report.id]: true }));
    try {
      const res = await api.generatePdf(report.content);
      const a = document.createElement("a");
      a.href = res.pdf_url;
      a.download = `${report.title.replace(/\s+/g, "_")}_report.pdf`;
      a.click();
    } catch (err: any) {
      setError(err.message || "Failed to generate PDF");
    } finally {
      setDownloadingPdf((p) => ({ ...p, [report.id]: false }));
    }
  };

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const query = searchQuery.toLowerCase();
    return reports.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.content.toLowerCase().includes(query)
    );
  }, [reports, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <SaarthiLoader size={40} label="Retrieving saved reports..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[hsl(var(--border-hairline))]">
        <div>
          <span className="text-eyebrow text-[hsl(var(--accent))]">PERSISTENT REPOSITORY</span>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-h1 text-[hsl(var(--text-primary))]">Saved Reports</h1>
            <Badge variant="secondary" className="bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))] font-mono text-xs">
              {reports.length} {reports.length === 1 ? "Report" : "Reports"}
            </Badge>
          </div>
        </div>

        {reports.length > 0 && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--text-tertiary))]" />
            <Input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[hsl(var(--elevated))] border-[hsl(var(--border-hairline))] text-sm placeholder:text-[hsl(var(--text-tertiary))]"
            />
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="bg-[hsl(var(--danger))]/15 border-[hsl(var(--danger))]/30 text-[hsl(var(--danger))]">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 rounded-2xl bg-[hsl(var(--elevated))] border border-[hsl(var(--border-hairline))]">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))] flex items-center justify-center mb-4">
            <FolderOpen className="h-8 w-8 opacity-80" />
          </div>
          <h3 className="font-display text-lg font-semibold text-[hsl(var(--text-primary))] mb-1">
            No saved reports yet
          </h3>
          <p className="text-sm text-[hsl(var(--text-secondary))] max-w-md mb-6">
            Run an AI analysis, detect anomalies, or compare datasets, then save the report to review it anytime.
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-[hsl(var(--text-tertiary))]">
          <Search className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-base font-medium">No reports match "{searchQuery}"</p>
          <p className="text-xs mt-1">Try searching for a different keyword or title</p>
        </div>
      ) : (
        /* Report Cards List */
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isExpanded = expandedId === report.id;
            const isDeletingThis = deleting[report.id];
            const isDownloadingThis = downloadingPdf[report.id];

            return (
              <Card
                key={report.id}
                className={`bg-[hsl(var(--elevated))] border transition-all duration-300 ${
                  isExpanded
                    ? "border-[hsl(var(--accent))]/40 shadow-ambient"
                    : "border-[hsl(var(--border-hairline))] hover:border-[hsl(var(--border-strong))]"
                }`}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 min-w-0 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : report.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[hsl(var(--accent))] shrink-0" />
                        <CardTitle className="text-base sm:text-lg font-display font-semibold text-[hsl(var(--text-primary))] truncate">
                          {report.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className="border-[hsl(var(--border-hairline))] bg-[hsl(var(--canvas))] text-[hsl(var(--text-tertiary))] font-mono text-[11px] flex items-center gap-1"
                        >
                          <Calendar className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPdf(report)}
                        disabled={isDownloadingThis}
                        className="h-8 px-2.5 text-xs border-[hsl(var(--border-hairline))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]"
                        title="Download PDF"
                      >
                        {isDownloadingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden sm:inline">PDF</span>
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(isExpanded ? null : report.id)}
                        className="h-8 px-2 text-xs text-[hsl(var(--text-secondary))]"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(report.id)}
                        disabled={isDeletingThis}
                        className="h-8 px-2 text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/10"
                        title="Delete Report"
                      >
                        {isDeletingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0">
                  {isExpanded ? (
                    <div className="mt-3 pt-3 border-t border-[hsl(var(--border-hairline))]">
                      <ScrollArea className="max-h-[480px] rounded-xl bg-[hsl(var(--canvas))] p-5 border border-[hsl(var(--border-hairline))]">
                        <SimpleMarkdown text={report.content} />
                      </ScrollArea>
                    </div>
                  ) : (
                    <div
                      className="mt-2 text-xs text-[hsl(var(--text-secondary))] line-clamp-2 cursor-pointer opacity-80 hover:opacity-100"
                      onClick={() => setExpandedId(report.id)}
                    >
                      {report.content.slice(0, 180)}...
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
