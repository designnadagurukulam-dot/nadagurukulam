import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { addDays, addWeeks, endOfWeek, format, isSameDay, setHours, setMinutes, startOfWeek, subWeeks } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle, LayoutGrid, ListOrdered, Clock } from "lucide-react";
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
const DEFAULT_HOURS = [8, 10, 12, 14, 16, 18];
const eventTypes = [
  "Class", "Live class", "CIE", "Exam", "Preparation Holidays", "Rehearsals", "Holiday", "Event",
];

const getEventStyle = (type: string) => {
  switch (type) {
    case "Exam":
    case "CIE": return "bg-destructive/10 text-destructive border-destructive/20";
    case "Live class": return "bg-accent/20 text-accent-foreground border-accent/30";
    case "Holiday":
    case "Preparation Holidays": return "bg-muted text-muted-foreground border-border";
    case "Rehearsals": return "bg-secondary text-secondary-foreground border-secondary";
    case "Event": return "bg-brand-gold-pale text-brand-primary border-brand-gold/40";
    default: return "bg-brand-primary/10 text-brand-primary border-brand-primary/30";
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
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEntry | null>(null);
  const [form, setForm] = useState({ title: "", type: "Class", batchId: "", moduleId: "", instructorId: "", start: "", end: "", recurrence: "one_time", location: "" });
  const [softOverlap, setSoftOverlap] = useState<{ entries: ScheduleEntry[]; payload: any } | null>(null);

  const weekDays = useMemo(() => days.map((_, index) => addDays(weekStart, index)), [weekStart]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: sched }, { data: batchData }, { data: moduleData }, { data: instrRoles }] = await Promise.all([
      supabase.from("schedules").select("*").gte("start_time", weekStart.toISOString()).lte("start_time", endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString()).order("start_time", { ascending: true }),
      supabase.from("batches").select("id, name, batch_code, course_id, instructor_id, semester").order("name"),
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

  // Auto-populate from selected module / batch
  useEffect(() => {
    if (form.moduleId) {
      const mod = modules.find(m => m.id === form.moduleId);
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
      const batch = batches.find(b => b.id === entry.batch_id);
      const sem = mod?.semester ?? batch?.semester;
      if (sem == null || String(sem) !== semesterFilter) return false;
    }
    return true;
  });

  // Time columns dynamically derived from the week's actual start hours (fallback when empty)
  const timeColumns = useMemo(() => {
    const hours = new Set<number>();
    filteredSchedules.forEach(e => { hours.add(new Date(e.start_time).getHours()); });
    if (hours.size === 0) DEFAULT_HOURS.forEach(h => hours.add(h));
    return [...hours].sort((a, b) => a - b);
  }, [filteredSchedules]);

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

  type Overlap = { type: "batch" | "instructor" | "subject"; entry: ScheduleEntry };
  const findOverlaps = (payload: any): Overlap[] => {
    const start = new Date(payload.start_time).getTime();
    const end = new Date(payload.end_time).getTime();
    const out: Overlap[] = [];
    schedules.forEach(s => {
      if (editing && s.id === editing.id) return;
      const ss = new Date(s.start_time).getTime();
      const se = new Date(s.end_time).getTime();
      if (!(start < se && end > ss)) return;
      if (payload.batch_id && payload.batch_id === s.batch_id) out.push({ type: "batch", entry: s });
      else if (payload.instructor_id && payload.instructor_id === s.instructor_id) out.push({ type: "instructor", entry: s });
      else if (payload.curriculum_module_id && payload.curriculum_module_id === s.curriculum_module_id) out.push({ type: "subject", entry: s });
    });
    return out;
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
    setSoftOverlap(null);
    fetchAll();
  };

  const saveSchedule = async () => {
    if (!form.start || !form.end) {
      toast({ title: "Start and end time are required", variant: "destructive" });
      return;
    }
    if (!form.batchId) {
      toast({ title: "Please select a batch", variant: "destructive" });
      return;
    }
    const payload = await buildPayload();
    const conflicts = findOverlaps(payload);
    const hard = conflicts.filter(c => c.type === "batch" || c.type === "instructor");
    if (hard.length > 0) {
      const batchConflict = hard.find(c => c.type === "batch");
      const instructorConflict = hard.find(c => c.type === "instructor");
      const msgs: string[] = [];
      if (batchConflict) msgs.push(`Batch already has "${batchConflict.entry.event_title}" at ${format(new Date(batchConflict.entry.start_time), "PPp")}`);
      if (instructorConflict) msgs.push(`Faculty already has "${instructorConflict.entry.event_title}" at ${format(new Date(instructorConflict.entry.start_time), "PPp")}`);
      toast({ title: "Scheduling conflict", description: msgs.join(" · "), variant: "destructive" });
      return;
    }
    const soft = conflicts.filter(c => c.type === "subject");
    if (soft.length > 0) {
      setSoftOverlap({ entries: soft.map(s => s.entry), payload });
      return;
    }
    persist(payload);
  };

  const overrideAndSave = async () => {
    if (!softOverlap) return;
    await Promise.all(softOverlap.entries.map(c => supabase.from("schedules").delete().eq("id", c.id)));
    persist(softOverlap.payload);
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

  const tutorName = (id: string | null) => instructors.find(i => i.user_id === id)?.display_name || "";
  const batchName = (id: string | null | undefined) => batches.find(b => b.id === id)?.name || "";
  const semesterOf = (e: ScheduleEntry) => {
    const mod = modules.find(m => m.id === e.curriculum_module_id);
    if (mod?.semester != null) return mod.semester;
    const b = batches.find(b => b.id === e.batch_id);
    return b?.semester ?? null;
  };

  // Subject dropdown strictly filtered to selected batch
  const subjectOptions = useMemo(() => {
    if (!form.batchId) return [];
    return modules.filter(m => m.batch_id === form.batchId);
  }, [modules, form.batchId]);

  const renderTile = (ev: ScheduleEntry, compact = false) => {
    const sem = semesterOf(ev);
    return (
      <div
        key={ev.id}
        onClick={(e) => { e.stopPropagation(); openSlotEditor(new Date(ev.start_time), new Date(ev.start_time).getHours(), ev); }}
        className={`rounded-lg border px-2 py-1.5 text-[11px] cursor-pointer hover:opacity-90 transition-opacity ${getEventStyle(ev.event_type)}`}
      >
        <p className="font-semibold truncate">{ev.event_title}</p>
        {!compact && (
          <>
            {sem != null && <p className="truncate text-[10px] opacity-80">Sem {sem}</p>}
            {ev.instructor_id && <p className="truncate text-[10px] opacity-80">{tutorName(ev.instructor_id)}</p>}
            {ev.batch_id && <p className="truncate text-[10px] opacity-80">{batchName(ev.batch_id)}</p>}
            <p className="truncate text-[10px] opacity-70">{format(new Date(ev.start_time), "h:mm a")} – {format(new Date(ev.end_time), "h:mm a")}</p>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-brand-primary">Weekly Timetable</h1>
          <div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-brand-gold to-transparent" />
          <p className="mt-2 text-sm text-brand-warm-grey">Plan classes, exams, rehearsals and events. Switch to Timeline view to see logistics across overlapping classes.</p>
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
            <SelectItem value="instructor">By Faculty</SelectItem>
          </SelectContent>
        </Select>
        {filterMode !== "all" && (
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Select filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filterMode === "batch" ? "Batches" : "Faculty"}</SelectItem>
              {filterMode === "batch"
                ? batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)
                : instructors.map((i) => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || "Faculty"}</SelectItem>)}
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
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-brand-parchment p-1 bg-white">
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className={`gap-1 rounded-lg ${viewMode === "grid" ? "bg-brand-primary text-primary-foreground" : ""}`}><LayoutGrid className="h-4 w-4" /> Grid</Button>
          <Button variant={viewMode === "timeline" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("timeline")} className={`gap-1 rounded-lg ${viewMode === "timeline" ? "bg-brand-primary text-primary-foreground" : ""}`}><ListOrdered className="h-4 w-4" /> Timeline</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : viewMode === "grid" ? (
        <div className="overflow-x-auto rounded-2xl bg-card p-2 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
          <table className="min-w-[920px] w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-28 p-3 text-left text-[11px] uppercase tracking-widest text-brand-warm-grey">Day</th>
                {timeColumns.map((hour) => (
                  <th key={hour} className="p-3 text-center text-xs font-semibold text-brand-primary">
                    {format(setHours(new Date(), hour), "h a")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekDays.map((day, dIdx) => (
                <tr key={day.toISOString()} className="border-b border-border">
                  <td className="p-2 align-top text-xs font-semibold text-brand-primary">
                    <div className="font-display text-sm">{days[dIdx]}</div>
                    <div className="text-[10px] text-brand-warm-grey">{format(day, "MMM d")}</div>
                  </td>
                  {timeColumns.map((hour) => {
                    const events = getEventsForSlot(day, hour);
                    return (
                      <td
                        key={`${day.toISOString()}-${hour}`}
                        onClick={() => events.length === 0 && openSlotEditor(day, hour)}
                        className="h-24 min-w-40 cursor-pointer p-1 align-top transition-colors hover:bg-brand-cream"
                      >
                        <div className="h-full rounded-xl p-1 space-y-1">
                          {events.length === 0 ? (
                            <div className="flex h-full items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:opacity-100">
                              <Plus className="h-4 w-4" />
                            </div>
                          ) : (
                            events.map(ev => renderTile(ev))
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
      ) : (
        // Timeline view: per-day list of active hours, overlapping classes stacked side-by-side
        <div className="space-y-4">
          {weekDays.map((day, dIdx) => {
            const dayEntries = filteredSchedules.filter(e => isSameDay(new Date(e.start_time), day));
            // group by hour
            const hourGroups: Record<number, ScheduleEntry[]> = {};
            dayEntries.forEach(e => {
              const h = new Date(e.start_time).getHours();
              hourGroups[h] = hourGroups[h] || [];
              hourGroups[h].push(e);
            });
            const activeHours = Object.keys(hourGroups).map(Number).sort((a, b) => a - b);
            return (
              <div key={day.toISOString()} className="rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="font-display text-brand-primary">{days[dIdx]} · {format(day, "MMM d")}</h3>
                  <span className="text-xs text-brand-warm-grey">{dayEntries.length} class{dayEntries.length === 1 ? "" : "es"}</span>
                </div>
                {dayEntries.length === 0 ? (
                  <p className="text-xs text-brand-warm-grey italic">No classes scheduled.</p>
                ) : (
                  <div className="space-y-2">
                    {activeHours.map(h => (
                      <div key={h} className="flex gap-3 items-start">
                        <div className="w-20 shrink-0 text-xs font-semibold text-brand-primary flex items-center gap-1 pt-2">
                          <Clock className="h-3.5 w-3.5" /> {format(setHours(new Date(), h), "h a")}
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                          {hourGroups[h].map(ev => renderTile(ev))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
                <Select value={form.batchId} onValueChange={(batchId) => setForm({ ...form, batchId, moduleId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Subject / Course</label>
                <Select value={form.moduleId} onValueChange={(moduleId) => setForm({ ...form, moduleId })} disabled={!form.batchId}>
                  <SelectTrigger><SelectValue placeholder={form.batchId ? "Select subject" : "Pick a batch first"} /></SelectTrigger>
                  <SelectContent>
                    {subjectOptions.length === 0 ? (
                      <div className="px-2 py-3 text-xs text-brand-warm-grey">No subjects mapped to this batch yet</div>
                    ) : subjectOptions.map((m) => <SelectItem key={m.id} value={m.id}>{m.course_code} · {m.subject_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(form.moduleId || form.batchId) && (
              <div className="rounded-xl bg-brand-cream/60 border border-brand-parchment p-3 text-xs text-brand-charcoal/80 grid grid-cols-2 gap-2">
                <div><span className="font-semibold">Semester:</span> {modules.find(m => m.id === form.moduleId)?.semester ?? batches.find(b => b.id === form.batchId)?.semester ?? "—"}</div>
                <div><span className="font-semibold">Faculty:</span> {tutorName(form.instructorId) || "—"}</div>
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

      <Dialog open={!!softOverlap} onOpenChange={(o) => !o && setSoftOverlap(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-brand-primary flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-brand-gold" /> Subject Already Scheduled</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-brand-charcoal">The same subject is already scheduled at this time. The batch and instructor are free, so you may override or cancel.</p>
            <ul className="text-sm space-y-1">
              {softOverlap?.entries.map(e => (
                <li key={e.id} className="bg-brand-gold-pale/40 border border-brand-gold/30 rounded-lg px-3 py-2">
                  <span className="font-semibold">{e.event_title}</span> — {format(new Date(e.start_time), "PPp")}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setSoftOverlap(null)}>Cancel</Button>
            <Button onClick={overrideAndSave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Override Existing</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSchedule;
