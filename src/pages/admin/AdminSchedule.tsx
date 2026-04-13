import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";

interface ScheduleEntry { id: string; event_title: string; start_time: string; end_time: string; event_type: string; course_id: string | null; user_id: string; instructor_id: string | null; }

const AdminSchedule = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
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
    const [{ data: sched }, { data: crs }, { data: instrRoles }, { data: studRoles }] = await Promise.all([
      supabase.from("schedules").select("*").order("start_time", { ascending: true }),
      supabase.from("courses").select("id, title"),
      supabase.from("user_roles").select("user_id").eq("role", "instructor"),
      supabase.from("user_roles").select("user_id").eq("role", "student"),
    ]);
    setSchedules((sched as ScheduleEntry[]) || []);
    setCourses(crs || []);
    if (instrRoles && instrRoles.length > 0) { const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", instrRoles.map((r) => r.user_id)); setInstructors(profs || []); }
    if (studRoles && studRoles.length > 0) { const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", studRoles.map((r) => r.user_id)); setStudents(profs || []); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async () => {
    if (!title || !startTime || !endTime) { toast({ title: "Please fill required fields", variant: "destructive" }); return; }
    let targetStudentIds: string[] = [];
    if (studentId === "__all__" && courseId) {
      const { data: enrollments } = await supabase.from("enrollments").select("user_id").eq("course_id", courseId);
      targetStudentIds = (enrollments || []).map((e) => e.user_id);
      if (targetStudentIds.length === 0) { toast({ title: "No students enrolled in this course", variant: "destructive" }); return; }
    } else if (studentId && studentId !== "__all__") { targetStudentIds = [studentId]; }
    else { toast({ title: "Please select a student or 'All Enrolled Students'", variant: "destructive" }); return; }
    const entries = targetStudentIds.map((sid) => ({ event_title: title, start_time: startTime, end_time: endTime, event_type: eventType, course_id: courseId || null, user_id: sid, instructor_id: instructorId || null }));
    const { error } = await supabase.from("schedules").insert(entries);
    if (error) { toast({ title: "Failed to create schedule", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Schedule entry created" }); logActivity("schedule.created", "schedule", undefined, { title, event_type: eventType }); setDialogOpen(false); resetForm(); fetchAll(); }
  };

  const handleDelete = async (id: string) => { await supabase.from("schedules").delete().eq("id", id); logActivity("schedule.deleted", "schedule", id); toast({ title: "Schedule entry deleted" }); fetchAll(); };
  const resetForm = () => { setTitle(""); setStartTime(""); setEndTime(""); setEventType("class"); setCourseId(""); setInstructorId(""); setStudentId(""); };

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-[#7D1E24] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">Timetable Management</h1>
          <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
          <p className="text-sm text-[#8C7B6B] mt-2">Create and manage class schedules</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl"><Plus className="h-4 w-4" /> Add Schedule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl border-[#EDE3CC]">
            <DialogHeader><DialogTitle className="font-serif text-xl text-[#7D1E24]">Create Schedule Entry</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Title *</label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Carnatic Vocal - Lesson 12" className="border-[#EDE3CC] rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Start Time *</label><Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="border-[#EDE3CC] rounded-xl" /></div>
                <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">End Time *</label><Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="border-[#EDE3CC] rounded-xl" /></div>
              </div>
              <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Type</label>
                <Select value={eventType} onValueChange={setEventType}><SelectTrigger className="border-[#EDE3CC] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="class">Class</SelectItem><SelectItem value="practice">Practice Session</SelectItem><SelectItem value="workshop">Workshop</SelectItem><SelectItem value="exam">Exam</SelectItem></SelectContent></Select></div>
              <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Course</label>
                <Select value={courseId} onValueChange={setCourseId}><SelectTrigger className="border-[#EDE3CC] rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger><SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Instructor</label>
                <Select value={instructorId} onValueChange={setInstructorId}><SelectTrigger className="border-[#EDE3CC] rounded-xl"><SelectValue placeholder="Assign instructor" /></SelectTrigger><SelectContent>{instructors.map((i) => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || "Unnamed"}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Student(s) *</label>
                <Select value={studentId} onValueChange={setStudentId}><SelectTrigger className="border-[#EDE3CC] rounded-xl"><SelectValue placeholder="Assign to student(s)" /></SelectTrigger><SelectContent>{courseId && <SelectItem value="__all__">📋 All Enrolled Students</SelectItem>}{students.map((s) => <SelectItem key={s.user_id} value={s.user_id}>{s.display_name || "Unnamed"}</SelectItem>)}</SelectContent></Select>
                {studentId === "__all__" && !courseId && <p className="text-xs text-red-500 mt-1">Please select a course first</p>}</div>
              <Button onClick={handleCreate} className="w-full bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl">Create Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="bg-[#FAF6EE] border border-[#EDE3CC] rounded-xl p-3 text-xs text-[#8C7B6B]">
        <strong className="text-[#7D1E24]">Institutional Timings:</strong> Morning 8:15 AM – 12:15 PM | Lunch Break 12:15 – 1:30 PM | Afternoon 1:30 – 4:00 PM
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5E9CE] flex items-center justify-center mx-auto mb-4"><Calendar className="h-7 w-7 text-[#C49A3C]" /></div>
          <h3 className="font-serif text-xl text-[#7D1E24]">No Schedules Yet</h3>
          <p className="text-sm text-[#8C7B6B] mt-1">Create your first timetable entry</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-4 flex items-center justify-between hover:bg-[#FAF6EE] transition-colors">
              <div>
                <h3 className="font-medium text-[#3D2E22]">{s.event_title}</h3>
                <div className="flex items-center gap-3 text-xs text-[#8C7B6B] mt-1">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-[#C49A3C]" />{new Date(s.start_time).toLocaleString()} – {new Date(s.end_time).toLocaleTimeString()}</span>
                  <span className="bg-[#F5E9CE] text-[#8B6914] px-2 py-0.5 rounded-lg text-[11px] capitalize font-semibold">{s.event_type}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSchedule;
