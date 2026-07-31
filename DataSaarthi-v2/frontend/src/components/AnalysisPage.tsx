import { useState } from "react";
import type { Dataset } from "@/types";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Loader2, Download, FileText } from "lucide-react";

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("# ")) return <h1 key={i} className="text-h1 text-[hsl(var(--text-primary))] mt-6 mb-3">{trimmed.slice(2)}</h1>;
        if (trimmed.startsWith("## ")) return <h2 key={i} className="text-h2 text-[hsl(var(--text-primary))] mt-5 mb-2">{trimmed.slice(3)}</h2>;
        if (trimmed.startsWith("### ")) return <h3 key={i} className="text-base font-display font-semibold text-[hsl(var(--text-primary))] mt-4 mb-2">{trimmed.slice(4)}</h3>;
        if (trimmed.startsWith("- ")) return <li key={i} className="text-sm text-[hsl(var(--text-secondary))] ml-4">{trimmed.slice(2)}</li>;
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) return <p key={i} className="font-semibold text-[hsl(var(--text-primary))]">{trimmed.slice(2, -2)}</p>;
        if (trimmed === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

interface AnalysisPageProps {
  datasets: Dataset[];
}

export function AnalysisPage({ datasets }: AnalysisPageProps) {
  const [activeTab, setActiveTab] = useState("individual");
  const [reports, setReports] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

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
