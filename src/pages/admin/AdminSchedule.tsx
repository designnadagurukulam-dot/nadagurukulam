import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { addDays, addWeeks, endOfWeek, format, isSameDay, setHours, setMinutes, startOfWeek, subWeeks } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";

type ScheduleEntry = {
  id: string;
  event_title: string;
  start_time: string;
  end_time: string;
  event_type: string;
  course_id: string | null;
  batch_id?: string | null;
  curriculum_module_id?: string | null;
  instructor_id: string | null;
  location?: string | null;
  recurrence_type?: string | null;
  user_id: string;
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = Array.from({ length: 16 }, (_, i) => i + 6);
const eventTypes = ["class", "lab", "exam", "event", "holiday", "break"];

const getEventStyle = (type: string) => {
  switch (type) {
    case "exam": return "bg-destructive/10 text-destructive";
    case "lab": return "bg-accent/20 text-accent-foreground";
    case "holiday": return "bg-muted text-muted-foreground";
    case "break": return "bg-secondary text-secondary-foreground";
    default: return "bg-primary text-primary-foreground";
  }
};

const AdminSchedule = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<{ user_id: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filterMode, setFilterMode] = useState("all");
  const [filterValue, setFilterValue] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEntry | null>(null);
  const [form, setForm] = useState({ title: "", type: "class", batchId: "", moduleId: "", instructorId: "", start: "", end: "", recurrence: "one_time", location: "" });

  const weekDays = useMemo(() => days.map((_, index) => addDays(weekStart, index)), [weekStart]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: sched }, { data: batchData }, { data: moduleData }, { data: instrRoles }] = await Promise.all([
      supabase.from("schedules").select("*").gte("start_time", weekStart.toISOString()).lte("start_time", endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString()).order("start_time", { ascending: true }),
      supabase.from("batches").select("id, name, batch_code, course_id"),
      supabase.from("curriculum_modules").select("id, subject_name, course_code, batch_id, semester").order("semester"),
      supabase.from("user_roles").select("user_id").eq("role", "instructor"),
    ]);
    const instructorIds = (instrRoles || []).map((r) => r.user_id);
    if (instructorIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", instructorIds);
      setInstructors(profs || []);
    }
    setSchedules((sched as ScheduleEntry[]) || []);
    setBatches(batchData || []);
    setModules(moduleData || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [weekStart]);

  const filteredSchedules = schedules.filter((entry) => {
    if (filterMode === "batch" && filterValue !== "all") return entry.batch_id === filterValue;
    if (filterMode === "instructor" && filterValue !== "all") return entry.instructor_id === filterValue;
    return true;
  });

  const getEventForSlot = (day: Date, hour: number) => filteredSchedules.find((entry) => {
    const start = new Date(entry.start_time);
    return isSameDay(start, day) && start.getHours() === hour;
  });

  const openSlotEditor = (day: Date, hour: number, event?: ScheduleEntry) => {
    setEditing(event || null);
    const start = event ? new Date(event.start_time) : setMinutes(setHours(day, hour), 0);
    const end = event ? new Date(event.end_time) : setMinutes(setHours(day, hour + 1), 0);
    setForm({
      title: event?.event_title || "",
      type: event?.event_type || "class",
      batchId: event?.batch_id || "",
      moduleId: event?.curriculum_module_id || "",
      instructorId: event?.instructor_id || "",
      start: format(start, "yyyy-MM-dd'T'HH:mm"),
      end: format(end, "yyyy-MM-dd'T'HH:mm"),
      recurrence: event?.recurrence_type || "one_time",
      location: event?.location || "",
    });
    setDialogOpen(true);
  };

  const saveSchedule = async () => {
    if (!form.title || !form.start || !form.end) {
      toast({ title: "Title, start and end time are required", variant: "destructive" });
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    const payload: any = {
      event_title: form.title,
      event_type: form.type,
      start_time: new Date(form.start).toISOString(),
      end_time: new Date(form.end).toISOString(),
      batch_id: form.batchId || null,
      curriculum_module_id: form.moduleId || null,
      instructor_id: form.instructorId || null,
      location: form.location || null,
      recurrence_type: form.recurrence,
      user_id: auth.user?.id || form.instructorId,
    };
    const { error } = editing
      ? await supabase.from("schedules").update(payload).eq("id", editing.id)
      : await supabase.from("schedules").insert(payload);
    if (error) {
      toast({ title: "Failed to save timetable slot", description: error.message, variant: "destructive" });
      return;
    }
    logActivity(editing ? "schedule.updated" : "schedule.created", "schedule", editing?.id, { title: form.title });
    toast({ title: editing ? "Timetable slot updated" : "Timetable slot created" });
    setDialogOpen(false);
    fetchAll();
  };

  const deleteSchedule = async () => {
    if (!editing) return;
    const { error } = await supabase.from("schedules").delete().eq("id", editing.id);
    if (error) return toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    logActivity("schedule.deleted", "schedule", editing.id);
    toast({ title: "Timetable slot deleted" });
    setDialogOpen(false);
    fetchAll();
  };

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-brand-primary">Weekly Timetable</h1>
          <div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-brand-gold to-transparent" />
          <p className="mt-2 text-sm text-brand-warm-grey">Manage classes, labs, exams, events, holidays and breaks in a weekly grid.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="rounded-xl"><ChevronLeft className="h-4 w-4" /> Previous</Button>
          <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="rounded-xl">Current Week</Button>
          <Button variant="outline" onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="rounded-xl">Next <ChevronRight className="h-4 w-4" /></Button>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
        <Calendar className="h-4 w-4 text-brand-gold" />
        <span className="text-sm font-semibold text-brand-primary">{format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}</span>
        <Select value={filterMode} onValueChange={(value) => { setFilterMode(value); setFilterValue("all"); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="batch">By Batch</SelectItem><SelectItem value="instructor">By Tutor</SelectItem></SelectContent>
        </Select>
        {filterMode !== "all" && (
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Select filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filterMode === "batch" ? "Batches" : "Tutors"}</SelectItem>
              {filterMode === "batch" ? batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>) : instructors.map((i) => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || "Tutor"}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> : (
        <div className="overflow-x-auto rounded-2xl bg-card p-2 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
          <table className="min-w-[920px] w-full border-separate border-spacing-0">
            <thead><tr><th className="w-20 p-3 text-left text-[11px] uppercase tracking-widest text-brand-warm-grey">Time</th>{weekDays.map((day, index) => <th key={day.toISOString()} className="p-3 text-center"><div className="font-display text-sm text-brand-primary">{days[index]}</div><div className="text-xs text-brand-warm-grey">{format(day, "MMM d")}</div></th>)}</tr></thead>
            <tbody>{timeSlots.map((hour) => <tr key={hour} className="border-b border-border"><td className="p-2 align-top text-xs font-semibold text-brand-warm-grey">{format(setHours(new Date(), hour), "h a")}</td>{weekDays.map((day) => { const event = getEventForSlot(day, hour); return <td key={`${day.toISOString()}-${hour}`} onClick={() => openSlotEditor(day, hour, event)} className="h-16 min-w-28 cursor-pointer p-1 align-top transition-colors hover:bg-brand-cream"><div className="h-full rounded-xl p-1">{event ? <div className={`h-full rounded-lg px-2 py-1.5 text-[11px] font-semibold ${getEventStyle(event.event_type)}`}><p className="truncate">{event.event_title}</p><p className="truncate text-[10px] opacity-75">{instructors.find((i) => i.user_id === event.instructor_id)?.display_name || event.location || "Timetable"}</p></div> : <div className="flex h-full items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:opacity-100"><Plus className="h-4 w-4" /></div>}</div></td>; })}</tr>)}</tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">{editing ? "Edit Timetable Slot" : "Add Timetable Slot"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Title</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Type</label><Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{eventTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Recurring</label><Select value={form.recurrence} onValueChange={(recurrence) => setForm({ ...form, recurrence })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="one_time">One-time</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select></div></div>
            <div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Batch</label><Select value={form.batchId} onValueChange={(batchId) => setForm({ ...form, batchId })}><SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger><SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Subject</label><Select value={form.moduleId} onValueChange={(moduleId) => setForm({ ...form, moduleId })}><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger><SelectContent>{modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.course_code} · {m.subject_name}</SelectItem>)}</SelectContent></Select></div></div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Tutor</label><Select value={form.instructorId} onValueChange={(instructorId) => setForm({ ...form, instructorId })}><SelectTrigger><SelectValue placeholder="Assign tutor" /></SelectTrigger><SelectContent>{instructors.map((i) => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || "Tutor"}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Start</label><Input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div><div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">End</label><Input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div></div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Room / Location</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="flex justify-between gap-3 pt-2">{editing ? <Button variant="ghost" onClick={deleteSchedule} className="text-destructive"><Trash2 className="h-4 w-4" /> Delete</Button> : <span />}<Button onClick={saveSchedule} className="bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark">Save Slot</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSchedule;
