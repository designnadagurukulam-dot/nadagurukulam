import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const db = supabase as any;

export type FacultyType = { id: string; name: string; slug: string; is_active: boolean; sort_order: number };

export const slugifyType = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);

export const fetchFacultyTypes = async (): Promise<FacultyType[]> => {
  const { data } = await db.from("faculty_types").select("*").order("sort_order").order("name");
  return (data || []) as FacultyType[];
};

interface Props {
  value?: string | null;
  onChange: (slug: string) => void;
  canManage?: boolean;
  label?: string;
}

const FacultyTypeSelect = ({ value, onChange, canManage = true, label = "Faculty Type" }: Props) => {
  const [types, setTypes] = useState<FacultyType[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => setTypes(await fetchFacultyTypes());
  useEffect(() => { load(); }, []);

  const current = value || "regular";
  const options = types.filter((t) => t.is_active || t.slug === current);

  const addType = async () => {
    const name = newName.trim();
    if (name.length < 2) return toast.error("Enter a valid type name");
    if (name.length > 60) return toast.error("Name must be under 60 characters");
    if (types.some((t) => t.name.toLowerCase() === name.toLowerCase())) return toast.error("This faculty type already exists");
    setSaving(true);
    const slug = slugifyType(name);
    const { error } = await db.from("faculty_types").insert({ name, slug, sort_order: (types.length + 1) * 10 });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Faculty type added");
    setNewName("");
    setAddOpen(false);
    await load();
    onChange(slug);
  };

  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Select
        value={current}
        onValueChange={(v) => { if (v === "__add__") { setAddOpen(true); return; } onChange(v); }}
      >
        <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select faculty type" /></SelectTrigger>
        <SelectContent>
          {options.map((t) => <SelectItem key={t.id} value={t.slug}>{t.name}{!t.is_active ? " (inactive)" : ""}</SelectItem>)}
          {canManage && <SelectItem value="__add__" className="text-brand-primary">+ Add new faculty type…</SelectItem>}
        </SelectContent>
      </Select>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">Add Faculty Type</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">e.g. Lecture Demonstrator, Honorarium Faculty, Visiting Faculty.</p>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Faculty type name" className="rounded-xl" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addType} disabled={saving} className="gap-1"><Plus className="h-4 w-4" /> {saving ? "Adding…" : "Add Type"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacultyTypeSelect;
