import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Music, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";

type EventForm = { title: string; description: string; event_date: string; end_date: string; location: string; image_url: string; event_type: string; is_active: boolean };
const emptyForm: EventForm = { title: "", description: "", event_date: "", end_date: "", location: "", image_url: "", event_type: "cultural", is_active: true };
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const eventTypes = ["cultural", "concert", "workshop", "academic", "festival"];
const typeTone: Record<string, string> = { cultural: "bg-accent", concert: "bg-primary", workshop: "bg-secondary", academic: "bg-muted-foreground", festival: "bg-destructive" };

const AdminEvents = () => {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const calendarDays = useMemo(() => eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }) }), [currentMonth]);
  const eventsForDate = (date: Date) => events.filter((event: any) => isSameDay(new Date(event.event_date), date));
  const selectedEvents = eventsForDate(selectedDate);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };
  const openCreate = (date = selectedDate) => {
    resetForm();
    setSelectedDate(date);
    setForm({ ...emptyForm, event_date: format(date, "yyyy-MM-dd'T'HH:mm") });
    setDialogOpen(true);
  };
  const openEdit = (event: any) => {
    setEditingId(event.id);
    setForm({ title: event.title, description: event.description || "", event_date: event.event_date?.slice(0, 16) || "", end_date: event.end_date?.slice(0, 16) || "", location: event.location || "", image_url: event.image_url || "", event_type: event.event_type || "cultural", is_active: event.is_active });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: EventForm) => {
      const payload: any = { title: formData.title, description: formData.description || null, event_date: formData.event_date, end_date: formData.end_date || null, location: formData.location || null, image_url: formData.image_url || null, event_type: formData.event_type, is_active: formData.is_active };
      const { error } = editingId ? await supabase.from("events").update(payload).eq("id", editingId) : await supabase.from("events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-events"] }); logActivity(editingId ? "event.updated" : "event.created", "event", editingId || undefined, { title: form.title }); toast.success(editingId ? "Event updated" : "Event created"); setDialogOpen(false); resetForm(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("events").delete().eq("id", id); if (error) throw error; },
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["admin-events"] }); logActivity("event.deleted", "event", id); toast.success("Event deleted"); },
    onError: (err: any) => toast.error(err.message),
  });

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form.title || !form.event_date) return toast.error("Title and event date are required"); saveMutation.mutate(form); };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold to-brand-primary"><CalendarDays className="h-5 w-5 text-primary-foreground" /></div><div><h1 className="font-display text-brand-primary">Events Calendar</h1><div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-brand-gold to-transparent" /></div></div>
          <p className="mt-2 text-sm text-brand-warm-grey">Click a date to view, add, edit or delete institutional events.</p>
        </motion.div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">{eventTypes.map((type) => <span key={type} className="inline-flex items-center gap-1.5 capitalize"><span className={`h-2 w-2 rounded-full ${typeTone[type] || "bg-accent"}`} />{type}</span>)}</div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button onClick={() => openCreate()} className="gap-2 bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark"><Plus className="h-4 w-4" /> Add Event</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl"><DialogHeader><DialogTitle className="font-display text-brand-primary">{editingId ? "Edit Event" : "Create Event"}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-4"><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Title *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div><div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Start *</label><Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">End</label><Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div></div><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Event Type</label><Select value={form.event_type} onValueChange={(event_type) => setForm({ ...form, event_type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{eventTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Location</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Image URL</label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div><div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(is_active) => setForm({ ...form, is_active })} /><Label>Active on public page</Label></div><Button type="submit" disabled={saveMutation.isPending} className="w-full bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark">{saveMutation.isPending ? "Saving..." : "Save Event"}</Button></form></DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl bg-card shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
        <div className="flex items-center justify-between p-4"><Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-5 w-5" /></Button><h2 className="font-display text-brand-primary">{format(currentMonth, "MMMM yyyy")}</h2><Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-5 w-5" /></Button></div>
        <div className="grid grid-cols-7 px-3 pb-2 text-center text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">{weekDays.map((day) => <div key={day} className="py-2">{day}</div>)}</div>
        <div className="grid grid-cols-7 gap-1 p-3 pt-0">{calendarDays.map((day) => { const dayEvents = eventsForDate(day); const isSelected = isSameDay(day, selectedDate); const isToday = isSameDay(day, new Date()); return <button key={day.toISOString()} onClick={() => { setSelectedDate(day); if (!dayEvents.length) openCreate(day); }} className={`min-h-20 rounded-xl p-2 text-left transition-all hover:bg-brand-cream ${!isSameMonth(day, currentMonth) ? "opacity-35" : ""} ${isSelected ? "bg-accent/20" : ""}`}><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${isToday ? "bg-primary text-primary-foreground" : isSelected ? "bg-accent text-accent-foreground" : "text-brand-primary"}`}>{format(day, "d")}</span><div className="mt-2 flex flex-wrap gap-1">{dayEvents.slice(0, 3).map((event: any) => <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${typeTone[event.event_type] || "bg-accent"}`} />)}</div>{dayEvents.length > 3 && <p className="mt-1 text-[10px] text-brand-warm-grey">+{dayEvents.length - 3} more</p>}</button>; })}</div>
      </div>

      <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-display text-brand-primary">Events on {format(selectedDate, "PPP")}</h3><Button variant="outline" size="sm" onClick={() => openCreate(selectedDate)}>Add on this date</Button></div>{isLoading ? <div className="py-12 text-center text-brand-warm-grey">Loading events…</div> : selectedEvents.length === 0 ? <div className="rounded-2xl bg-card py-12 text-center text-brand-warm-grey shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">No events on this date.</div> : selectedEvents.map((event: any) => <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] ${!event.is_active ? "opacity-55 grayscale" : ""}`}><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-cream"><Music className="h-5 w-5 text-brand-primary" /></div><div className="min-w-0 flex-1"><p className="font-display text-base text-brand-primary">{event.title}</p><p className="mt-0.5 text-xs text-brand-warm-grey">{format(new Date(event.event_date), "h:mm a")} {event.location ? `· ${event.location}` : ""}</p>{event.description && <p className="mt-1 line-clamp-2 text-sm text-brand-warm-grey">{event.description}</p>}<div className="mt-2 flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => openEdit(event)}><Pencil className="h-3.5 w-3.5" /> Edit</Button><Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(event.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>{event.location && <span className="inline-flex items-center gap-1 text-xs text-brand-warm-grey"><MapPin className="h-3 w-3" /> {event.location}</span>}</div></div></div></motion.div>)}</div>
    </div>
  );
};

export default AdminEvents;
