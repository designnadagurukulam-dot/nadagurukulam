import { useEffect, useState } from "react";
import { GraduationCap, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Qualification {
  id: string;
  user_id: string;
  degree_name: string;
  specialization: string | null;
  institution: string | null;
  board_university: string | null;
  year_of_completion: number | null;
  grade: string | null;
  certificate_url: string | null;
  notes: string | null;
}

const emptyForm = {
  degree_name: "",
  specialization: "",
  institution: "",
  board_university: "",
  year_of_completion: "",
  grade: "",
  certificate_url: "",
  notes: "",
};

interface Props {
  userId: string;
  editable?: boolean;
  title?: string;
}

const QualificationsList = ({ userId, editable = true, title = "Qualifications" }: Props) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from("user_qualifications" as any) as any)
      .select("*")
      .eq("user_id", userId)
      .order("year_of_completion", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    setItems((data as Qualification[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm }); setOpen(true); };
  const openEdit = (q: Qualification) => {
    setEditingId(q.id);
    setForm({
      degree_name: q.degree_name || "",
      specialization: q.specialization || "",
      institution: q.institution || "",
      board_university: q.board_university || "",
      year_of_completion: q.year_of_completion?.toString() || "",
      grade: q.grade || "",
      certificate_url: q.certificate_url || "",
      notes: q.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    const degree = form.degree_name.trim();
    if (!degree) { toast({ title: "Degree / certificate name is required", variant: "destructive" }); return; }
    const year = form.year_of_completion ? parseInt(form.year_of_completion, 10) : null;
    if (year !== null && (isNaN(year) || year < 1950 || year > new Date().getFullYear() + 10)) {
      toast({ title: "Enter a valid year of completion", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: Record<string, any> = {
      user_id: userId,
      degree_name: degree.slice(0, 150),
      specialization: form.specialization.trim() || null,
      institution: form.institution.trim() || null,
      board_university: form.board_university.trim() || null,
      year_of_completion: year,
      grade: form.grade.trim() || null,
      certificate_url: form.certificate_url.trim() || null,
      notes: form.notes.trim() || null,
    };
    const table = supabase.from("user_qualifications" as any) as any;
    const { error } = editingId
      ? await table.update(payload).eq("id", editingId)
      : await table.insert(payload);
    setSaving(false);
    if (error) { toast({ title: "Could not save qualification", description: error.message, variant: "destructive" }); return; }
    toast({ title: editingId ? "Qualification updated" : "Qualification added" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await (supabase.from("user_qualifications" as any) as any).delete().eq("id", id);
    if (error) { toast({ title: "Could not delete", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Qualification removed" });
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5 text-brand-gold" /> {title}
        </Label>
        {editable && (
          <Button size="sm" variant="outline" onClick={openAdd} className="gap-1 rounded-xl h-8">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground rounded-xl border border-dashed p-3">No qualifications added yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((q) => (
            <li key={q.id} className="rounded-xl border bg-background p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground">
                  {q.degree_name}
                  {q.specialization ? <span className="text-muted-foreground font-normal"> — {q.specialization}</span> : null}
                </p>
                {(q.institution || q.board_university) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[q.institution, q.board_university].filter(Boolean).join(" · ")}
                  </p>
                )}
                {(q.grade || q.notes) && (
                  <p className="text-xs text-muted-foreground mt-0.5">{[q.grade, q.notes].filter(Boolean).join(" · ")}</p>
                )}
                {q.certificate_url && (
                  <a href={q.certificate_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1 hover:underline">
                    <ExternalLink className="h-3 w-3" /> View certificate
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-semibold rounded-full border px-2 py-0.5 text-muted-foreground">
                  {q.year_of_completion ?? "—"}
                </span>
                {editable && (
                  <>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(q)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(q.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit qualification" : "Add qualification"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Degree / Certificate *</Label>
              <Input value={form.degree_name} onChange={(e) => setForm({ ...form, degree_name: e.target.value })} maxLength={150} placeholder="M.A. Music / Diploma in Bharatanatyam" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Specialization</Label>
              <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} maxLength={150} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Year of Completion</Label>
              <Input type="number" value={form.year_of_completion} onChange={(e) => setForm({ ...form, year_of_completion: e.target.value })} placeholder="2020" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Institution</Label>
              <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} maxLength={200} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Board / University</Label>
              <Input value={form.board_university} onChange={(e) => setForm({ ...form, board_university: e.target.value })} maxLength={200} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Grade / Percentage</Label>
              <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} maxLength={50} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Certificate Link</Label>
              <Input value={form.certificate_url} onChange={(e) => setForm({ ...form, certificate_url: e.target.value })} maxLength={500} placeholder="https://…" className="mt-1 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} maxLength={500} className="mt-1 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={save} disabled={saving} className="rounded-xl">{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QualificationsList;
