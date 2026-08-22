import { useState } from "react";
import type { Dataset } from "@/types";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Loader2, Download, FileText, Save, Check } from "lucide-react";

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const renderInline = (line: string, key: number) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partIndex = 0;

    while (remaining.length > 0) {
      const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/);
      const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/);

      const firstMatch = codeMatch && boldMatch
        ? (codeMatch.index ?? 0) <= (boldMatch.index ?? 0) ? codeMatch : boldMatch
        : codeMatch || boldMatch;

      if (!firstMatch) {
        parts.push(remaining);
        break;
      }

      const [, before, content, after] = firstMatch;
      if (before) parts.push(before);
      if (firstMatch === codeMatch) {
        parts.push(<code key={`${key}-${partIndex++}`} className="px-1.5 py-0.5 rounded bg-[hsl(var(--bezel-outer-bg))] text-[hsl(var(--accent))] font-code text-xs">{content}</code>);
      } else {
        parts.push(<strong key={`${key}-${partIndex++}`} className="font-semibold text-[hsl(var(--text-primary))]">{content}</strong>);
      }
      remaining = after;
    }
    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-[hsl(var(--bezel-outer-bg))] rounded-lg p-4 overflow-x-auto text-sm font-code text-[hsl(var(--text-secondary))] my-3">
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (trimmed === "") {
      elements.push(<div key={i} className="h-2" />);
    } else if (trimmed.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-h1 text-[hsl(var(--text-primary))] mt-6 mb-3">{renderInline(trimmed.slice(2), i)}</h1>);
    } else if (trimmed.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-h2 text-[hsl(var(--text-primary))] mt-5 mb-2">{renderInline(trimmed.slice(3), i)}</h2>);
    } else if (trimmed.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-base font-display font-semibold text-[hsl(var(--text-primary))] mt-4 mb-2">{renderInline(trimmed.slice(4), i)}</h3>);
    } else if (trimmed.startsWith("- ")) {
      elements.push(<li key={i} className="text-sm text-[hsl(var(--text-secondary))] ml-4 list-disc">{renderInline(trimmed.slice(2), i)}</li>);
    } else if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, "");
      elements.push(<li key={i} className="text-sm text-[hsl(var(--text-secondary))] ml-4 list-decimal">{renderInline(content, i)}</li>);
    } else {
      elements.push(<p key={i} className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{renderInline(line, i)}</p>);
    }
  }

  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre key="code-unclosed" className="bg-[hsl(var(--bezel-outer-bg))] rounded-lg p-4 overflow-x-auto text-sm font-code text-[hsl(var(--text-secondary))] my-3">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return <div className="space-y-2">{elements}</div>;
}

interface AnalysisPageProps {
  datasets: Dataset[];
}

export function AnalysisPage({ datasets }: AnalysisPageProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("individual");
  const [reports, setReports] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const runAnalysis = async (ds: Dataset) => {
    setError("");
    setLoading((p) => ({ ...p, [ds.id]: true }));
    try {
      const res = await api.analyze(ds.rows, ds.filename);
      setReports((p) => ({ ...p, [ds.id]: res.report }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading((p) => ({ ...p, [ds.id]: false }));
    }
  };

  const runCombined = async () => {
    if (datasets.length < 2) return;
    setError("");
    setLoading((p) => ({ ...p, combined: true }));
    try {
      const allRows = datasets.flatMap((d) => d.rows);
      const res = await api.analyzeCombined(allRows);
      setReports((p) => ({ ...p, combined: res.report }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading((p) => ({ ...p, combined: false }));
    }
  };

  const downloadPdf = async (text: string, name: string) => {
    try {
      const res = await api.generatePdf(text);
      const a = document.createElement("a");
      a.href = res.pdf_url;
      a.download = `${name}_analysis.pdf`;
      a.click();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const downloadCsv = (text: string, name: string) => {
    const csv = `report\n"${text.replace(/"/g, '""')}"`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}_analysis.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveReport = async (dsId: string, filename: string, text: string) => {
    if (!user) return;
    const title = window.prompt("Enter report title:", `${filename} Analysis`);
    if (!title) return;
    setSaving((p) => ({ ...p, [dsId]: true }));
    try {
      await api.saveReport(user.id, title, text);
      setSaved((p) => ({ ...p, [dsId]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [dsId]: false })), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving((p) => ({ ...p, [dsId]: false }));
    }
  };

  if (datasets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[hsl(var(--text-tertiary))]">
        <Brain className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg">No data to analyze</p>
        <p className="text-sm">Upload datasets first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <span className="text-eyebrow text-[hsl(var(--accent))]">INTELLIGENCE</span>
        <h1 className="text-h1 text-[hsl(var(--text-primary))] mt-1">AI Analysis</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-[hsl(var(--danger))]/20 border-[hsl(var(--danger))]">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[hsl(var(--bezel-outer-bg))]">
          <TabsTrigger value="individual">Individual</TabsTrigger>
          {datasets.length >= 2 && <TabsTrigger value="combined">Combined</TabsTrigger>}
        </TabsList>

        <TabsContent value="individual">
          <div className="grid grid-cols-12 gap-5 mt-4">
            <div className="col-span-12 lg:col-span-4 space-y-4">
              {datasets.map((ds) => (
                <Card key={ds.id} className="bg-[hsl(var(--elevated))] border border-[hsl(var(--border-hairline))] shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[hsl(var(--text-primary))] text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-[hsl(var(--accent))]" />
                          {ds.filename}
                        </CardTitle>
                        <Badge variant="outline" className="border-[hsl(var(--border-strong))] text-[hsl(var(--text-secondary))]">
                          {ds.row_count} rows
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => runAnalysis(ds)}
                        disabled={loading[ds.id]}
                        className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white w-full"
                      >
                        {loading[ds.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                        Analyze Dataset
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
            
            <div className="col-span-12 lg:col-span-8">
              {datasets.map((ds) => (
                <div key={ds.id} className={activeTab === "individual" && reports[ds.id] ? "block" : "hidden"}>
                  {reports[ds.id] && (
                    <div className="rounded-[var(--bezel-radius-outer)] bg-[hsl(var(--bezel-outer-bg))] ring-1 ring-[hsl(var(--bezel-outer-ring))] p-[var(--bezel-pad)] shadow-ambient h-full">
                      <div className="rounded-[var(--bezel-radius-inner)] bg-[hsl(var(--elevated))] shadow-bezel-inner p-4 h-full">
                        <ScrollArea className="h-[400px] rounded-xl bg-[hsl(var(--canvas))] p-5 border border-[hsl(var(--border-hairline))] font-code text-[hsl(var(--text-secondary))] leading-relaxed">
                          <SimpleMarkdown text={reports[ds.id]} />
                        </ScrollArea>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadPdf(reports[ds.id], ds.filename)}
                            className="border-[hsl(var(--border-hairline))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--elevated))]"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadCsv(reports[ds.id], ds.filename)}
                            className="border-[hsl(var(--border-hairline))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--elevated))]"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            CSV
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveReport(ds.id, ds.filename, reports[ds.id])}
                            disabled={saving[ds.id] || saved[ds.id]}
                            className="border-[hsl(var(--border-hairline))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--elevated))]"
                          >
                            {saving[ds.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved[ds.id] ? <Check className="mr-2 h-4 w-4 text-[hsl(var(--success))]" /> : <Save className="mr-2 h-4 w-4" />}
                            {saved[ds.id] ? "Saved" : "Save"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!datasets.some(ds => reports[ds.id]) && (
                <div className="rounded-[var(--bezel-radius-outer)] bg-[hsl(var(--bezel-outer-bg))] ring-1 ring-[hsl(var(--bezel-outer-ring))] p-[var(--bezel-pad)] shadow-ambient h-[500px]">
                  <div className="rounded-[var(--bezel-radius-inner)] bg-[hsl(var(--elevated))] shadow-bezel-inner p-4 h-full flex flex-col items-center justify-center text-[hsl(var(--text-tertiary))]">
                    <Brain className="h-12 w-12 mb-4 opacity-20" />
                    <p>Select a dataset and run analysis to view results here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {datasets.length >= 2 && (
          <TabsContent value="combined">
            <div className="grid grid-cols-12 gap-5 mt-4">
              <div className="col-span-12 lg:col-span-4 space-y-4">
                <Card className="bg-[hsl(var(--elevated))] border border-[hsl(var(--border-hairline))] shadow-none">
                  <CardHeader>
                    <div className="flex flex-col gap-4">
                      <CardTitle className="text-[hsl(var(--text-primary))] flex items-center gap-2 text-lg">
                        <Brain className="h-5 w-5 text-[hsl(var(--accent))]" />
                        Combined Analysis
                      </CardTitle>
                      <p className="text-sm text-[hsl(var(--text-secondary))]">
                        Analyze {datasets.length} datasets together to find cross-correlations and broader insights.
                      </p>
                      <Button
                        onClick={runCombined}
                        disabled={loading["combined"]}
                        className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 w-full text-white"
                      >
                        {loading["combined"] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                        Run Combined Analysis
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              </div>
              
              <div className="col-span-12 lg:col-span-8">
                {reports["combined"] ? (
                  <div className="rounded-[var(--bezel-radius-outer)] bg-[hsl(var(--bezel-outer-bg))] ring-1 ring-[hsl(var(--bezel-outer-ring))] p-[var(--bezel-pad)] shadow-ambient h-full">
                    <div className="rounded-[var(--bezel-radius-inner)] bg-[hsl(var(--elevated))] shadow-bezel-inner p-4 h-full">
                      <ScrollArea className="h-[400px] rounded-xl bg-[hsl(var(--canvas))] p-5 border border-[hsl(var(--border-hairline))] font-code text-[hsl(var(--text-secondary))] leading-relaxed">
                        <SimpleMarkdown text={reports["combined"]} />
                      </ScrollArea>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadPdf(reports["combined"], "combined")}
                          className="border-[hsl(var(--border-hairline))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--elevated))]"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveReport("combined", "Combined", reports["combined"])}
                          disabled={saving["combined"] || saved["combined"]}
                          className="border-[hsl(var(--border-hairline))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--elevated))]"
                        >
                          {saving["combined"] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved["combined"] ? <Check className="mr-2 h-4 w-4 text-[hsl(var(--success))]" /> : <Save className="mr-2 h-4 w-4" />}
                          {saved["combined"] ? "Saved" : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[var(--bezel-radius-outer)] bg-[hsl(var(--bezel-outer-bg))] ring-1 ring-[hsl(var(--bezel-outer-ring))] p-[var(--bezel-pad)] shadow-ambient h-[500px]">
                    <div className="rounded-[var(--bezel-radius-inner)] bg-[hsl(var(--elevated))] shadow-bezel-inner p-4 h-full flex flex-col items-center justify-center text-[hsl(var(--text-tertiary))]">
                      <Brain className="h-12 w-12 mb-4 opacity-20" />
                      <p>Run combined analysis to view results here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
