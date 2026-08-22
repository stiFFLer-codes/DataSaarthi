import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { Dataset } from "@/types";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Sparkles, Loader2 } from "lucide-react";
import Plotly from "plotly.js-dist-min";
import type { Data, Layout } from "plotly.js";

interface ChartsPageProps {
  datasets: Dataset[];
}

type Chart2D = "bar" | "line" | "scatter" | "histogram" | "pie";
type Chart3D = "3d_scatter" | "3d_line" | "3d_surface";

const COLOR_PALETTE = ['#6366f1','#2dd4bf','#a78bfa','#fbbf24','#fb7185','#34d399','#38bdf8','#a3e635'];

const BASE_LAYOUT: Partial<Layout> = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: {
    family: 'Inter, system-ui, sans-serif',
    color: '#94a3b8',
    size: 12,
  },
  margin: { t: 48, r: 24, b: 56, l: 64 },
  autosize: true,
};

function build2DTrace(type: Chart2D, rows: any[], xCol: string, yCol: string): Data[] {
  const x = rows.map((r) => r[xCol]);
  const y = rows.map((r) => r[yCol]);

  switch (type) {
    case "bar":
      return [{ type: "bar", x, y, marker: { color: COLOR_PALETTE[0] } }];
    case "line":
      return [{ type: "scatter", mode: "lines+markers", x, y, line: { color: COLOR_PALETTE[1], width: 2 } }];
    case "scatter":
      return [{ type: "scatter", mode: "markers", x, y, marker: { color: COLOR_PALETTE[4], size: 8 } }];
    case "histogram": {
      const values = x
        .map((v) => (typeof v === "number" ? v : Number(v)))
        .filter((v) => !isNaN(v));
      return [{ type: "histogram", x: values, marker: { color: COLOR_PALETTE[2] } }];
    }
    case "pie": {
      const counts: Record<string, number> = {};
      rows.forEach((r) => {
        const k = String(r[xCol] ?? "null");
        counts[k] = (counts[k] || 0) + 1;
      });
      return [{ type: "pie", labels: Object.keys(counts), values: Object.values(counts) }];
    }
    default:
      return [];
  }
}

function build3DTrace(type: Chart3D, rows: any[], xCol: string, yCol: string, zCol: string): Data[] {
  const x = rows.map((r) => r[xCol]);
  const y = rows.map((r) => r[yCol]);
  const z = rows.map((r) => r[zCol]);
  const mode = type === "3d_line" ? "lines" : "markers";
  return [
    {
      type: "scatter3d",
      mode,
      x,
      y,
      z,
      marker: { size: 4, color: x as any, colorscale: "Viridis" },
      line: { color: COLOR_PALETTE[0], width: 2 },
    },
  ];
}

export function ChartsPage({ datasets }: ChartsPageProps) {
  const [activeDataset, setActiveDataset] = useState(datasets[0]?.id || "");
  const [view, setView] = useState<"2d" | "3d">("2d");

  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [zCol, setZCol] = useState("");
  const [chart2D, setChart2D] = useState<Chart2D>("bar");
  const [chart3D, setChart3D] = useState<Chart3D>("3d_scatter");
  const [suggestion, setSuggestion] = useState("");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [error, setError] = useState("");

  const chartDiv = useRef<HTMLDivElement>(null);

  const ds = datasets.find((d) => d.id === activeDataset);

  const numericCols = useMemo(() => {
    if (!ds) return [];
    return ds.columns.filter((c) => {
      const dtype = ds.dtypes[c] || "";
      return /int|float|number|double/.test(dtype);
    });
  }, [ds]);

  const allCols = ds?.columns || [];

  useEffect(() => {
    if (ds && ds.columns.length > 0) {
      if (!xCol || !ds.columns.includes(xCol)) {
        setXCol(ds.columns[0]);
      }
      const numCol = ds.columns.find((c) => {
        const dtype = ds.dtypes[c] || "";
        return /int|float|number|double/.test(dtype);
      });
      if (!yCol || !ds.columns.includes(yCol)) {
        setYCol(numCol || ds.columns[1] || ds.columns[0]);
      }
      if (!zCol || !ds.columns.includes(zCol)) {
        setZCol(ds.columns[2] || ds.columns[0]);
      }
    }
  }, [ds?.id, ds?.columns]);

  useEffect(() => {
    if (!ds || !xCol) return;
    if (!chartDiv.current) return;

    let traces: Data[] = [];
    let layout: Partial<Layout> = { ...BASE_LAYOUT };

    if (view === "2d") {
      traces = build2DTrace(chart2D, ds.rows, xCol, yCol);
      let title = `${chart2D} chart: ${yCol || ""} vs ${xCol}`;
      if (chart2D === "histogram") title = `Histogram of ${xCol}`;
      if (chart2D === "pie") title = `Pie chart of ${xCol}`;
      layout.title = { text: title };
      layout.xaxis = { title: { text: xCol }, gridcolor: "#1e293b" };
      layout.yaxis = { title: { text: yCol || "value" }, gridcolor: "#1e293b" };
    } else {
      if (!xCol || !yCol || !zCol) return;
      traces = build3DTrace(chart3D, ds.rows, xCol, yCol, zCol);
      layout.title = { text: `${chart3D.replace("_", " ")}: ${xCol}, ${yCol}, ${zCol}` };
      layout.scene = {
        xaxis: { title: { text: xCol }, gridcolor: "#1e293b" },
        yaxis: { title: { text: yCol }, gridcolor: "#1e293b" },
        zaxis: { title: { text: zCol }, gridcolor: "#1e293b" },
      };
    }

    Plotly.react(chartDiv.current, traces, layout, { responsive: true, displayModeBar: true }).catch((err: any) => {
      console.error("Plotly render error:", err);
    });
  }, [ds, xCol, yCol, zCol, chart2D, chart3D, view]);

  useEffect(() => {
    return () => {
      if (chartDiv.current) {
        Plotly.Plots.purge(chartDiv.current);
      }
    };
  }, []);

  const getAISuggestion = useCallback(async () => {
    if (!ds || !xCol || !yCol) return;
    setLoadingSuggestion(true);
    setError("");
    try {
      const res = await api.suggestChart(ds.rows, xCol, yCol);
      setSuggestion(res.suggestion);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSuggestion(false);
    }
  }, [ds, xCol, yCol]);

  if (datasets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[hsl(var(--text-tertiary))]">
        <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg">No datasets to visualize</p>
        <p className="text-sm">Upload a CSV first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <span className="text-eyebrow text-[hsl(var(--accent))]">VISUALIZATION</span>
        <h1 className="text-h1 text-[hsl(var(--text-primary))] mt-1">Charts & Graphs</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-[hsl(var(--danger))]/20 border-[hsl(var(--danger))]">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeDataset} onValueChange={setActiveDataset}>
        <TabsList className="bg-[hsl(var(--bezel-outer-bg))]">
          {datasets.map((d) => (
            <TabsTrigger key={d.id} value={d.id}>
              {d.filename}
            </TabsTrigger>
          ))}
        </TabsList>

        {datasets.map((d) => (
          <TabsContent key={d.id} value={d.id}>
            <div className="grid grid-cols-12 gap-5 mt-4">
              <div className="col-span-12 lg:col-span-8">
                <div className="rounded-[var(--bezel-radius-outer)] bg-[hsl(var(--bezel-outer-bg))] ring-1 ring-[hsl(var(--bezel-outer-ring))] p-[var(--bezel-pad)] shadow-ambient">
                  <div className="rounded-[var(--bezel-radius-inner)] bg-[hsl(var(--elevated))] shadow-bezel-inner p-4 min-h-[400px]">
                    <div ref={chartDiv} className="w-full h-[400px]" />
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-4">
                <Card className="bg-[hsl(var(--elevated))] border border-[hsl(var(--border-hairline))] rounded-xl p-4 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-[hsl(var(--text-primary))] flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-[hsl(var(--accent))]" />
                      Chart Builder
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-0 pb-0">
                    <Tabs value={view} onValueChange={(v) => setView(v as "2d" | "3d")}>
                      <TabsList className="bg-[hsl(var(--bezel-outer-bg))] mb-4 w-full grid grid-cols-2">
                        <TabsTrigger value="2d">2D Charts</TabsTrigger>
                        <TabsTrigger value="3d">3D Graphs</TabsTrigger>
                      </TabsList>

                      <TabsContent value="2d" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-[hsl(var(--text-secondary))] mb-1 block">X-Axis</label>
                            <Select value={xCol} onValueChange={setXCol}>
                              <SelectTrigger className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))] text-[hsl(var(--text-primary))]">
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent className="bg-[hsl(var(--elevated))] border-[hsl(var(--border-hairline))]">
                                {allCols.map((c) => (
                                  <SelectItem key={c} value={c} className="text-[hsl(var(--text-primary))]">
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm text-[hsl(var(--text-secondary))] mb-1 block">Y-Axis</label>
                            <Select value={yCol} onValueChange={setYCol}>
                              <SelectTrigger className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))] text-[hsl(var(--text-primary))]">
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent className="bg-[hsl(var(--elevated))] border-[hsl(var(--border-hairline))]">
                                {numericCols.map((c) => (
                                  <SelectItem key={c} value={c} className="text-[hsl(var(--text-primary))]">
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm text-[hsl(var(--text-secondary))] mb-1 block">Chart Type</label>
                            <Select value={chart2D} onValueChange={(v) => setChart2D(v as Chart2D)}>
                              <SelectTrigger className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))] text-[hsl(var(--text-primary))]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[hsl(var(--elevated))] border-[hsl(var(--border-hairline))]">
                                <SelectItem value="bar" className="text-[hsl(var(--text-primary))]">Bar</SelectItem>
                                <SelectItem value="line" className="text-[hsl(var(--text-primary))]">Line</SelectItem>
                                <SelectItem value="scatter" className="text-[hsl(var(--text-primary))]">Scatter</SelectItem>
                                <SelectItem value="histogram" className="text-[hsl(var(--text-primary))]">Histogram</SelectItem>
                                <SelectItem value="pie" className="text-[hsl(var(--text-primary))]">Pie</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="pt-2">
                            <Button
                              onClick={getAISuggestion}
                              disabled={!xCol || !yCol || loadingSuggestion}
                              variant="outline"
                              className="border-[hsl(var(--accent))]/50 text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/10 w-full"
                            >
                              {loadingSuggestion ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                              )}
                              AI Suggest
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="3d" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-[hsl(var(--text-secondary))] mb-1 block">X-Axis</label>
                            <Select value={xCol} onValueChange={setXCol}>
                              <SelectTrigger className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))] text-[hsl(var(--text-primary))]">
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent className="bg-[hsl(var(--elevated))] border-[hsl(var(--border-hairline))]">
                                {allCols.map((c) => (
                                  <SelectItem key={c} value={c} className="text-[hsl(var(--text-primary))]">
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm text-[hsl(var(--text-secondary))] mb-1 block">Y-Axis</label>
                            <Select value={yCol} onValueChange={setYCol}>
                              <SelectTrigger className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))] text-[hsl(var(--text-primary))]">
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent className="bg-[hsl(var(--elevated))] border-[hsl(var(--border-hairline))]">
                                {allCols.map((c) => (
                                  <SelectItem key={c} value={c} className="text-[hsl(var(--text-primary))]">
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm text-[hsl(var(--text-secondary))] mb-1 block">Z-Axis</label>
                            <Select value={zCol} onValueChange={setZCol}>
                              <SelectTrigger className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))] text-[hsl(var(--text-primary))]">
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent className="bg-[hsl(var(--elevated))] border-[hsl(var(--border-hairline))]">
                                {allCols.map((c) => (
                                  <SelectItem key={c} value={c} className="text-[hsl(var(--text-primary))]">
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm text-[hsl(var(--text-secondary))] mb-1 block">Graph Type</label>
                            <Select value={chart3D} onValueChange={(v) => setChart3D(v as Chart3D)}>
                              <SelectTrigger className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))] text-[hsl(var(--text-primary))]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[hsl(var(--elevated))] border-[hsl(var(--border-hairline))]">
                                <SelectItem value="3d_scatter" className="text-[hsl(var(--text-primary))]">3D Scatter</SelectItem>
                                <SelectItem value="3d_line" className="text-[hsl(var(--text-primary))]">3D Line</SelectItem>
                                <SelectItem value="3d_surface" className="text-[hsl(var(--text-primary))]">3D Surface</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {suggestion && (
                      <Alert className="bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))]/30">
                        <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
                        <AlertDescription className="text-[hsl(var(--accent))]">{suggestion}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
