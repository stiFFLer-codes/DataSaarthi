import { useState, useRef, useEffect } from "react";
import type { Dataset, ChatMessage } from "@/types";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2, Bot, User as UserIcon } from "lucide-react";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";

interface ChatPageProps {
  datasets: Dataset[];
}

export function ChatPage({ datasets }: ChatPageProps) {
  const [activeDs, setActiveDs] = useState(datasets[0]?.id || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startRow, setStartRow] = useState(0);
  const [endRow, setEndRow] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ds = datasets.find((d) => d.id === activeDs);

  useEffect(() => {
    if (ds) {
      setStartRow(0);
      setEndRow(Math.max(0, ds.rows.length - 1));
    }
  }, [ds?.id, ds?.rows.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !ds) return;
    const question = input.trim();
    setInput("");
    setError("");
    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages((p) => [...p, userMsg]);
    setLoading(true);
    try {
      const history = messages.slice(-10);
      const s = Math.max(0, Math.min(startRow, ds.rows.length - 1));
      const e = Math.max(s, Math.min(endRow + 1, ds.rows.length));
      const sliced = ds.rows.slice(s, e);
      const res = await api.chat(sliced, question, history);
      setMessages((p) => [...p, { role: "assistant", content: res.answer }]);
    } catch (err: any) {
      setError(err.message);
      setMessages((p) => [...p, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (datasets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[hsl(var(--text-tertiary))]">
        <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg">No data to chat with</p>
        <p className="text-sm">Upload a CSV first</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-5">
        <span className="text-eyebrow text-[hsl(var(--accent))]">ASSISTANT</span>
        <h1 className="text-h1 text-[hsl(var(--text-primary))] mt-1">Chat with Data</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-[hsl(var(--danger))]/20 border-[hsl(var(--danger))]">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
        <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0">
          <div className="rounded-[var(--bezel-radius-outer)] bg-[hsl(var(--bezel-outer-bg))] ring-1 ring-[hsl(var(--bezel-outer-ring))] p-[var(--bezel-pad)] shadow-ambient flex flex-col flex-1 min-h-0">
            <div className="rounded-[var(--bezel-radius-inner)] bg-[hsl(var(--elevated))] shadow-bezel-inner flex flex-col flex-1 min-h-0">
              
              <div className="p-3 border-b border-[hsl(var(--border-hairline))] flex items-center gap-2">
                <Bot className="h-5 w-5 text-[hsl(var(--accent))]" />
                <span className="text-sm font-semibold text-[hsl(var(--text-primary))]">AI Assistant</span>
              </div>

              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-10 text-[hsl(var(--text-tertiary))]">
                      <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p>Ask me anything about your data!</p>
                      <p className="text-xs mt-1">Example: "What are the top 5 values?" or "Find any outliers"</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] px-4 py-3 text-sm ${
                          msg.role === "user"
                            ? "bg-[hsl(var(--accent))] text-white rounded-2xl rounded-br-md"
                            : "bg-[hsl(var(--canvas))] text-[hsl(var(--text-secondary))] rounded-2xl rounded-bl-md border border-[hsl(var(--border-hairline))]"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.role === "user" ? (
                            <UserIcon className="h-3 w-3" />
                          ) : (
                            <Bot className="h-3 w-3 text-[hsl(var(--accent))]" />
                          )}
                          <span className="text-xs font-medium opacity-70">
                            {msg.role === "user" ? "You" : "DataSaarthi AI"}
                          </span>
                        </div>
                        {msg.role === "user" ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <SimpleMarkdown text={msg.content} />
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-[hsl(var(--canvas))] border border-[hsl(var(--border-hairline))] rounded-2xl rounded-bl-md px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--accent))]" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-[hsl(var(--border-hairline))]">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your data..."
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <Card className="flex-1 flex flex-col bg-[hsl(var(--elevated))] border-[hsl(var(--border-hairline))] overflow-hidden">
            <CardHeader className="pb-2 border-b border-[hsl(var(--border-hairline))]">
              <CardTitle className="text-[hsl(var(--text-primary))] text-sm flex items-center gap-2">
                <Bot className="h-4 w-4 text-[hsl(var(--accent))]" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-[hsl(var(--text-tertiary))]">Dataset:</span>
                <Select value={activeDs} onValueChange={setActiveDs}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {ds && (
                <div className="space-y-4 pt-4 border-t border-[hsl(var(--border-hairline))]">
                  <Badge variant="outline" className="border-[hsl(var(--border-hairline))] text-[hsl(var(--text-tertiary))]">
                    {ds.row_count} rows
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--text-tertiary))]">Rows:</span>
                    <Input
                      type="number"
                      min={0}
                      max={Math.max(0, ds.rows.length - 1)}
                      value={startRow}
                      onChange={(e) => setStartRow(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-[hsl(var(--text-ghost))]">to</span>
                    <Input
                      type="number"
                      min={0}
                      max={Math.max(0, ds.rows.length - 1)}
                      value={endRow}
                      onChange={(e) => setEndRow(Number(e.target.value))}
                      className="w-24"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
