import { useState, useRef } from "react";
import type { Dataset } from "@/types";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, X } from "lucide-react";

interface UploadPageProps {
  datasets: Dataset[];
  reference: Dataset | null;
  onAddDataset: (d: Dataset) => void;
  onSetReference: (d: Dataset) => void;
  onRemoveDataset: (id: string) => void;
  onRemoveReference: () => void;
}

export function UploadPage({
  datasets,
  reference,
  onAddDataset,
  onSetReference,
  onRemoveDataset,
  onRemoveReference,
}: UploadPageProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null, isRef = false) => {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    setProgress(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.endsWith(".csv")) {
          setError("Only CSV files are supported.");
          continue;
        }
        const ds = await api.uploadFile(file, isRef);
        if (isRef) {
          onSetReference(ds);
        } else {
          onAddDataset(ds);
        }
        setProgress(((i + 1) / files.length) * 100);
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent, isRef = false) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files, isRef);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <span className="text-eyebrow text-[hsl(var(--accent))]">GET STARTED</span>
        <h1 className="text-h1 text-[hsl(var(--text-primary))] mt-1">Upload Data</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-[hsl(var(--danger))]/20 border-[hsl(var(--danger))]">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          {/* Dataset Upload */}
          <Card className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--text-primary))] flex items-center gap-2">
                <Upload className="h-5 w-5 text-[hsl(var(--accent))]" />
                Datasets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => handleDrop(e, false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-600 ease-smooth hover:border-[hsl(var(--border-strong))] ${
                  dragOver
                    ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent-ghost))] scale-[1.005] shadow-[0_0_0_4px_hsl(var(--accent)/0.1)]"
                    : "border-[hsl(var(--border-hairline))] bg-[hsl(var(--canvas))]"
                }`}
              >
                <Upload className="mx-auto h-10 w-10 text-[hsl(var(--text-ghost))] mb-3" />
                <p className="text-[hsl(var(--text-tertiary))] font-medium">Drop CSV files here or click to browse</p>
                <p className="text-[hsl(var(--text-ghost))] text-sm mt-1">You can upload up to 2 datasets</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files, false)}
                />
              </div>

              {uploading && <Progress value={progress} className="h-2" />}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Reference Upload */}
          <Card className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--text-primary))] flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[hsl(var(--warning))]" />
                Reference File (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!reference ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => handleDrop(e, true)}
                  onClick={() => refInputRef.current?.click()}
                  className="border-2 border-dashed border-[hsl(var(--border-hairline))] rounded-xl p-8 text-center cursor-pointer hover:border-[hsl(var(--border-strong))] transition-colors bg-[hsl(var(--canvas))]"
                >
                  <p className="text-[hsl(var(--text-tertiary))] font-medium">Drop a reference CSV here to compare against</p>
                  <input
                    ref={refInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files, true)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/30">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-[hsl(var(--warning))]" />
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{reference.filename}</p>
                      <p className="text-xs text-[hsl(var(--text-tertiary))]">
                        {reference.row_count.toLocaleString()} rows × {reference.column_count} columns
                      </p>
                    </div>
                    <Badge variant="outline" className="border-[hsl(var(--warning))]/50 text-[hsl(var(--warning))]">Reference</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRemoveReference}
                    className="text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--danger))]"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {datasets.length > 0 && (
            <Card className="bg-[hsl(var(--canvas))] border-[hsl(var(--border-hairline))]">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-[hsl(var(--text-primary))]">Uploaded Datasets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {datasets.map((ds) => (
                  <div
                    key={ds.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--elevated))] border border-[hsl(var(--border-hairline))] transition-all duration-400 ease-snap hover:shadow-lifted hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-[hsl(var(--success))]" />
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{ds.filename}</p>
                        <p className="text-caption text-[hsl(var(--text-tertiary))]">
                          {ds.row_count.toLocaleString()} rows × {ds.column_count} columns
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveDataset(ds.id)}
                      className="text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--danger))]"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
