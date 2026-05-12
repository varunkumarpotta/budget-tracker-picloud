import { Bell, ShieldAlert, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

type AlertType = {
  id: string;
  name: string;
  category_name: string | null;
  threshold_minor: number;
  period: string;
  enabled: boolean;
};

export default function Notifications() {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [threshold, setThreshold] = useState("");
  const [period, setPeriod] = useState("monthly");

  const fetchAlerts = async () => {
    try {
      const res = await apiGet<AlertType[]>("/api/v1/alerts");
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const resetForm = () => {
    setName("");
    setCategoryName("");
    setThreshold("");
    setPeriod("monthly");
    setIsAdding(false);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const openEdit = (a: AlertType) => {
    setName(a.name);
    setCategoryName(a.category_name || "");
    setThreshold((a.threshold_minor / 100).toString());
    setPeriod(a.period);
    setEditingId(a.id);
  };

  const handleSave = async () => {
    if (!name.trim() || !threshold) return;
    
    const payload = {
      name,
      categoryName: categoryName.trim() || null,
      thresholdMinor: Math.trunc(Number(threshold) * 100),
      period,
      enabled: true
    };

    try {
      if (editingId) {
        await apiPut(`/api/v1/alerts/${editingId}`, payload);
      } else {
        await apiPost("/api/v1/alerts", payload);
      }
      resetForm();
      fetchAlerts();
    } catch (err) {
      alert("Failed to save alert");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this alert?")) return;
    try {
      await apiDelete(`/api/v1/alerts/${id}`);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (err) {
      alert("Failed to delete alert");
    }
  };

  const toggleEnabled = async (alertData: AlertType) => {
    try {
      await apiPut(`/api/v1/alerts/${alertData.id}`, { enabled: !alertData.enabled });
      setAlerts(alerts.map(a => a.id === alertData.id ? { ...a, enabled: !a.enabled } : a));
    } catch (err) {
      // Ignore
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Alerts & Notifications</div>
          <div className="mt-1 text-xs text-app-muted">
            Bill dues, budget warnings, subscription renewals, and anomalies.
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Alert
        </Button>
      </div>

      {(isAdding || editingId) && (
        <Card className="p-5 border-dashed border-app-border">
          <div className="text-sm font-semibold mb-4">{editingId ? "Edit Alert" : "New Alert"}</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="mb-1 text-xs font-semibold text-app-muted">Alert Name</div>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dining Out Budget" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-app-muted">Threshold Amount</div>
              <Input value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="0" type="number" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-app-muted">Category (Optional)</div>
              <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="e.g. Food" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save Alert</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-sm text-app-muted">Loading alerts...</div>
      ) : (
        <div className="grid gap-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`p-4 group ${!alert.enabled ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-app-border/60 bg-app-surface/40">
                    {alert.category_name ? <ShieldAlert className="h-5 w-5 text-app-foreground" /> : <Bell className="h-5 w-5 text-app-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      {alert.name}
                      {!alert.enabled && <span className="text-[10px] bg-app-surface px-1.5 py-0.5 rounded text-app-muted">Disabled</span>}
                    </div>
                    <div className="mt-1 text-xs text-app-muted">
                      Warn me when {alert.category_name ? `"${alert.category_name}" ` : ''}spending exceeds {inr.format(alert.threshold_minor / 100)} {alert.period}.
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button 
                      onClick={() => toggleEnabled(alert)} 
                      className="p-1 rounded-lg bg-app-surface/50 text-app-muted hover:text-app-foreground text-xs"
                    >
                      {alert.enabled ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => openEdit(alert)} className="p-1 rounded-lg bg-app-surface/50 text-app-muted hover:text-app-foreground"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(alert.id)} className="p-1 rounded-lg bg-app-surface/50 text-red-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {alerts.length === 0 && !isAdding && (
             <div className="text-sm text-app-muted text-center py-10">No alerts configured yet.</div>
          )}
        </div>
      )}
    </div>
  );
}


