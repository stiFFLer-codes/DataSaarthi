import { useState } from "react";
import type { Dataset } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { GitCompare, Loader2, Download, AlertTriangle, FileText, Save, Check } from "lucide-react";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";

interface ComparePageProps {
  datasets: Dataset[];
  reference: Dataset | null;
}

export function ComparePage({ datasets, reference }: ComparePageProps) {
  const { user } = useAuth();
  const [reports, setReports] = useState<Record<string, { report: string; differences: string[]; summary: string }>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const runCompare = async (ds: Dataset) => {
    if (!reference) return;
    setError("");
    setLoading((p) => ({ ...p, [ds.id]: true }));
    try {
      const res = await api.compare(reference.rows, ds.rows);
      setReports((p) => ({ ...p, [ds.id]: res }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading((p) => ({ ...p, [ds.id]: false }));
    }
  };

  const downloadPdf = async (ds: Dataset) => {
    if (!reports[ds.id]) return;
    setPdfLoading((p) => ({ ...p, [ds.id]: true }));
    try {
      const res = await api.generatePdf(reports[ds.id].report);
      const a = document.createElement("a");
      a.href = res.pdf_url;
      a.download = `${ds.filename}_discrepancy_report.pdf`;
      a.click();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPdfLoading((p) => ({ ...p, [ds.id]: false }));
    }
  };

  const saveReport = async (ds: Dataset) => {
    if (!user || !reports[ds.id]) return;
    const title = window.prompt("Enter report title:", `${ds.filename} Comparison`);
    if (!title) return;
    setSaving((p) => ({ ...p, [ds.id]: true }));
    try {
      await api.saveReport(user.id, title, reports[ds.id].report);
      setSaved((p) => ({ ...p, [ds.id]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [ds.id]: false })), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving((p) => ({ ...p, [ds.id]: false }));
    }
  };

  if (!reference) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[hsl(var(--text-tertiary))]">
        <GitCompare className="h-16 w-16 mb-4 opacity-30 text-[hsl(var(--text-ghost))]" />
        <p className="text-lg text-[hsl(var(--text-secondary))]">No reference file uploaded</p>
        <p className="text-sm">Upload a reference CSV on the Upload page to enable comparison</p>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[hsl(var(--text-tertiary))]">
        <GitCompare className="h-16 w-16 mb-4 opacity-30 text-[hsl(var(--text-ghost))]" />
        <p className="text-lg text-[hsl(var(--text-secondary))]">No datasets to compare</p>
        <p className="text-sm">Upload at least one dataset</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <span className="text-eyebrow text-[hsl(var(--warning))]">VALIDATION</span>
        <h1 className="text-h1 text-[hsl(var(--text-primary))] mt-1">Compare & Verify</h1>
      </div>

      <div className="flex items-center gap-3 p-5 rounded-xl bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/20">
        <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))] shrink-0" />
        <div>
          <p className="text-sm font-medium text-[hsl(var(--warning))]">Reference: {reference.filename}</p>
          <p className="text-xs text-[hsl(var(--warning))]/80">
            {reference.row_count.toLocaleString()} rows × {reference.column_count} columns
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-[hsl(var(--danger))]/20 border-[hsl(var(--danger))]">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {datasets.map((ds) => (
          <Card key={ds.id} className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[hsl(var(--text-primary))] text-lg flex items-center gap-2">
                  <GitCompare className="h-5 w-5 text-[hsl(var(--warning))]" />
                  {ds.filename}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-[hsl(var(--border-strong))] text-[hsl(var(--text-secondary))]">
                    {ds.row_count} rows
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => runCompare(ds)}
                    disabled={loading[ds.id]}
                    className="bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/90 text-white"
                  >
                    {loading[ds.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitCompare className="mr-2 h-4 w-4" />}
                    Compare
                  </Button>
                </div>
              </div>
            </CardHeader>
            {reports[ds.id] && (
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={reports[ds.id].differences.length > 0 ? "bg-[hsl(var(--danger))]" : "bg-[hsl(var(--success))]"}>
                    {reports[ds.id].differences.length > 0
                      ? `${reports[ds.id].differences.length} discrepancies`
                      : "No discrepancies"}
                  </Badge>
                  <span className="text-xs text-[hsl(var(--text-tertiary))]">{reports[ds.id].summary}</span>
                </div>

                <ScrollArea className="h-[400px] bg-[hsl(var(--canvas))] p-5 rounded-xl border border-[hsl(var(--border-hairline))]">
                  <SimpleMarkdown text={reports[ds.id].report} />
                </ScrollArea>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const csv = `discrepancy\n"${reports[ds.id].report.replace(/"/g, '""')}"`;
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${ds.filename}_discrepancy.csv`;
                      a.click();
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadPdf(ds)}
                    disabled={pdfLoading[ds.id]}
                  >
                    {pdfLoading[ds.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveReport(ds)}
                    disabled={saving[ds.id] || saved[ds.id]}
                  >
                    {saving[ds.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved[ds.id] ? <Check className="mr-2 h-4 w-4 text-[hsl(var(--success))]" /> : <Save className="mr-2 h-4 w-4" />}
                    {saved[ds.id] ? "Saved" : "Save"}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
