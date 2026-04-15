import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Calendar, Clock, Video, Wifi, WifiOff, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";

interface ScheduleEntry { id: string; event_title: string; start_time: string; end_time: string; event_type: string; course_id: string | null; user_id: string; instructor_id: string | null; }

const AdminSchedule = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [liveProfiles, setLiveProfiles] = useState<Record<string, string>>({});
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [instructors, setInstructors] = useState<{ user_id: string; display_name: string }[]>([]);
  const [students, setStudents] = useState<{ user_id: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventType, setEventType] = useState("class");
  const [courseId, setCourseId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [studentId, setStudentId] = useState("");

  const fetchAll = async () => {
    const [{ data: sched }, { data: crs }, { data: instrRoles }, { data: studRoles }, { data: lc }] = await Promise.all([
      supabase.from("schedules").select("*").order("start_time", { ascending: true }),
      supabase.from("courses").select("id, title"),
      supabase.from("user_roles").select("user_id").eq("role", "instructor"),
      supabase.from("user_roles").select("user_id").eq("role", "student"),
      supabase.from("live_classes").select("*").order("scheduled_at", { ascending: false }),
    ]);
    setSchedules((sched as ScheduleEntry[]) || []);
    setCourses(crs || []);
    setLiveClasses(lc || []);

    const instrIds = (instrRoles || []).map(r => r.user_id);
    const lcInstrIds = [...new Set((lc || []).map((c: any) => c.instructor_id))];
    const allInstrIds = [...new Set([...instrIds, ...lcInstrIds])];

    if (allInstrIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", allInstrIds);
      setInstructors((profs || []).filter(p => instrIds.includes(p.user_id)));
      const pm: Record<string, string> = {};
      (profs || []).forEach(p => { pm[p.user_id] = p.display_name || "Tutor"; });
      setLiveProfiles(pm);
    }
    if (studRoles && studRoles.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", studRoles.map(r => r.user_id));
      setStudents(profs || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async () => {
    if (!title || !startTime || !endTime) { toast({ title: "Please fill required fields", variant: "destructive" }); return; }
    let targetStudentIds: string[] = [];
    if (studentId === "__all__" && courseId) {
      const { data: enrollments } = await supabase.from("enrollments").select("user_id").eq("course_id", courseId);
      targetStudentIds = (enrollments || []).map(e => e.user_id);
      if (targetStudentIds.length === 0) { toast({ title: "No students enrolled in this course", variant: "destructive" }); return; }
    } else if (studentId && studentId !== "__all__") { targetStudentIds = [studentId]; }
    else { toast({ title: "Please select a student or 'All Enrolled Students'", variant: "destructive" }); return; }
    const entries = targetStudentIds.map(sid => ({ event_title: title, start_time: startTime, end_time: endTime, event_type: eventType, course_id: courseId || null, user_id: sid, instructor_id: instructorId || null }));
    const { error } = await supabase.from("schedules").insert(entries);
    if (error) { toast({ title: "Failed to create schedule", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Schedule entry created" }); logActivity("schedule.created", "schedule", undefined, { title, event_type: eventType }); setDialogOpen(false); resetForm(); fetchAll(); }
  };

  const handleDelete = async (id: string) => { await supabase.from("schedules").delete().eq("id", id); logActivity("schedule.deleted", "schedule", id); toast({ title: "Schedule entry deleted" }); fetchAll(); };
  const resetForm = () => { setTitle(""); setStartTime(""); setEndTime(""); setEventType("class"); setCourseId(""); setInstructorId(""); setStudentId(""); };

  const now = new Date();
  const isLive = (c: any) => {
    const start = new Date(c.scheduled_at);
    const end = new Date(start.getTime() + (c.duration_minutes || 60) * 60000);
    return now >= start && now <= end;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-primary">Timetable Management</h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          <p className="text-sm text-brand-warm-grey mt-2">Create and manage class schedules</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl"><Plus className="h-4 w-4" /> Add Schedule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl border-brand-parchment">
            <DialogHeader><DialogTitle className="font-serif text-xl text-brand-primary">Create Schedule Entry</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Title *</label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Carnatic Vocal - Lesson 12" className="border-brand-parchment rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Start Time *</label><Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="border-brand-parchment rounded-xl" /></div>
                <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">End Time *</label><Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="border-brand-parchment rounded-xl" /></div>
              </div>
              <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Type</label>
                <Select value={eventType} onValueChange={setEventType}><SelectTrigger className="border-brand-parchment rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="class">Class</SelectItem><SelectItem value="practice">Practice Session</SelectItem><SelectItem value="workshop">Workshop</SelectItem><SelectItem value="exam">Exam</SelectItem></SelectContent></Select></div>
              <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Course</label>
                <Select value={courseId} onValueChange={setCourseId}><SelectTrigger className="border-brand-parchment rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger><SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Instructor</label>
                <Select value={instructorId} onValueChange={setInstructorId}><SelectTrigger className="border-brand-parchment rounded-xl"><SelectValue placeholder="Assign instructor" /></SelectTrigger><SelectContent>{instructors.map(i => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || "Unnamed"}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Student(s) *</label>
                <Select value={studentId} onValueChange={setStudentId}><SelectTrigger className="border-brand-parchment rounded-xl"><SelectValue placeholder="Assign to student(s)" /></SelectTrigger><SelectContent>{courseId && <SelectItem value="__all__">📋 All Enrolled Students</SelectItem>}{students.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.display_name || "Unnamed"}</SelectItem>)}</SelectContent></Select>
                {studentId === "__all__" && !courseId && <p className="text-xs text-red-500 mt-1">Please select a course first</p>}</div>
              <Button onClick={handleCreate} className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl">Create Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="bg-brand-cream border border-brand-parchment rounded-xl p-3 text-xs text-brand-warm-grey">
        <strong className="text-brand-primary">Institutional Timings:</strong> Morning 8:15 AM – 12:15 PM | Lunch Break 12:15 – 1:30 PM | Afternoon 1:30 – 4:00 PM
      </div>

      <Tabs defaultValue="schedules">
        <TabsList className="bg-brand-cream border border-brand-parchment rounded-xl p-1">
          <TabsTrigger value="schedules" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">
            Admin Schedules ({schedules.length})
          </TabsTrigger>
          <TabsTrigger value="live" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">
            Tutor Live Classes ({liveClasses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="mt-4">
          {schedules.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4"><Calendar className="h-7 w-7 text-brand-gold" /></div>
              <h3 className="font-serif text-xl text-brand-primary">No Schedules Yet</h3>
              <p className="text-sm text-brand-warm-grey mt-1">Create your first timetable entry</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedules.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-4 flex items-center justify-between hover:bg-brand-cream transition-colors">
                  <div>
                    <h3 className="font-medium text-brand-charcoal">{s.event_title}</h3>
                    <div className="flex items-center gap-3 text-xs text-brand-warm-grey mt-1">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-brand-gold" />{new Date(s.start_time).toLocaleString()} – {new Date(s.end_time).toLocaleTimeString()}</span>
                      <Badge className="bg-brand-gold-pale text-brand-gold-dark border border-brand-parchment text-[10px] capitalize">{s.event_type}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="live" className="mt-4">
          {liveClasses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4"><Video className="h-7 w-7 text-brand-gold" /></div>
              <h3 className="font-serif text-xl text-brand-primary">No Tutor Live Classes</h3>
              <p className="text-sm text-brand-warm-grey mt-1">Tutors haven't scheduled any live classes yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {liveClasses.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-4 hover:bg-brand-cream transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-brand-charcoal">{c.title}</h3>
                        {isLive(c) && (
                          <Badge className="bg-red-500 text-white animate-pulse gap-1 text-[10px]">
                            <Radio className="h-3 w-3" /> LIVE
                          </Badge>
                        )}
                        <Badge className={c.class_type === "offline" ? "bg-brand-cream text-brand-charcoal-mid border border-brand-parchment gap-1 text-[10px]" : "bg-blue-50 text-blue-700 border border-blue-200 gap-1 text-[10px]"}>
                          {c.class_type === "offline" ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                          {c.class_type === "offline" ? "Offline" : "Online"}
                        </Badge>
                        <Badge className={c.audience_type === "all" ? "bg-brand-gold-pale text-brand-gold-dark border border-brand-gold/30 text-[10px]" : "bg-brand-cream text-brand-warm-grey border border-brand-parchment text-[10px]"}>
                          {c.audience_type === "all" ? "All Batches" : "Specific"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-brand-warm-grey">
                        <span>{liveProfiles[c.instructor_id] || "Tutor"}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-brand-gold" />{new Date(c.scheduled_at).toLocaleString()} ({c.duration_minutes || 60}m)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSchedule;
