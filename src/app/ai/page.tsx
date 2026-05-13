"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Plus, History } from "lucide-react";
import { SparkleHighlight } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { ChatHistory } from "@/components/chat-history";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { SpendingPieChart } from "@/components/ai-charts/spending-pie-chart";
import { BudgetVsActualChart } from "@/components/ai-charts/budget-vs-actual-chart";
import { MonthlyComparisonChart } from "@/components/ai-charts/monthly-comparison-chart";
import { TopMerchantsChart } from "@/components/ai-charts/top-merchants-chart";
import { CategoryTrendChart } from "@/components/ai-charts/category-trend-chart";
import {
  createChatConversation,
  getChatConversation,
  saveChatMessages,
} from "@/lib/actions";

const SUGGESTIONS = [
  "How much have I spent this month?",
  "Show me spending by category",
  "What are my top merchants?",
  "How are my savings goals going?",
];

export default function AIPage() {
  return (
    <Suspense>
      <AIPageContent />
    </Suspense>
  );
}

function AIPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(
    searchParams.get("c")
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);

  const { messages, sendMessage, status, setMessages } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

  // Restore conversation from URL on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const id = searchParams.get("c");
    if (!id) return;
    getChatConversation(id).then((conv) => {
      if (conv) {
        setConversationId(id);
        setMessages(
          conv.messages.map(
            (m: { id: string; role: string; parts: unknown[] }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              parts: m.parts,
              createdAt: new Date(),
            })
          )
        );
      }
    });
  }, [searchParams, setMessages]);

  // Sync conversationId to URL
  useEffect(() => {
    const current = searchParams.get("c");
    if (conversationId && conversationId !== current) {
      router.replace(`/ai?c=${conversationId}`, { scroll: false });
    } else if (!conversationId && current) {
      router.replace("/ai", { scroll: false });
    }
  }, [conversationId, searchParams, router]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Derive a title from the first user message
  const deriveTitle = useCallback((msgs: typeof messages) => {
    const first = msgs.find((m) => m.role === "user");
    if (!first) return "New chat";
    const text = first.parts.find((p) => p.type === "text");
    if (!text || text.type !== "text") return "New chat";
    const title = text.text.slice(0, 60);
    return title.length < text.text.length ? title + "..." : title;
  }, []);

  // Save messages to DB (debounced)
  const saveMessages = useCallback(
    (msgs: typeof messages) => {
      if (!conversationId || msgs.length === 0) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const serializable = msgs.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: m.parts,
        }));
        const title = deriveTitle(msgs);
        saveChatMessages(conversationId, serializable, title);
      }, 1000);
    },
    [conversationId, deriveTitle]
  );

  // Save when messages change and we're not streaming
  useEffect(() => {
    if (status === "ready" && messages.length > 0 && conversationId) {
      saveMessages(messages);
    }
  }, [status, messages, conversationId, saveMessages]);

  // Create conversation on first message if none exists
  const ensureConversation = useCallback(async () => {
    if (conversationId) return conversationId;
    const conv = await createChatConversation();
    setConversationId(conv._id);
    return conv._id as string;
  }, [conversationId]);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return;
    await ensureConversation();
    sendMessage({ text: text.trim() });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
  };

  const handleSelectConversation = async (id: string) => {
    if (!id) {
      // Active conversation was deleted
      handleNewChat();
      return;
    }
    if (id === conversationId) return;

    const conv = await getChatConversation(id);
    if (!conv) return;

    setConversationId(id);
    // Restore messages from saved conversation
    setMessages(
      conv.messages.map((m: { id: string; role: string; parts: unknown[] }) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        parts: m.parts,
        createdAt: new Date(),
      }))
    );
  };

  const CHART_TOOLS = new Set([
    "tool-spendingByCategory",
    "tool-budgetVsActual",
    "tool-monthlyComparison",
    "tool-topMerchants",
    "tool-categoryTrend",
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderToolPart(part: any, key: string) {
    // Only show loading state for chart tools, not data-fetching tools
    if (part.state !== "output-available") {
      if (!CHART_TOOLS.has(part.type)) return null;
      if (!isLoading) return null;
      return (
        <div
          key={key}
          className="text-xs sm:text-sm text-muted-foreground py-1 animate-pulse"
        >
          Working on it...
        </div>
      );
    }

    const output = part.output;

    if (part.type === "tool-spendingByCategory" && output?.type === "pie") {
      return (
        <SpendingPieChart
          key={key}
          periodName={output.periodName}
          totalSpent={output.totalSpent}
          totalBudget={output.totalBudget}
          categories={output.categories}
        />
      );
    }

    if (part.type === "tool-budgetVsActual" && output?.type === "bar") {
      return (
        <BudgetVsActualChart
          key={key}
          periodName={output.periodName}
          totalPlanned={output.totalPlanned}
          totalActual={output.totalActual}
          totalDifference={output.totalDifference}
          categories={output.categories}
        />
      );
    }

    if (part.type === "tool-monthlyComparison" && output?.type === "line") {
      return <MonthlyComparisonChart key={key} data={output.data} />;
    }

    if (part.type === "tool-topMerchants" && output?.type === "horizontalBar") {
      return <TopMerchantsChart key={key} merchants={output.merchants} />;
    }

    if (part.type === "tool-categoryTrend" && output?.type === "trend") {
      return (
        <CategoryTrendChart
          key={key}
          categoryName={output.categoryName}
          data={output.data}
        />
      );
    }

    return null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-2 sm:pb-8 flex flex-col h-[calc(100dvh-7rem-env(safe-area-inset-bottom))] sm:h-[calc(100dvh-5rem)]">
      <div className="flex items-center justify-between">
        <PageHeader crumbs={[{ label: "Home", href: "/" }]} title="AI Assistant" />
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                onClick={() => setHistoryOpen(true)}
                className="flex items-center justify-center h-8 gap-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors px-2 sm:px-3"
              >
                <History className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline text-xs">History</span>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">History</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                onClick={handleNewChat}
                className="flex items-center justify-center h-8 gap-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors px-2 sm:px-3"
              >
                <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                <span className="hidden sm:inline text-xs">New</span>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">New chat</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto mt-4 min-h-0 -mr-4 pr-4 sm:-mr-6 sm:pr-6"
      >
        <div className="space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="flex items-center gap-2">
              <SparkleHighlight className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Alloti AI</h2>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Ask me anything about your finances. I can show charts, log
              expenses, track income, and more.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSubmit(s)}
                  className="text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const textParts = message.parts.filter(
            (p) => p.type === "text" && "text" in p && p.text
          );
          const toolParts = message.parts.filter((p) =>
            p.type.startsWith("tool-")
          );

          return (
            <div key={message.id} className="space-y-2">
              {/* Text bubble */}
              {textParts.length > 0 && (
                <div
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5"
                        : ""
                    }`}
                  >
                    {textParts.map((part, i) => (
                      <div
                        key={`${message.id}-t${i}`}
                        className="text-sm whitespace-pre-wrap"
                      >
                        {"text" in part ? part.text : ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tool results — full width with margin for border visibility */}
              {toolParts.length > 0 && (
                <div className="space-y-2 mx-1">
                  {toolParts.map((part, i) =>
                    renderToolPart(part, `${message.id}-tool${i}`)
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <div className="flex justify-start">
              <div className="text-sm sm:text-base text-muted-foreground animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="mt-3 mb-4 sm:mb-0 shrink-0">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-3 py-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your finances..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-[20px] max-h-[120px] py-1"
            style={{
              height: "auto",
              overflowY: input.split("\n").length > 4 ? "auto" : "hidden",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <button
            className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground shrink-0 disabled:opacity-40"
            disabled={!input.trim() || isLoading}
            onClick={() => handleSubmit(input)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      <ChatHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={handleSelectConversation}
        activeId={conversationId}
      />
    </div>
  );
}
