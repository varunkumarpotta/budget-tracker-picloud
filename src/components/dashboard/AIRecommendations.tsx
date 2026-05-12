import { useState } from "react";
import { Sparkles, BrainCircuit, RefreshCw } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useExpenseStore } from "@/stores/expenseStore";
import { monthKey } from "@/lib/date";
import { fromMinor } from "@/lib/money";

export default function AIRecommendations() {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const listForMonth = useExpenseStore((s) => s.listForMonth);

  const generateInsights = async () => {
    setLoading(true);
    setInsight(null);

    const month = monthKey(new Date());
    const items = listForMonth(month);

    // Summarize recent expenses to send to AI to save tokens
    const recentExpenses = items.slice(0, 20).map((e) => ({
      merchant: e.merchantName,
      category: e.categoryName,
      amount: fromMinor(e.amountMinor),
      kind: e.kind,
      date: new Date(e.occurredAt).toLocaleDateString(),
    }));

    const prompt = `Here are my recent expenses for this month: ${JSON.stringify(recentExpenses)}. 
Please provide 3 very short, bullet-point intelligent recommendations on how I can optimize my spending or what patterns you notice. Keep it under 3 sentences total.`;

    try {
      const response = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      if (data.reply) {
        setInsight(data.reply);
      } else {
        setInsight("Unable to generate insights right now.");
      }
    } catch (error) {
      setInsight("Error communicating with AI service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 flex flex-col relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[rgb(var(--accent))] opacity-10 blur-3xl" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-[rgb(var(--accent))]" />
            <div className="text-sm font-semibold">Intelligent AI Recommendations</div>
          </div>
          <div className="mt-1 text-xs text-app-muted">Powered by OpenRouter</div>
        </div>
        <Button size="sm" variant="secondary" onClick={generateInsights} disabled={loading} className="gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[rgb(var(--accent))]" />}
          {loading ? "Analyzing..." : "Generate"}
        </Button>
      </div>

      <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4 relative z-10">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-2 w-3/4 bg-app-surface rounded" />
            <div className="h-2 w-full bg-app-surface rounded" />
            <div className="h-2 w-5/6 bg-app-surface rounded" />
          </div>
        ) : insight ? (
          <div className="text-sm text-app-foreground whitespace-pre-wrap leading-relaxed">
            {insight}
          </div>
        ) : (
          <div className="text-xs text-app-muted text-center py-4">
            Tap generate to let AI analyze your recent spending patterns and find saving opportunities.
          </div>
        )}
      </div>
    </Card>
  );
}
