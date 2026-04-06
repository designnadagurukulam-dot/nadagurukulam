import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";

interface ScheduleEntry {
  id: string;
  event_title: string;
  start_time: string;
  end_time: string;
  event_type: string;
  course_id: string | null;
  user_id: string;
  instructor_id: string | null;
}

const AdminSchedule = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [instructors, setInstructors] = useState<{ user_id: string; display_name: string }[]>([]);
  const [students, setStudents] = useState<{ user_id: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
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

    // Fetch instructor profiles
    if (instrRoles && instrRoles.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", instrRoles.map((r) => r.user_id));
      setInstructors(profs || []);
    }

    // Fetch student profiles
    if (studRoles && studRoles.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", studRoles.map((r) => r.user_id));
      setStudents(profs || []);
    }

    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async () => {
    if (!title || !startTime || !endTime || !studentId) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("schedules").insert({
      event_title: title,
      start_time: startTime,
      end_time: endTime,
      event_type: eventType,
      course_id: courseId || null,
      user_id: studentId,
      instructor_id: instructorId || null,
    });

    if (error) {
      toast({ title: "Failed to create schedule", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Schedule entry created" });
      logActivity("schedule.created", "schedule", undefined, { title, event_type: eventType });
      setDialogOpen(false);
      resetForm();
      fetchAll();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("schedules").delete().eq("id", id);
    logActivity("schedule.deleted", "schedule", id);
    toast({ title: "Schedule entry deleted" });
    fetchAll();
  };

  const resetForm = () => {
    setTitle(""); setStartTime(""); setEndTime(""); setEventType("class");
    setCourseId(""); setInstructorId(""); setStudentId("");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Timetable Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create and manage class schedules</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Schedule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Schedule Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Carnatic Vocal - Lesson 12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Start Time *</label>
                  <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">End Time *</label>
                  <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Type</label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="practice">Practice Session</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Course</label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Instructor</label>
                <Select value={instructorId} onValueChange={setInstructorId}>
                  <SelectTrigger><SelectValue placeholder="Assign instructor" /></SelectTrigger>
                  <SelectContent>
                    {instructors.map((i) => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || "Unnamed"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Student *</label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger><SelectValue placeholder="Assign to student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => <SelectItem key={s.user_id} value={s.user_id}>{s.display_name || "Unnamed"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        <strong>Institutional Timings:</strong> Morning 8:15 AM – 12:15 PM | Lunch Break 12:15 – 1:30 PM | Afternoon 1:30 – 4:00 PM
      </div>

      {schedules.length === 0 ? (
        <Card className="text-center p-12 border-0 shadow-md">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-serif text-xl text-foreground">No schedules yet</h3>
          <p className="text-muted-foreground mt-2">Create your first timetable entry</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <Card key={s.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{s.event_title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(s.start_time).toLocaleString()} – {new Date(s.end_time).toLocaleTimeString()}
                    </span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] capitalize">{s.event_type}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSchedule;
