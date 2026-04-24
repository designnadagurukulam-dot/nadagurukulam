import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { addDays, addWeeks, endOfWeek, format, isSameDay, setHours, setMinutes, startOfWeek, subWeeks } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
const eventTypes = [
  "Class", "Live class", "CIE", "Exam", "Preparation Holidays", "Rehearsals", "Holiday", "Event",
];

const getEventStyle = (type: string) => {
  switch (type) {
    case "Exam":
    case "CIE": return "bg-destructive/10 text-destructive";
    case "Live class": return "bg-accent/20 text-accent-foreground";
    case "Holiday":
    case "Preparation Holidays": return "bg-muted text-muted-foreground";
    case "Rehearsals": return "bg-secondary text-secondary-foreground";
    case "Event": return "bg-brand-gold-pale text-brand-primary";
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
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEntry | null>(null);
  const [form, setForm] = useState({ title: "", type: "Class", batchId: "", moduleId: "", instructorId: "", start: "", end: "", recurrence: "one_time", location: "" });
  const [overlap, setOverlap] = useState<{ entries: ScheduleEntry[]; payload: any } | null>(null);

  const weekDays = useMemo(() => days.map((_, index) => addDays(weekStart, index)), [weekStart]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: sched }, { data: batchData }, { data: moduleData }, { data: instrRoles }] = await Promise.all([
      supabase.from("schedules").select("*").gte("start_time", weekStart.toISOString()).lte("start_time", endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString()).order("start_time", { ascending: true }),
      supabase.from("batches").select("id, name, batch_code, course_id, instructor_id").order("name"),
      supabase.from("curriculum_modules").select("id, subject_name, course_code, batch_id, semester").order("subject_name"),
      supabase.from("user_roles").select("user_id").eq("role", "instructor"),
    ]);
    const instructorIds = (instrRoles || []).map((r) => r.user_id);
    if (instructorIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", instructorIds);
      setInstructors((profs || []).sort((a: any, b: any) => (a.display_name || "").localeCompare(b.display_name || "")));
    }
    setSchedules((sched as ScheduleEntry[]) || []);
    setBatches(batchData || []);
    setModules(moduleData || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [weekStart]);

  // Auto-populate semester/tutor from selected module + batch
  useEffect(() => {
    if (form.moduleId) {
      const mod = modules.find(m => m.id === form.moduleId);
      // auto-set batch from module if not chosen
      if (mod?.batch_id && !form.batchId) setForm(prev => ({ ...prev, batchId: mod.batch_id }));
    }
    if (form.batchId) {
      const batch = batches.find(b => b.id === form.batchId);
      if (batch?.instructor_id && !form.instructorId) setForm(prev => ({ ...prev, instructorId: batch.instructor_id }));
    }
  }, [form.moduleId, form.batchId, modules, batches]);

  const filteredSchedules = schedules.filter((entry) => {
    if (filterMode === "batch" && filterValue !== "all" && entry.batch_id !== filterValue) return false;
    if (filterMode === "instructor" && filterValue !== "all" && entry.instructor_id !== filterValue) return false;
    if (semesterFilter !== "all") {
      const mod = modules.find(m => m.id === entry.curriculum_module_id);
      if (!mod || String(mod.semester) !== semesterFilter) return false;
    }
    return true;
  });

  const getEventsForSlot = (day: Date, hour: number) => filteredSchedules.filter((entry) => {
    const start = new Date(entry.start_time);
    return isSameDay(start, day) && start.getHours() === hour;
  });

  const openSlotEditor = (day?: Date, hour?: number, event?: ScheduleEntry) => {
    setEditing(event || null);
    const baseDay = day || new Date();
    const baseHour = hour ?? 9;
    const start = event ? new Date(event.start_time) : setMinutes(setHours(baseDay, baseHour), 0);
    const end = event ? new Date(event.end_time) : setMinutes(setHours(baseDay, baseHour + 1), 0);
    const mod = event?.curriculum_module_id ? modules.find(m => m.id === event.curriculum_module_id) : null;
    setForm({
      title: event?.event_title || (mod ? `${mod.course_code} · ${mod.subject_name}` : ""),
      type: event?.event_type || "Class",
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

  const findOverlaps = (payload: any) => {
    const start = new Date(payload.start_time).getTime();
    const end = new Date(payload.end_time).getTime();
    return schedules.filter(s => {
      if (editing && s.id === editing.id) return false;
      const ss = new Date(s.start_time).getTime();
      const se = new Date(s.end_time).getTime();
      const timeOverlap = start < se && end > ss;
      if (!timeOverlap) return false;
      // collision dimensions: same batch, same instructor, or same subject
      return (
        (payload.batch_id && payload.batch_id === s.batch_id) ||
        (payload.instructor_id && payload.instructor_id === s.instructor_id) ||
        (payload.curriculum_module_id && payload.curriculum_module_id === s.curriculum_module_id)
      );
    });
  };

  const buildPayload = async () => {
    const { data: auth } = await supabase.auth.getUser();
    let title = form.title;
    if (!title && form.moduleId) {
      const m = modules.find(x => x.id === form.moduleId);
      if (m) title = `${m.course_code} · ${m.subject_name}`;
    }
    return {
      event_title: title,
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
  };

  const persist = async (payload: any) => {
    const { error } = editing
      ? await supabase.from("schedules").update(payload).eq("id", editing.id)
      : await supabase.from("schedules").insert(payload);
    if (error) {
      toast({ title: "Failed to save timetable slot", description: error.message, variant: "destructive" });
      return;
    }
    logActivity(editing ? "schedule.updated" : "schedule.created", "schedule", editing?.id, { title: payload.event_title });
    toast({ title: editing ? "Timetable slot updated" : "Timetable slot created" });
    setDialogOpen(false);
    setEditing(null);
    setOverlap(null);
    fetchAll();
  };

  const saveSchedule = async () => {
    if (!form.start || !form.end) {
      toast({ title: "Start and end time are required", variant: "destructive" });
      return;
    }
    if (!form.batchId && !form.moduleId) {
      toast({ title: "Please select a batch or subject", variant: "destructive" });
      return;
    }
    const payload = await buildPayload();
    const conflicts = findOverlaps(payload);
    if (conflicts.length > 0) {
      setOverlap({ entries: conflicts, payload });
      return;
    }
    persist(payload);
  };

  const overrideAndSave = async () => {
    if (!overlap) return;
    // delete conflicting entries then save
    await Promise.all(overlap.entries.map(c => supabase.from("schedules").delete().eq("id", c.id)));
    persist(overlap.payload);
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

  const semesters = useMemo(() => [...new Set(modules.map(m => m.semester).filter((s): s is number => s != null))].sort((a, b) => a - b), [modules]);

  // Mapped tutor name
  const tutorName = (id: string | null) => instructors.find(i => i.user_id === id)?.display_name || "";

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-brand-primary">Weekly Timetable</h1>
          <div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-brand-gold to-transparent" />
          <p className="mt-2 text-sm text-brand-warm-grey">Plan classes, exams, rehearsals and events. Multiple parallel entries are stacked in one slot.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="rounded-xl"><ChevronLeft className="h-4 w-4" /> Previous</Button>
          <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="rounded-xl">Current Week</Button>
          <Button variant="outline" onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="rounded-xl">Next <ChevronRight className="h-4 w-4" /></Button>
          <Button onClick={() => openSlotEditor()} className="gap-2 bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark"><Plus className="h-4 w-4" /> Add Schedule</Button>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
        <Calendar className="h-4 w-4 text-brand-gold" />
        <span className="text-sm font-semibold text-brand-primary">{format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}</span>
        <Select value={filterMode} onValueChange={(value) => { setFilterMode(value); setFilterValue("all"); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="batch">By Batch</SelectItem>
            <SelectItem value="instructor">By Tutor</SelectItem>
          </SelectContent>
        </Select>
        {filterMode !== "all" && (
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Select filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filterMode === "batch" ? "Batches" : "Tutors"}</SelectItem>
              {filterMode === "batch"
                ? batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)
                : instructors.map((i) => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || "Tutor"}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={semesterFilter} onValueChange={setSemesterFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Semester" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card p-2 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
          <table className="min-w-[920px] w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-20 p-3 text-left text-[11px] uppercase tracking-widest text-brand-warm-grey">Time</th>
                {weekDays.map((day, index) => (
                  <th key={day.toISOString()} className="p-3 text-center">
                    <div className="font-display text-sm text-brand-primary">{days[index]}</div>
                    <div className="text-xs text-brand-warm-grey">{format(day, "MMM d")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((hour) => (
                <tr key={hour} className="border-b border-border">
                  <td className="p-2 align-top text-xs font-semibold text-brand-warm-grey">{format(setHours(new Date(), hour), "h a")}</td>
                  {weekDays.map((day) => {
                    const events = getEventsForSlot(day, hour);
                    return (
                      <td
                        key={`${day.toISOString()}-${hour}`}
                        onClick={() => events.length === 0 && openSlotEditor(day, hour)}
                        className="h-16 min-w-28 cursor-pointer p-1 align-top transition-colors hover:bg-brand-cream"
                      >
                        <div className="h-full rounded-xl p-1 space-y-1">
                          {events.length === 0 ? (
                            <div className="flex h-full items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:opacity-100">
                              <Plus className="h-4 w-4" />
                            </div>
                          ) : (
                            events.map(ev => (
                              <div
                                key={ev.id}
                                onClick={(e) => { e.stopPropagation(); openSlotEditor(day, hour, ev); }}
                                className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold ${getEventStyle(ev.event_type)}`}
                              >
                                <p className="truncate">{ev.event_title}</p>
                                <p className="truncate text-[10px] opacity-75">{tutorName(ev.instructor_id) || ev.location || ev.event_type}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">{editing ? "Edit Timetable Slot" : "Add Timetable Slot"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Type</label>
                <Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{eventTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Recurring</label>
                <Select value={form.recurrence} onValueChange={(recurrence) => setForm({ ...form, recurrence })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Batch *</label>
                <Select value={form.batchId} onValueChange={(batchId) => setForm({ ...form, batchId })}>
                  <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Subject *</label>
                <Select value={form.moduleId} onValueChange={(moduleId) => setForm({ ...form, moduleId })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {modules
                      .filter(m => !form.batchId || !m.batch_id || m.batch_id === form.batchId)
                      .map((m) => <SelectItem key={m.id} value={m.id}>{m.course_code} · {m.subject_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Auto-populated readonly info */}
            {(form.moduleId || form.batchId) && (
              <div className="rounded-xl bg-brand-cream/60 border border-brand-parchment p-3 text-xs text-brand-charcoal/80 grid grid-cols-2 gap-2">
                <div><span className="font-semibold">Semester:</span> {modules.find(m => m.id === form.moduleId)?.semester ?? "—"}</div>
                <div><span className="font-semibold">Tutor:</span> {tutorName(form.instructorId) || "—"}</div>
                <div><span className="font-semibold">Course Code:</span> {modules.find(m => m.id === form.moduleId)?.course_code || "—"}</div>
                <div><span className="font-semibold">Batch:</span> {batches.find(b => b.id === form.batchId)?.name || "—"}</div>
              </div>
            )}
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Title (optional override)</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Defaults to subject name" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Start *</label>
                <Input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">End *</label>
                <Input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Room / Location</label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="flex justify-between gap-3 pt-2">
              {editing ? <Button variant="ghost" onClick={deleteSchedule} className="text-destructive gap-1"><Trash2 className="h-4 w-4" /> Delete</Button> : <span />}
              <Button onClick={saveSchedule} className="bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark">Save Slot</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!overlap} onOpenChange={(o) => !o && setOverlap(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Overlap Detected</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-brand-charcoal">The slot collides with the following existing entries:</p>
            <ul className="text-sm space-y-1">
              {overlap?.entries.map(e => (
                <li key={e.id} className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  <span className="font-semibold">{e.event_title}</span> — {format(new Date(e.start_time), "PPp")}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setOverlap(null)}>Cancel</Button>
            <Button onClick={overrideAndSave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Override Existing</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSchedule;
