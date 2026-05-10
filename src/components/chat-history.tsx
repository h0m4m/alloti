"use client";

import { useState, useEffect } from "react";
import { Search, Trash2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  getChatConversations,
  searchChatConversations,
  deleteChatConversation,
} from "@/lib/actions";

interface ConversationPreview {
  _id: string;
  title: string;
  updatedAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  activeId: string | null;
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ChatHistoryContent({
  onSelect,
  onClose,
  activeId,
}: Omit<Props, "open">) {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const q = query.trim();
    (q ? searchChatConversations(q) : getChatConversations()).then(
      (results) => {
        if (!cancelled) {
          setConversations(results);
          setLoading(false);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteChatConversation(id);
    setConversations((prev) => prev.filter((c) => c._id !== id));
    if (activeId === id) {
      onSelect("");
    }
  };

  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-1">
          {loading && conversations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 animate-pulse">
              Loading...
            </p>
          )}

          {!loading && conversations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {query ? "No matching conversations" : "No conversations yet"}
            </p>
          )}

          {conversations.map((conv) => (
            <div
              key={conv._id}
              role="button"
              tabIndex={0}
              onClick={() => {
                onSelect(conv._id);
                onClose();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelect(conv._id);
                  onClose();
                }
              }}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group cursor-pointer ${
                conv._id === activeId
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{conv.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeDate(conv.updatedAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDelete(e, conv._id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function ChatHistory({ open, onClose, onSelect, activeId }: Props) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="!max-w-md h-[60vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chat History</DialogTitle>
            <DialogDescription className="sr-only">
              Browse and search past conversations
            </DialogDescription>
          </DialogHeader>
          <ChatHistoryContent
            onSelect={onSelect}
            onClose={onClose}
            activeId={activeId}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg px-4 pb-8 h-[70vh] flex flex-col">
          <DrawerHeader className="px-0">
            <DrawerTitle>Chat History</DrawerTitle>
          </DrawerHeader>
          <ChatHistoryContent
            onSelect={onSelect}
            onClose={onClose}
            activeId={activeId}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
