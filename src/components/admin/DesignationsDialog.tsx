import { useEffect, useState } from "react";
import { Check, Plus, Power, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Designation, fetchDesignations, slugifyDesignation } from "./DesignationSelect";

const db = supabase as any;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

const DesignationsDialog = ({ open, onOpenChange, onChanged }: Props) => {
  const [items, setItems] = useState<Designation[]>([]);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = async () => setItems(await fetchDesignations());
  useEffect(() => { if (open) load(); }, [open]);

  const refresh = async () => { await load(); onChanged?.(); };

  const add = async () => {
    const name = newName.trim();
    if (name.length < 2) return toast.error("Enter a valid designation name");
    if (name.length > 80) return toast.error("Name must be under 80 characters");
    if (items.some((d) => d.name.toLowerCase() === name.toLowerCase())) return toast.error("This designation already exists");
    setBusy(true);
    const { error } = await db.from("designations").insert({ name, slug: slugifyDesignation(name), sort_order: (items.length + 1) * 10 });
    setBusy(false);
    if (error) return toast.error(error.message);
    setNewName("");
    toast.success("Designation added");
    refresh();
  };

  const rename = async (d: Designation) => {
    const name = (editing[d.id] || "").trim();
    if (name.length < 2) return toast.error("Enter a valid name");
    if (items.some((x) => x.id !== d.id && x.name.toLowerCase() === name.toLowerCase())) return toast.error("Another designation already uses this name");
    const oldName = d.name;
    const { error } = await db.from("designations").update({ name }).eq("id", d.id);
    if (error) return toast.error(error.message);
    // keep profiles in sync since designation is stored as text
    await db.from("profiles").update({ designation: name }).eq("designation", oldName);
    setEditing((p) => { const n = { ...p }; delete n[d.id]; return n; });
    toast.success("Renamed");
    refresh();
  };

  const toggleActive = async (d: Designation) => {
    const { error } = await db.from("designations").update({ is_active: !d.is_active }).eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success(d.is_active ? "Designation deactivated" : "Designation activated");
    refresh();
  };

  const remove = async (d: Designation) => {
    const { count } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("designation", d.name);
    if (count) return toast.error(`${count} user(s) use this designation — deactivate it instead`);
    const { error } = await db.from("designations").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Designation deleted");
    refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle className="font-display text-brand-primary">Manage Designations</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">Designations used across user and faculty profiles — e.g. Principal, Assistant Professor, Guest Faculty, Office Staff.</p>

        <div className="flex gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New designation name" className="rounded-xl" />
          <Button onClick={add} disabled={busy} className="shrink-0 gap-1 bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark"><Plus className="h-4 w-4" /> Add</Button>
        </div>

        <div className="space-y-2">
          {items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No designations yet.</p>}
          {items.map((d) => (
            <div key={d.id} className="flex items-center gap-2 rounded-xl bg-brand-cream p-2">
              {editing[d.id] !== undefined ? (
                <>
                  <Input value={editing[d.id]} onChange={(e) => setEditing((p) => ({ ...p, [d.id]: e.target.value }))} className="h-9 rounded-lg" />
                  <Button size="sm" onClick={() => rename(d)} className="gap-1"><Check className="h-4 w-4" /></Button>
                </>
              ) : (
                <>
                  <button className="flex-1 text-left text-sm font-semibold text-brand-primary" onClick={() => setEditing((p) => ({ ...p, [d.id]: d.name }))}>{d.name}</button>
                  {!d.is_active && <Badge className="border-0 bg-muted text-muted-foreground">Inactive</Badge>}
                  <Button size="sm" variant="outline" onClick={() => toggleActive(d)} title={d.is_active ? "Deactivate" : "Activate"}><Power className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => remove(d)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DesignationsDialog;
