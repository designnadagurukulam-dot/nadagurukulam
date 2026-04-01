import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tag, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const AdminCategories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const slug = newName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { error } = await supabase.from("categories").insert({ name: newName.trim(), slug } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewName("");
      toast({ title: "Category added" });
      fetchCategories();
    }
  };

  const handleUpdate = async (id: string) => {
    const slug = editName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    await supabase.from("categories").update({ name: editName.trim(), slug } as any).eq("id", id);
    setEditingId(null);
    toast({ title: "Category updated" });
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    toast({ title: "Category deleted" });
    fetchCategories();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl text-foreground">Categories</h1>
        <p className="text-muted-foreground mt-1">Manage course categories</p>
      </motion.div>

      <Card>
        <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <Button onClick={handleAdd} disabled={!newName.trim()} className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Add</Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between p-3">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                    <Button variant="ghost" size="sm" onClick={() => handleUpdate(cat.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{cat.name}</span>
                      <span className="text-xs text-muted-foreground">/{cat.slug}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(cat.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
