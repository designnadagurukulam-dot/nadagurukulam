import { useMemo, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Music, Pencil, Plus, Trash2, Upload, Settings2, Check, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";

type EventForm = {
  title: string; description: string; event_date: string; end_date: string;
  location: string; map_url: string; image_url: string; event_type: string; is_active: boolean;
};
const emptyForm: EventForm = { title: "", description: "", event_date: "", end_date: "", location: "", map_url: "", image_url: "", event_type: "Cultural", is_active: true };
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const AdminEvents = () => {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [typesManagerOpen, setTypesManagerOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: types = [] } = useQuery({
    queryKey: ["event-types"],
    queryFn: async () => {
      const { data } = await supabase.from("event_types" as any).select("*").order("name");
      return (data as any[]) || [];
    },
  });

  const approvedEvents = events.filter((e: any) => (e.approval_status || "approved") === "approved");
  const pendingEvents = events.filter((e: any) => e.approval_status === "pending");

  const calendarDays = useMemo(() => eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }) }), [currentMonth]);
  const eventsForDate = (date: Date) => approvedEvents.filter((event: any) => isSameDay(new Date(event.event_date), date));
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
    setForm({
      title: event.title, description: event.description || "",
      event_date: event.event_date?.slice(0, 16) || "", end_date: event.end_date?.slice(0, 16) || "",
      location: event.location || "", map_url: event.map_url || "", image_url: event.image_url || "",
      event_type: event.event_type || "Cultural", is_active: event.is_active,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: EventForm) => {
      const payload: any = {
        title: formData.title, description: formData.description || null,
        event_date: formData.event_date, end_date: formData.end_date || null,
        location: formData.location || null, map_url: formData.map_url || null,
        image_url: formData.image_url || null, event_type: formData.event_type,
        is_active: formData.is_active, approval_status: "approved",
      };
      const { error } = editingId ? await supabase.from("events").update(payload).eq("id", editingId) : await supabase.from("events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      logActivity(editingId ? "event.updated" : "event.created", "event", editingId || undefined, { title: form.title });
      toast.success(editingId ? "Event updated" : "Event created");
      setDialogOpen(false); resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("events").delete().eq("id", id); if (error) throw error; },
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["admin-events"] }); logActivity("event.deleted", "event", id); toast.success("Event deleted"); },
    onError: (err: any) => toast.error(err.message),
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("events").update({ approval_status: status, is_active: status === "approved" } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      logActivity(status === "approved" ? "event.approved" : "event.rejected", "event", id);
      toast.success(`Event ${status}`);
    },
  });

  const addType = useMutation({
    mutationFn: async (name: string) => { const { error } = await supabase.from("event_types" as any).insert({ name }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event-types"] }); setNewTypeName(""); toast.success("Event type added"); },
    onError: (e: any) => toast.error(e.message),
  });
  const removeType = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_types" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event-types"] }); toast.success("Event type removed"); },
  });

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `events/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("curriculum-materials").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("curriculum-materials").getPublicUrl(path);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
      toast.success("Image uploaded");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form.title || !form.event_date) return toast.error("Title and event date are required"); saveMutation.mutate(form); };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold to-brand-primary"><CalendarDays className="h-5 w-5 text-primary-foreground" /></div>
            <div>
              <h1 className="font-display text-brand-primary">Events Calendar</h1>
              <div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-brand-gold to-transparent" />
            </div>
          </div>
          <p className="mt-2 text-sm text-brand-warm-grey">Manage institutional events, approve tutor/student suggestions.</p>
        </motion.div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setTypesManagerOpen(true)} className="gap-2 rounded-xl"><Settings2 className="h-4 w-4" /> Manage Types</Button>
          <Button onClick={() => openCreate()} className="gap-2 bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark"><Plus className="h-4 w-4" /> Add Event</Button>
        </div>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="bg-brand-cream border border-brand-parchment rounded-xl p-1">
          <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white">Calendar</TabsTrigger>
          <TabsTrigger value="approvals" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white gap-1.5">
            Approval Queue {pendingEvents.length > 0 && <Badge className="bg-brand-gold text-brand-primary-dark text-[10px]">{pendingEvents.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4 mt-4">
          <div className="rounded-2xl bg-card shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-5 w-5" /></Button>
              <h2 className="font-display text-brand-primary">{format(currentMonth, "MMMM yyyy")}</h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-5 w-5" /></Button>
            </div>
            <div className="grid grid-cols-7 px-3 pb-2 text-center text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">{weekDays.map((day) => <div key={day} className="py-2">{day}</div>)}</div>
            <div className="grid grid-cols-7 gap-1 p-3 pt-0">
              {calendarDays.map((day) => {
                const dayEvents = eventsForDate(day);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                return (
                  <button key={day.toISOString()} onClick={() => { setSelectedDate(day); if (!dayEvents.length) openCreate(day); }}
                    className={`min-h-20 rounded-xl p-2 text-left transition-all hover:bg-brand-cream ${!isSameMonth(day, currentMonth) ? "opacity-35" : ""} ${isSelected ? "bg-accent/20" : ""}`}>
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${isToday ? "bg-primary text-primary-foreground" : isSelected ? "bg-accent text-accent-foreground" : "text-brand-primary"}`}>{format(day, "d")}</span>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {dayEvents.slice(0, 3).map((event: any) => <span key={event.id} className="h-1.5 w-1.5 rounded-full bg-brand-gold" />)}
                    </div>
                    {dayEvents.length > 3 && <p className="mt-1 text-[10px] text-brand-warm-grey">+{dayEvents.length - 3} more</p>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-brand-primary">Events on {format(selectedDate, "PPP")}</h3>
              <Button variant="outline" size="sm" onClick={() => openCreate(selectedDate)}>Add on this date</Button>
            </div>
            {isLoading ? <div className="py-12 text-center text-brand-warm-grey">Loading…</div> : selectedEvents.length === 0 ? (
              <div className="rounded-2xl bg-card py-12 text-center text-brand-warm-grey shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">No events on this date.</div>
            ) : selectedEvents.map((event: any) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] ${!event.is_active ? "opacity-55" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-cream"><Music className="h-5 w-5 text-brand-primary" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base text-brand-primary flex items-center gap-2">
                      {event.title}
                      {!event.is_active && <Badge className="bg-gray-100 text-gray-600 text-[10px]">Internal</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-warm-grey">{format(new Date(event.event_date), "h:mm a")}{event.location ? ` · ${event.location}` : ""}</p>
                    {event.description && <p className="mt-1 line-clamp-2 text-sm text-brand-warm-grey">{event.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(event)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(event.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                      {event.map_url && <a href={event.map_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"><MapPin className="h-3 w-3" /> Directions <ExternalLink className="h-3 w-3" /></a>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-3 mt-4">
          {pendingEvents.length === 0 ? (
            <div className="rounded-2xl bg-card py-12 text-center text-brand-warm-grey shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">No events awaiting approval.</div>
          ) : pendingEvents.map((event: any) => (
            <div key={event.id} className="bg-card rounded-2xl p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] border-l-4 border-brand-gold">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-brand-primary">{event.title}</p>
                  <p className="text-xs text-brand-warm-grey mt-0.5">{format(new Date(event.event_date), "PPp")}{event.location ? ` · ${event.location}` : ""}</p>
                  {event.description && <p className="text-sm mt-1 text-brand-charcoal/80">{event.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approvalMutation.mutate({ id: event.id, status: "approved" })} className="bg-green-600 hover:bg-green-700 text-white gap-1"><Check className="h-3.5 w-3.5" /> Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => approvalMutation.mutate({ id: event.id, status: "rejected" })} className="gap-1"><X className="h-3.5 w-3.5" /> Reject</Button>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Event form dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">{editingId ? "Edit Event" : "Create Event"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Title *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Start *</label><Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
              <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">End</label><Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Event Type</label>
              <Select value={form.event_type} onValueChange={(event_type) => setForm({ ...form, event_type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{types.map((t: any) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Location</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Google Maps URL (for directions)</label><Input placeholder="https://maps.google.com/…" value={form.map_url} onChange={(e) => setForm({ ...form, map_url: e.target.value })} /></div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Event Image</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragActive ? "border-brand-gold bg-brand-cream" : "border-brand-parchment hover:bg-brand-cream/50"}`}
              >
                {form.image_url ? (
                  <div>
                    <img src={form.image_url} alt="" className="mx-auto h-24 rounded-lg object-cover" />
                    <p className="text-xs text-brand-warm-grey mt-2">Click or drag to replace</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-brand-warm-grey mx-auto mb-2" />
                    <p className="text-sm text-brand-warm-grey">{uploading ? "Uploading…" : "Drag & drop an image, or click to browse"}</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile(file); }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(is_active) => setForm({ ...form, is_active })} />
              <Label>Publish on public website</Label>
            </div>
            <Button type="submit" disabled={saveMutation.isPending} className="w-full bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark">{saveMutation.isPending ? "Saving..." : "Save Event"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Types manager */}
      <Dialog open={typesManagerOpen} onOpenChange={setTypesManagerOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">Manage Event Types</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="New type" />
            <Button onClick={() => newTypeName.trim() && addType.mutate(newTypeName.trim())} disabled={!newTypeName.trim()} className="bg-brand-primary text-white"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {types.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between bg-brand-cream rounded-xl px-3 py-2">
                <span className="text-sm">{t.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeType.mutate(t.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvents;
