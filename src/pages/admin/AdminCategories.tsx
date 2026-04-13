import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tag, Plus, Trash2, Edit2, Check, X } from "lucide-react";
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

  const fetchCategories = async () => { const { data } = await supabase.from("categories").select("*").order("name"); setCategories(data || []); setLoading(false); };
  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const slug = newName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { error } = await supabase.from("categories").insert({ name: newName.trim(), slug } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { setNewName(""); logActivity("category.created", "category", undefined, { name: newName.trim() }); toast({ title: "Category added" }); fetchCategories(); }
  };
  const handleUpdate = async (id: string) => {
    const slug = editName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    await supabase.from("categories").update({ name: editName.trim(), slug } as any).eq("id", id);
    setEditingId(null); logActivity("category.updated", "category", id, { name: editName.trim() }); toast({ title: "Category updated" }); fetchCategories();
  };
  const handleDelete = async (id: string) => { if (!confirm("Delete this category?")) return; await supabase.from("categories").delete().eq("id", id); logActivity("category.deleted", "category", id); toast({ title: "Category deleted" }); fetchCategories(); };

  return (
    <div className="space-y-6 pt-2 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">Categories</h1>
        <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
        <p className="text-sm text-[#8C7B6B] mt-2">Manage course categories</p>
      </motion.div>

      {/* Add */}
      <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5">
        <label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-2 block">Add Category</label>
        <div className="flex gap-3">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name" onKeyDown={(e) => e.key === "Enter" && handleAdd()} className="border-[#EDE3CC] rounded-xl focus:border-[#C49A3C]" />
          <Button onClick={handleAdd} disabled={!newName.trim()} className="gap-2 shrink-0 bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl"><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="h-8 w-8 border-4 border-[#7D1E24] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-3 flex items-center justify-between hover:bg-[#FAF6EE] transition-colors">
              {editingId === cat.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 border-[#EDE3CC] rounded-xl" />
                  <Button variant="ghost" size="sm" onClick={() => handleUpdate(cat.id)} className="hover:bg-green-50"><Check className="h-4 w-4 text-green-600" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-[#8C7B6B]" /></Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F5E9CE] flex items-center justify-center"><Tag className="h-4 w-4 text-[#7D1E24]" /></div>
                    <span className="font-medium text-[#3D2E22]">{cat.name}</span>
                    <span className="text-xs text-[#8C7B6B]">/{cat.slug}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} className="hover:bg-[#F5E9CE] text-[#7D1E24]"><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)} className="hover:bg-red-50 text-red-500"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
