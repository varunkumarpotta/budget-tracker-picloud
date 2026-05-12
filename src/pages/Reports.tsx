import { Download, FileText, Calendar } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { apiGet } from "@/lib/api";

export default function Reports() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  const downloadCSV = async () => {
    if (!fromDate || !toDate) {
      alert("Please select both start and end dates.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiGet<any[]>(`/api/v1/expenses/range?from=${fromDate}&to=${toDate}`);
      
      if (res.data.length === 0) {
        alert("No expenses found in this date range.");
        return;
      }

      // Generate CSV
      const headers = ["Date", "Merchant", "Category", "Amount", "Currency", "Payment Source", "Type"];
      const rows = res.data.map(e => [
        new Date(e.occurred_at || e.occurredAt).toISOString().split('T')[0],
        `"${(e.merchant_name || e.merchantName || "").replace(/"/g, '""')}"`,
        `"${(e.category_name || e.categoryName || "").replace(/"/g, '""')}"`,
        (e.amount_minor || e.amountMinor) / 100,
        e.currency,
        `"${(e.payment_source_label || e.paymentSourceLabel || "").replace(/"/g, '""')}"`,
        e.kind
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `expenses_${fromDate}_to_${toDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Custom Report Export</div>
            <div className="mt-1 text-xs text-app-muted">
              Select a date range to download your expense data as CSV.
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-app-muted whitespace-nowrap">From:</span>
              <Input 
                type="date" 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)} 
                className="h-9 w-full sm:w-auto"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-app-muted whitespace-nowrap">To:</span>
              <Input 
                type="date" 
                value={toDate} 
                onChange={e => setToDate(e.target.value)} 
                className="h-9 w-full sm:w-auto"
              />
            </div>
            <Button size="sm" onClick={downloadCSV} disabled={loading || !fromDate || !toDate} className="w-full sm:w-auto shrink-0">
              <Download className="h-4 w-4" />
              {loading ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {["May 2026", "Apr 2026", "Mar 2026", "Feb 2026"].map((m) => (
          <Card key={m} className="p-4 opacity-60">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold">{m}</div>
                <div className="mt-1 text-xs text-app-muted">
                  Monthly summary (Coming soon)
                </div>
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-app-border/60 bg-app-surface/40">
                <FileText className="h-5 w-5 text-app-foreground" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


