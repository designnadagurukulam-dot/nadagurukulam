import { useEffect, useState } from "react";
import { Shield, Plus, Pencil, Trash2, Download, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

export const DOCUMENT_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Passport",
  "Driving Licence",
  "Voter ID",
  "Other Government ID",
  "Others",
];

interface KycDocument {
  id: string;
  user_id: string;
  document_type: string;
  custom_type: string | null;
  document_number: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

const emptyForm = { document_type: "", custom_type: "", document_number: "" };

const validateNumber = (type: string, num: string): string | null => {
  const v = num.trim();
  if (!v) return "Document number is required";
  if (type === "Aadhaar Card" && !/^\d{4}\s?\d{4}\s?\d{4}$/.test(v)) return "Aadhaar must be 12 digits";
  if (type === "PAN Card" && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.toUpperCase())) return "PAN must look like ABCDE1234F";
  if (type === "Passport" && !/^[A-Z][0-9]{7}$/.test(v.toUpperCase())) return "Passport must look like A1234567";
  if (type === "Voter ID" && !/^[A-Z]{3}[0-9]{7}$/.test(v.toUpperCase())) return "Voter ID must look like ABC1234567";
  if (v.length > 40) return "Document number is too long";
  return null;
};

interface Props {
  userId: string;
  editable?: boolean;
}

const KycDocumentsList = ({ userId, editable = true }: Props) => {
  const { toast } = useToast();
  const [items, setItems] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await db.from("kyc_documents").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setItems((data as KycDocument[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (userId) load(); /* eslint-disable-next-line */ }, [userId]);

  const openNew = () => { setEditingId(null); setForm({ ...emptyForm }); setFile(null); setOpen(true); };
  const openEdit = (d: KycDocument) => {
    setEditingId(d.id);
    setForm({ document_type: d.document_type || "", custom_type: d.custom_type || "", document_number: d.document_number || "" });
    setFile(null);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.document_type) { toast({ title: "Select a document type", variant: "destructive" }); return; }
    if (form.document_type === "Others" && !form.custom_type.trim()) {
      toast({ title: "Enter the custom document name", variant: "destructive" }); return;
    }
    const err = validateNumber(form.document_type, form.document_number);
    if (err) { toast({ title: err, variant: "destructive" }); return; }

    setSaving(true);
    let fileUrl: string | undefined;
    let fileName: string | undefined;
    if (file) {
      if (file.size > 10 * 1024 * 1024) { setSaving(false); toast({ title: "File must be under 10MB", variant: "destructive" }); return; }
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true });
      if (upErr) { setSaving(false); toast({ title: "Upload failed", description: upErr.message, variant: "destructive" }); return; }
      fileUrl = path;
      fileName = file.name;
    }

    const payload: Record<string, any> = {
      user_id: userId,
      document_type: form.document_type,
      custom_type: form.document_type === "Others" ? form.custom_type.trim() : null,
      document_number: form.document_number.trim().toUpperCase(),
    };
    if (fileUrl) { payload.file_url = fileUrl; payload.file_name = fileName; }

    const { error } = editingId
      ? await db.from("kyc_documents").update(payload).eq("id", editingId)
      : await db.from("kyc_documents").insert(payload);
    setSaving(false);
    if (error) { toast({ title: "Could not save document", description: error.message, variant: "destructive" }); return; }
    toast({ title: editingId ? "Document updated" : "Document added" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await db.from("kyc_documents").delete().eq("id", id);
    if (error) { toast({ title: "Could not delete", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Document removed" });
    load();
  };

  const handleView = async (d: KycDocument) => {
    if (!d.file_url) return;
    const { data, error } = await supabase.storage.from("kyc-documents").createSignedUrl(d.file_url, 300);
    if (error || !data) { toast({ title: "Could not open file", variant: "destructive" }); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-serif text-base text-primary flex items-center gap-2"><Shield className="h-4 w-4" /> KYC Documents</h4>
        {editable && (
          <Button size="sm" onClick={openNew} className="gap-1 rounded-xl"><Plus className="h-4 w-4" /> Add Document</Button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No KYC documents added yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((d) => (
            <div key={d.id} className="rounded-xl border bg-background p-3 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {d.document_type === "Others" ? d.custom_type || "Other Document" : d.document_type}
                </p>
                <p className="text-xs text-muted-foreground font-mono">{d.document_number || "—"}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  {d.file_name && <><FileText className="h-3 w-3" /> {d.file_name} · </>}
                  Added {new Date(d.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1">
                {d.file_url && (
                  <Button size="sm" variant="outline" className="gap-1 rounded-xl" onClick={() => handleView(d)}>
                    <Download className="h-3.5 w-3.5" /> View
                  </Button>
                )}
                {editable && (
                  <>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" className="rounded-xl text-destructive" onClick={() => handleDelete(d.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Update KYC Document" : "Add KYC Document"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Document Type</Label>
              <SearchableSelect
                value={form.document_type}
                onChange={(v) => setForm((p) => ({ ...p, document_type: v }))}
                options={DOCUMENT_TYPES}
                placeholder="Select document type"
                className="mt-1"
              />
            </div>
            {form.document_type === "Others" && (
              <div>
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Custom Document Name</Label>
                <Input value={form.custom_type} onChange={(e) => setForm((p) => ({ ...p, custom_type: e.target.value }))} maxLength={60} className="mt-1 rounded-xl" placeholder="e.g. Ration Card" />
              </div>
            )}
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Document Number</Label>
              <Input value={form.document_number} onChange={(e) => setForm((p) => ({ ...p, document_number: e.target.value }))} maxLength={40} className="mt-1 rounded-xl" placeholder="Enter document number" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Upload Document</Label>
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 rounded-xl" />
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1"><Upload className="h-3 w-3" /> PDF or image, max 10MB{editingId ? " — leave empty to keep existing file" : ""}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KycDocumentsList;
