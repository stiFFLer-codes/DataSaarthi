import { useState, useRef, useMemo, useCallback } from "react";
import type { Dataset } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Plus, Trash2, Table } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { ColDef, CellValueChangedEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);

interface DataEditorProps {
  datasets: Dataset[];
  onUpdateDataset: (id: string, rows: Record<string, any>[]) => void;
}

export function DataEditor({ datasets, onUpdateDataset }: DataEditorProps) {
  const [activeTab, setActiveTab] = useState(datasets[0]?.id || "");
  const gridRef = useRef<AgGridReact>(null);

  const activeDataset = datasets.find((d) => d.id === activeTab) || datasets[0];

  const columnDefs = useMemo<ColDef[]>(() => {
    if (!activeDataset) return [];
    return activeDataset.columns.map((col) => {
      const dtype = activeDataset.dtypes[col] || "";
      const isNumber = /int|float|number|double/.test(dtype);
      return {
        field: col,
        headerName: `${col}\n(${dtype})`,
        editable: true,
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        minWidth: 120,
        cellDataType: isNumber ? "number" : "text",
        valueFormatter: (params: any) => {
          if (params.value === null || params.value === undefined || params.value === "") return "—";
          return params.value;
        },
      };
    });
  }, [activeDataset]);

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      if (!activeDataset || event.rowIndex === null) return;
      const updatedRows = activeDataset.rows.map((row, idx) =>
        idx === event.rowIndex ? { ...event.data } : row
      );
      onUpdateDataset(activeDataset.id, updatedRows);
    },
    [activeDataset, onUpdateDataset]
  );

  const handleAddRow = useCallback(() => {
    if (!activeDataset) return;
    const newRow: Record<string, any> = {};
    activeDataset.columns.forEach((col) => {
      const dtype = activeDataset.dtypes[col] || "";
      newRow[col] = /int|float|number|double/.test(dtype) ? 0 : "";
    });
    onUpdateDataset(activeDataset.id, [...activeDataset.rows, newRow]);
  }, [activeDataset, onUpdateDataset]);

  const handleDeleteSelected = useCallback(() => {
    if (!activeDataset || !gridRef.current) return;
    const api = gridRef.current.api;
    const selected = api.getSelectedRows();
    if (selected.length === 0) return;
    const selectedSet = new Set(selected);
    onUpdateDataset(
      activeDataset.id,
      activeDataset.rows.filter((row) => !selectedSet.has(row))
    );
    api.deselectAll();
  }, [activeDataset, onUpdateDataset]);

  const handleDownload = useCallback(() => {
    if (!activeDataset) return;
    const cols = activeDataset.columns;
    const rows = activeDataset.rows;
    let csv = cols.join(",") + "\n";
    rows.forEach((row) => {
      csv +=
        cols
          .map((c) => {
            const v = row[c];
            const s = v === null || v === undefined ? "" : String(v);
            if (s.includes(",") || s.includes('"') || s.includes("\n")) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          })
          .join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edited_${activeDataset.filename}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeDataset]);

  if (datasets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[hsl(var(--text-tertiary))]">
        <Table className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg">No datasets uploaded yet</p>
        <p className="text-sm">Go to Upload to add CSV files</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-8">
        <span className="text-eyebrow text-[hsl(var(--accent))]">WORKSPACE</span>
        <h1 className="text-h1 text-[hsl(var(--text-primary))] mt-1">Data Editor</h1>
      </div>

      <div className="flex items-center justify-between gap-4 mb-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="bg-[hsl(var(--bezel-outer-bg))]">
            {datasets.map((ds) => (
              <TabsTrigger key={ds.id} value={ds.id} className="data-[state=active]:bg-[hsl(var(--elevated))]">
                {ds.filename}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <Button
          onClick={handleDownload}
          variant="outline"
          className="border-[hsl(var(--border-hairline))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--elevated))] rounded-full"
        >
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </div>

      {datasets.map((ds) => (
        <TabsContent key={ds.id} value={ds.id} className="mt-0">
          <Card className="bg-[hsl(var(--elevated))] border border-[hsl(var(--border-hairline))] shadow-none mb-5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[hsl(var(--text-primary))] text-lg">{ds.filename}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-[hsl(var(--border-strong))] text-[hsl(var(--text-secondary))]">
                    {ds.row_count} rows
                  </Badge>
                  <Badge variant="outline" className="border-[hsl(var(--border-strong))] text-[hsl(var(--text-secondary))]">
                    {ds.column_count} cols
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={handleAddRow}
                  variant="outline"
                  className="border-[hsl(var(--border-hairline))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--elevated))] rounded-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Row
                </Button>
                <Button
                  onClick={handleDeleteSelected}
                  variant="outline"
                  className="border-[hsl(var(--border-hairline))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--danger))]/10 hover:text-[hsl(var(--danger))] rounded-full border-[hsl(var(--danger))]/30 hover:border-[hsl(var(--danger))]"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-[var(--bezel-radius-outer)] bg-[hsl(var(--bezel-outer-bg))] ring-1 ring-[hsl(var(--bezel-outer-ring))] p-[var(--bezel-pad)] shadow-ambient">
            <div className="ag-theme-alpine rounded-[var(--bezel-radius-inner)] overflow-hidden h-[calc(100vh-280px)] w-full shadow-bezel-inner" data-ag-theme-mode="dark">
              <AgGridReact
                ref={gridRef}
                rowData={ds.rows}
                columnDefs={columnDefs}
                defaultColDef={{
                  flex: 1,
                  minWidth: 120,
                  resizable: true,
                  sortable: true,
                  filter: true,
                  editable: true,
                }}
                rowSelection="multiple"
                onCellValueChanged={handleCellValueChanged}
                pagination={true}
                paginationPageSize={50}
                animateRows={true}
              />
            </div>
          </div>
        </TabsContent>
      ))}
    </div>
  );
}
