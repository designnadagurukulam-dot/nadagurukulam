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

export type Designation = { id: string; name: string; slug: string; is_active: boolean; sort_order: number };

export const slugifyDesignation = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);

export const fetchDesignations = async (): Promise<Designation[]> => {
  const { data } = await db.from("designations").select("*").order("sort_order").order("name");
  return (data || []) as Designation[];
};

const NONE = "__none__";

interface Props {
  value?: string | null;
  onChange: (name: string) => void;
  canManage?: boolean;
  label?: string;
  className?: string;
}

/** Stores the designation NAME (text) on the profile, so existing free-text values keep working. */
const DesignationSelect = ({ value, onChange, canManage = true, label = "Designation", className }: Props) => {
  const [items, setItems] = useState<Designation[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => setItems(await fetchDesignations());
  useEffect(() => { load(); }, []);

  const current = value || "";
  const options = items.filter((d) => d.is_active || d.name === current);
  const isLegacy = !!current && !items.some((d) => d.name === current);

  const add = async () => {
    const name = newName.trim();
    if (name.length < 2) return toast.error("Enter a valid designation name");
    if (name.length > 80) return toast.error("Name must be under 80 characters");
    if (items.some((d) => d.name.toLowerCase() === name.toLowerCase())) return toast.error("This designation already exists");
    setSaving(true);
    const { error } = await db.from("designations").insert({ name, slug: slugifyDesignation(name), sort_order: (items.length + 1) * 10 });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Designation added");
    setNewName("");
    setAddOpen(false);
    await load();
    onChange(name);
  };

  return (
    <div className={className}>
      {label && <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>}
      <Select
        value={current || NONE}
        onValueChange={(v) => {
          if (v === "__add__") { setAddOpen(true); return; }
          onChange(v === NONE ? "" : v);
        }}
      >
        <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select designation" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Not set</SelectItem>
          {isLegacy && <SelectItem value={current}>{current}</SelectItem>}
          {options.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}{!d.is_active ? " (inactive)" : ""}</SelectItem>)}
          {canManage && <SelectItem value="__add__" className="text-brand-primary">+ Add new designation…</SelectItem>}
        </SelectContent>
      </Select>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">Add Designation</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">e.g. Principal, Assistant Professor, Accompanist, Office Staff.</p>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Designation name" className="rounded-xl" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={add} disabled={saving} className="gap-1"><Plus className="h-4 w-4" /> {saving ? "Adding…" : "Add Designation"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesignationSelect;
