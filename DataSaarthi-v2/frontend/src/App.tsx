import { useState } from "react";
import type { Dataset, Page } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/AuthPage";
import { Layout } from "@/components/Layout";
import { UploadPage } from "@/components/UploadPage";
import { DataEditor } from "@/components/DataEditor";
import { ChartsPage } from "@/components/ChartsPage";
import { AnalysisPage } from "@/components/AnalysisPage";
import { ComparePage } from "@/components/ComparePage";
import { ChatPage } from "@/components/ChatPage";
import { ReportsPage } from "@/components/ReportsPage";

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>("upload");
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [reference, setReference] = useState<Dataset | null>(null);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[hsl(var(--canvas))] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--accent))] flex items-center justify-center shadow-lifted animate-scale-in">
          <span className="text-white font-display font-bold text-lg">DS</span>
        </div>
        <div className="flex flex-col items-center gap-2 animate-fade-up">
          <span className="font-display font-bold text-xl tracking-tight text-[hsl(var(--text-primary))]">DataSaarthi</span>
          <div className="w-32 h-1 rounded-full skeleton" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const addDataset = (ds: Dataset) => {
    setDatasets((prev) => {
      if (prev.length >= 2) return [prev[0], ds];
      return [...prev, ds];
    });
  };

  const removeDataset = (id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDataset = (id: string, rows: Record<string, any>[]) => {
    setDatasets((prev) =>
      prev.map((d) => (d.id === id ? { ...d, rows, row_count: rows.length } : d))
    );
  };

  const renderPage = () => {
    switch (page) {
      case "upload":
        return (
          <UploadPage
            datasets={datasets}
            reference={reference}
            onAddDataset={addDataset}
            onSetReference={setReference}
            onRemoveDataset={removeDataset}
            onRemoveReference={() => setReference(null)}
          />
        );
      case "editor":
        return <DataEditor datasets={datasets} onUpdateDataset={updateDataset} />;
      case "charts":
        return <ChartsPage datasets={datasets} />;
      case "analysis":
        return <AnalysisPage datasets={datasets} />;
      case "compare":
        return <ComparePage datasets={datasets} reference={reference} />;
      case "chat":
        return <ChatPage datasets={datasets} />;
      case "reports":
        return <ReportsPage userId={user.id} />;
      default:
        return null;
    }
  };

  return (
    <Layout currentPage={page} setPage={setPage}>
      {renderPage()}
    </Layout>
  );
}
