import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, CalendarDays, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { logActivity } from "@/lib/activityLogger";

interface EventForm { title: string; description: string; event_date: string; end_date: string; location: string; image_url: string; is_active: boolean; }
const emptyForm: EventForm = { title: "", description: "", event_date: "", end_date: "", location: "", image_url: "", is_active: true };

const AdminEvents = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => { const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true }); if (error) throw error; return data; },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: EventForm) => {
      const payload = { title: formData.title, description: formData.description || null, event_date: formData.event_date, end_date: formData.end_date || null, location: formData.location || null, image_url: formData.image_url || null, is_active: formData.is_active };
      if (editingId) { const { error } = await supabase.from("events").update(payload).eq("id", editingId); if (error) throw error; }
      else { const { error } = await supabase.from("events").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-events"] }); logActivity(editingId ? "event.updated" : "event.created", "event", editingId || undefined, { title: form.title }); toast.success(editingId ? "Event updated" : "Event created"); setDialogOpen(false); resetForm(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("events").delete().eq("id", id); if (error) throw error; },
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["admin-events"] }); logActivity("event.deleted", "event", id); toast.success("Event deleted"); },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };
  const openEdit = (event: any) => { setEditingId(event.id); setForm({ title: event.title, description: event.description || "", event_date: event.event_date ? event.event_date.slice(0, 16) : "", end_date: event.end_date ? event.end_date.slice(0, 16) : "", location: event.location || "", image_url: event.image_url || "", is_active: event.is_active }); setDialogOpen(true); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.title || !form.event_date) { toast.error("Title and event date are required"); return; } saveMutation.mutate(form); };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-brand-primary">Events Management</h1>
              <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
            </div>
          </div>
          <p className="text-sm text-brand-warm-grey mt-2">Create and manage upcoming events</p>
        </motion.div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button className="gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl"><Plus className="h-4 w-4" /> Add Event</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-brand-parchment">
            <DialogHeader><DialogTitle className="font-serif text-xl text-brand-primary">{editingId ? "Edit Event" : "Create Event"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Title *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-brand-parchment rounded-xl" /></div>
              <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="border-brand-parchment rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Start *</label><Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="border-brand-parchment rounded-xl" /></div>
                <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">End</label><Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="border-brand-parchment rounded-xl" /></div>
              </div>
              <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Location</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border-brand-parchment rounded-xl" /></div>
              <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Image URL</label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="border-brand-parchment rounded-xl" /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label className="text-brand-warm-grey">Active (visible to public)</Label></div>
              <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : editingId ? "Update Event" : "Create Event"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4"><CalendarDays className="h-7 w-7 text-brand-gold" /></div>
          <h3 className="font-serif text-xl text-brand-primary">No Events Yet</h3>
          <p className="text-sm text-brand-warm-grey mt-1">Create your first event!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event: any, i: number) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <div className={`group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden hover:bg-brand-cream hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300 ${!event.is_active ? "opacity-60" : ""}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-serif text-lg text-brand-primary">{event.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-brand-warm-grey">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-brand-gold" />{format(new Date(event.event_date), "PPP p")}</span>
                        {event.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-brand-gold" />{event.location}</span>}
                        <Badge className={event.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"}>{event.is_active ? "Active" : "Inactive"}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(event)} className="hover:bg-brand-gold-pale text-brand-primary"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(event.id)} className="hover:bg-red-50 text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  {event.description && <p className="text-sm text-brand-warm-grey mt-3 line-clamp-2">{event.description}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
