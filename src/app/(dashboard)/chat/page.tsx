"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, User, Loader2, BarChart3, FileText, ArrowLeftRight, HelpCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getPlanLimits } from "@/lib/plan-limits";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("ledgerai_user") || "{}");
  } catch { return {}; }
}

function getUserId(): string {
  return getUser().id || "";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  action?: { type: string; description: string };
}

const STORAGE_KEY = "ledgerai_chat_history";

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm your AI accounting assistant. I can help you with:\n\n- **Query your books** — \"What did I spend last month?\"\n- **Create transactions** — \"Record a ₹5000 payment to vendor ABC\"\n- **Generate reports** — \"Show me my P&L for Q1\"\n- **Create invoices** — \"Invoice Client X for ₹25,000\"\n\nWhat would you like to do?",
  timestamp: new Date().toISOString(),
};

const suggestedQueries = [
  { icon: BarChart3, text: "Show my balance sheet", category: "Report" },
  { icon: ArrowLeftRight, text: "What did I spend on food this month?", category: "Query" },
  { icon: FileText, text: "Create invoice for $5000 consulting fee", category: "Action" },
  { icon: HelpCircle, text: "How do I file GST returns?", category: "Help" },
];

function loadMessages(): Message[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [welcomeMessage];
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* ignore */ }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist messages whenever they change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearHistory = useCallback(() => {
    setMessages([welcomeMessage]);
    toast.success("Chat history cleared");
  }, []);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    // Check plan limits
    const user = getUser();
    const limits = getPlanLimits(user.plan || "free");
    if (limits.aiQueriesPerMonth !== Infinity) {
      const userMessages = messages.filter(m => m.role === "user");
      if (userMessages.length >= limits.aiQueriesPerMonth) {
        toast.error(`Free plan limit: ${limits.aiQueriesPerMonth} AI queries/month. Upgrade to Pro for unlimited.`);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const userId = getUserId();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({
          message: messageText,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.message || "I processed your request.",
        timestamp: new Date().toISOString(),
        action: data.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I couldn't process that request. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasHistory = messages.length > 1;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> AI Accountant
          </h1>
          <p className="text-muted-foreground text-sm">Chat with your books using natural language</p>
        </div>
        {hasHistory && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearHistory}>
            <Trash2 className="w-4 h-4 mr-1" /> Clear History
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[92%] sm:max-w-[80%] rounded-xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n/g, "<br/>")
                        .replace(/\|(.+)\|/g, (match) => `<code>${match}</code>`)
                    }}
                  />
                  {msg.action && (
                    <div className="mt-2 pt-2 border-t">
                      <Badge variant="secondary">{msg.action.type}</Badge>
                      <p className="text-xs mt-1 opacity-80">{msg.action.description}</p>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suggestions */}
        {!hasHistory && (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-3xl mx-auto">
              {suggestedQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q.text)}
                  className="flex items-center gap-2 p-3 text-left text-sm border rounded-lg hover:bg-muted transition-colors"
                >
                  <q.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <CardContent className="p-4 border-t">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances, create transactions, generate reports..."
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} size="icon" className="shrink-0 h-11 w-11">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
