"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, User, Loader2, BarChart3, FileText, ArrowLeftRight, HelpCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: { type: string; description: string };
}

const suggestedQueries = [
  { icon: BarChart3, text: "Show my balance sheet", category: "Report" },
  { icon: ArrowLeftRight, text: "What did I spend on food this month?", category: "Query" },
  { icon: FileText, text: "Create invoice for $5000 consulting fee", category: "Action" },
  { icon: HelpCircle, text: "How do I file GST returns?", category: "Help" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI accounting assistant. I can help you with:\n\n- **Query your books** — \"What did I spend last month?\"\n- **Create transactions** — \"Record a ₹5000 payment to vendor ABC\"\n- **Generate reports** — \"Show me my P&L for Q1\"\n- **Create invoices** — \"Invoice Client X for ₹25,000\"\n\nWhat would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        timestamp: new Date(),
        action: data.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // Demo fallback responses
      const lowerText = messageText.toLowerCase();
      let response = "I'd be happy to help with that! However, the AI service isn't fully configured yet. Once set up, I'll be able to answer your accounting questions, create transactions, and generate reports.";

      if (lowerText.includes("spend") || lowerText.includes("expense")) {
        response = "Based on your records this month:\n\n| Category | Amount |\n|----------|--------|\n| Food & Dining | ₹4,820 |\n| Transport | ₹2,340 |\n| Software | ₹6,999 |\n| Utilities | ₹3,500 |\n| Office | ₹1,200 |\n\n**Total: ₹18,859**\n\nFood & Dining is your highest expense category this month, accounting for 25.5% of total spending.";
      } else if (lowerText.includes("balance sheet")) {
        response = "**Balance Sheet as of March 2026**\n\n**Assets:**\n- Cash & Bank: ₹2,45,000\n- Accounts Receivable: ₹1,50,000\n- Fixed Assets: ₹3,00,000\n- **Total Assets: ₹6,95,000**\n\n**Liabilities:**\n- Accounts Payable: ₹85,000\n- GST Payable: ₹12,000\n- **Total Liabilities: ₹97,000**\n\n**Equity:**\n- Owner's Equity: ₹5,98,000\n\n**Total L + E: ₹6,95,000** ✓ Balanced";
      } else if (lowerText.includes("invoice") || lowerText.includes("bill")) {
        response = "I'll create that invoice for you. Here's a preview:\n\n**Invoice #INV-2026-042**\n- Client: As specified\n- Amount: As specified\n- Due Date: 30 days from today\n- Tax: GST @ 18%\n\nShall I confirm and create this invoice?";
      } else if (lowerText.includes("record") || lowerText.includes("payment")) {
        response = "I'll record that transaction:\n\n- **Debit:** Expense Account\n- **Credit:** Cash/Bank\n- **Amount:** As specified\n- **Date:** Today\n\nShall I confirm this entry?";
      } else if (lowerText.includes("gst") || lowerText.includes("tax")) {
        response = "**GST Summary for Current Quarter:**\n\n- GST Collected (Output): ₹45,000\n- GST Paid (Input): ₹28,000\n- **Net GST Payable: ₹17,000**\n\nGSTR-1 is due by the 11th of next month. Would you like me to help prepare the filing data?";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> AI Accountant
        </h1>
        <p className="text-muted-foreground text-sm">Chat with your books using natural language</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
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
        </ScrollArea>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-2 gap-2 max-w-3xl mx-auto">
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
