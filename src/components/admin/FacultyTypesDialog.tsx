import { useEffect, useState } from "react";
import { Check, Plus, Power, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FacultyType, fetchFacultyTypes, slugifyType } from "./FacultyTypeSelect";

const db = supabase as any;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

const FacultyTypesDialog = ({ open, onOpenChange, onChanged }: Props) => {
  const [types, setTypes] = useState<FacultyType[]>([]);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = async () => setTypes(await fetchFacultyTypes());
  useEffect(() => { if (open) load(); }, [open]);

  const refresh = async () => { await load(); onChanged?.(); };

  const add = async () => {
    const name = newName.trim();
    if (name.length < 2) return toast.error("Enter a valid type name");
    if (name.length > 60) return toast.error("Name must be under 60 characters");
    if (types.some((t) => t.name.toLowerCase() === name.toLowerCase())) return toast.error("This faculty type already exists");
    setBusy(true);
    const { error } = await db.from("faculty_types").insert({ name, slug: slugifyType(name), sort_order: (types.length + 1) * 10 });
    setBusy(false);
    if (error) return toast.error(error.message);
    setNewName("");
    toast.success("Faculty type added");
    refresh();
  };

  const rename = async (t: FacultyType) => {
    const name = (editing[t.id] || "").trim();
    if (name.length < 2) return toast.error("Enter a valid name");
    if (types.some((x) => x.id !== t.id && x.name.toLowerCase() === name.toLowerCase())) return toast.error("Another type already uses this name");
    const { error } = await db.from("faculty_types").update({ name }).eq("id", t.id);
    if (error) return toast.error(error.message);
    setEditing((p) => { const n = { ...p }; delete n[t.id]; return n; });
    toast.success("Renamed");
    refresh();
  };

  const toggleActive = async (t: FacultyType) => {
    const { error } = await db.from("faculty_types").update({ is_active: !t.is_active }).eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success(t.is_active ? "Type deactivated" : "Type activated");
    refresh();
  };

  const remove = async (t: FacultyType) => {
    const { count } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("instructor_type", t.slug);
    if (count) return toast.error(`${count} faculty use this type — deactivate it instead`);
    const { error } = await db.from("faculty_types").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Type deleted");
    refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle className="font-display text-brand-primary">Manage Faculty Types</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">Types used across faculty profiles — e.g. Regular Staff, Guest Faculty, Lecture Demonstrator, Honorarium Faculty.</p>

        <div className="flex gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New faculty type name" className="rounded-xl" />
          <Button onClick={add} disabled={busy} className="shrink-0 gap-1 bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark"><Plus className="h-4 w-4" /> Add</Button>
        </div>

        <div className="space-y-2">
          {types.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No faculty types yet.</p>}
          {types.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-xl bg-brand-cream p-2">
              {editing[t.id] !== undefined ? (
                <>
                  <Input value={editing[t.id]} onChange={(e) => setEditing((p) => ({ ...p, [t.id]: e.target.value }))} className="h-9 rounded-lg" />
                  <Button size="sm" onClick={() => rename(t)} className="gap-1"><Check className="h-4 w-4" /></Button>
                </>
              ) : (
                <>
                  <button className="flex-1 text-left text-sm font-semibold text-brand-primary" onClick={() => setEditing((p) => ({ ...p, [t.id]: t.name }))}>{t.name}</button>
                  {!t.is_active && <Badge className="border-0 bg-muted text-muted-foreground">Inactive</Badge>}
                  <Button size="sm" variant="outline" onClick={() => toggleActive(t)} title={t.is_active ? "Deactivate" : "Activate"}><Power className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => remove(t)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FacultyTypesDialog;
