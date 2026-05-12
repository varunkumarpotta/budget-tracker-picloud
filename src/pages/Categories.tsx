import { Plus, Tags, Trash2, Edit2, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  sort_order?: number;
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await apiGet<Category[]>("/api/v1/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const res = await apiPost<Category>("/api/v1/categories", { 
        name: newName.trim(),
        icon: newIcon.trim() || null
      });
      setCategories([...categories, res.data]);
      setNewName("");
      setNewIcon("");
      setIsAdding(false);
    } catch (err) {
      alert("Failed to add category");
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const res = await apiPut<Category>(`/api/v1/categories/${id}`, { 
        name: editName.trim(),
        icon: editIcon.trim() || null
      });
      setCategories(categories.map(c => c.id === id ? res.data : c));
      setEditingId(null);
    } catch (err) {
      alert("Failed to update category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await apiDelete(`/api/v1/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      alert("Failed to delete category");
    }
  };

  const moveCategory = async (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= categories.length) return;
    
    const newCats = [...categories];
    // Swap
    const temp = newCats[index];
    newCats[index] = newCats[index + direction];
    newCats[index + direction] = temp;
    
    setCategories(newCats);

    const ids = newCats.map(c => c.id);
    try {
      await apiPut("/api/v1/categories/reorder", { ids });
    } catch (err) {
      console.error("Failed to reorder", err);
      // Fallback
      fetchCategories();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Categories & tags</div>
          <div className="mt-1 text-xs text-app-muted">
            Customize categories with emojis and set their order.
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold mb-4">
          <Tags className="h-4 w-4 text-[rgb(var(--accent))]" />
          Your Categories
        </div>
        
        {isAdding && (
          <div className="flex items-center gap-2 mb-4 p-2 border border-app-border/40 rounded-xl bg-app-surface/50">
            <Input 
              value={newIcon} 
              onChange={e => setNewIcon(e.target.value)} 
              placeholder="🍔" 
              className="h-8 w-12 text-center"
              maxLength={2}
            />
            <Input 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="Category name" 
              className="h-8 flex-1"
              autoFocus
            />
            <Button size="sm" onClick={handleAdd}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-app-muted">Loading...</div>
        ) : (
          <div className="flex flex-col gap-2">
            {categories.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-app-border/40 bg-app-surface/20 px-4 py-2"
              >
                {editingId === c.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input 
                      value={editIcon} 
                      onChange={e => setEditIcon(e.target.value)} 
                      placeholder="🍔" 
                      className="h-8 w-12 text-center"
                      maxLength={2}
                    />
                    <Input 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      className="h-8 flex-1"
                      autoFocus
                    />
                    <button onClick={() => handleEdit(c.id)} className="text-emerald-500 hover:text-emerald-400 p-1"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-app-foreground flex items-center gap-2">
                      <span className="text-lg leading-none">{c.icon || "🏷️"}</span>
                      {c.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col border-r border-app-border/40 pr-2 mr-1">
                        <button 
                          onClick={() => moveCategory(idx, -1)}
                          disabled={idx === 0}
                          className="text-app-muted hover:text-app-foreground disabled:opacity-30 disabled:hover:text-app-muted"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => moveCategory(idx, 1)}
                          disabled={idx === categories.length - 1}
                          className="text-app-muted hover:text-app-foreground disabled:opacity-30 disabled:hover:text-app-muted"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <button 
                        onClick={() => { setEditingId(c.id); setEditName(c.name); setEditIcon(c.icon || ""); }} 
                        className="text-app-muted hover:text-app-foreground p-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)} 
                        className="text-app-muted hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
