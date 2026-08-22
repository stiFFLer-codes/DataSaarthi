import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Page } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Table,
  BarChart3,
  Brain,
  GitCompare,
  MessageSquare,
  FolderOpen,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface LayoutProps {
  currentPage: Page;
  setPage: (p: Page) => void;
  children: React.ReactNode;
}

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "editor", label: "Data Editor", icon: Table },
  { id: "charts", label: "Charts", icon: BarChart3 },
  { id: "analysis", label: "AI Analysis", icon: Brain },
  { id: "compare", label: "Compare", icon: GitCompare },
  { id: "chat", label: "Chat with Data", icon: MessageSquare },
  { id: "reports", label: "Reports", icon: FolderOpen },
];

export function Layout({ currentPage, setPage, children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[hsl(var(--canvas))] font-body text-[hsl(var(--text-primary))]">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-[260px]" : "w-[72px]"} transition-[width] duration-600 ease-snap bg-[hsl(var(--elevated))] border-r border-[hsl(var(--border-hairline))] flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border-hairline))]">
          <div className="flex items-center gap-3 px-5 py-6">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--accent))] flex items-center justify-center shadow-lifted">
              <span className="text-white font-display font-bold text-sm">DS</span>
            </div>
            {sidebarOpen && <span className="font-display font-bold text-lg tracking-tight text-[hsl(var(--text-primary))]">DataSaarthi</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bezel-outer-bg))] rounded-xl p-2 transition-all duration-400 ease-snap"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-400 ease-magnetic relative ${
                  active
                    ? "bg-[hsl(var(--accent-ghost))] text-[hsl(var(--accent))] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-[hsl(var(--accent))] before:transition-transform before:duration-400 before:ease-snap before:scale-y-100"
                    : "text-[hsl(var(--text-tertiary))] hover:bg-[hsl(var(--bezel-outer-bg))] hover:text-[hsl(var(--text-primary))] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-[hsl(var(--accent))] before:transition-transform before:duration-400 before:ease-snap before:scale-y-0"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[hsl(var(--border-hairline))]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))] flex items-center justify-center text-xs font-medium">
              {user?.email?.charAt(0).toUpperCase() || "G"}
            </div>
            {sidebarOpen && (
              <div className="text-caption text-[hsl(var(--text-secondary))] truncate">
                {user?.email || "Guest"}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bezel-outer-bg))] transition-all duration-400 ease-snap justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 lg:p-10 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
