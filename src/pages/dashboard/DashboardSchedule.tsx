import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { addDays, addWeeks, endOfWeek, format, isSameDay, startOfWeek, subWeeks } from "date-fns";

type UserRole = "admin" | "student" | "instructor" | "super_admin";



interface ScheduleItem {
  id: string;
  event_title: string;
  start_time: string;
  end_time: string;
  event_type: string;
  instructor_id: string | null;
  batch_id: string | null;
  curriculum_module_id: string | null;
  location: string | null;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const typeColor = (t: string) => {
  switch (t) {
    case "Exam":
    case "CIE": return "bg-destructive/10 text-destructive border-destructive/20";
    case "Live class": return "bg-accent/20 text-accent-foreground border-accent/30";
    case "Holiday":
    case "Preparation Holidays": return "bg-muted text-muted-foreground border-border";
    case "Rehearsals": return "bg-secondary text-secondary-foreground border-secondary";
    case "Event": return "bg-brand-gold-pale text-brand-primary border-brand-gold/40";
    default: return "bg-brand-primary/10 text-brand-primary border-brand-primary/20";
  }
};

const DashboardSchedule = () => {
  const { user, role } = useAuth();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [instructors, setInstructors] = useState<Record<string, string>>({});
  const [batches, setBatches] = useState<Record<string, { name: string; semester: number | null }>>({});
  const [modules, setModules] = useState<Record<string, { semester: number | null }>>({});
  const [loading, setLoading] = useState(true);

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
  const weekDays = useMemo(() => DAY_LABELS.map((_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let query = supabase
        .from("schedules")
        .select("id, event_title, start_time, end_time, event_type, instructor_id, batch_id, curriculum_module_id, location")
        .gte("start_time", weekStart.toISOString())
        .lte("start_time", weekEnd.toISOString())
        .order("start_time", { ascending: true });

      if ((role as UserRole) === "instructor") {
        query = query.eq("instructor_id", user.id);
      } else if ((role as UserRole) === "student") {
        const { data: enrolls } = await supabase
          .from("batch_enrollments")
          .select("batch_id")
          .eq("student_id", user.id);
        const batchIds = (enrolls || []).map((e) => e.batch_id).filter(Boolean);
        if (batchIds.length === 0) {
          if (!cancelled) { setSchedule([]); setLoading(false); }
          return;
        }
        query = query.in("batch_id", batchIds);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data } = await query;
      const items = (data as ScheduleItem[]) || [];
      if (cancelled) return;
      setSchedule(items);

      const instructorIds = [...new Set(items.map((s) => s.instructor_id).filter(Boolean) as string[])];
      const batchIds = [...new Set(items.map((s) => s.batch_id).filter(Boolean) as string[])];
      const moduleIds = [...new Set(items.map((s) => s.curriculum_module_id).filter(Boolean) as string[])];

      const [{ data: profs }, { data: bData }, { data: mData }] = await Promise.all([
        instructorIds.length
          ? supabase.from("profiles").select("user_id, display_name").in("user_id", instructorIds)
          : Promise.resolve({ data: [] as any[] }),
        batchIds.length
          ? supabase.from("batches").select("id, name, semester").in("id", batchIds)
          : Promise.resolve({ data: [] as any[] }),
        moduleIds.length
          ? supabase.from("curriculum_modules").select("id, semester").in("id", moduleIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      if (cancelled) return;
      const iMap: Record<string, string> = {};
      (profs || []).forEach((p: any) => { iMap[p.user_id] = p.display_name || "Faculty"; });
      setInstructors(iMap);

      const bMap: Record<string, { name: string; semester: number | null }> = {};
      (bData || []).forEach((b: any) => { bMap[b.id] = { name: b.name, semester: b.semester ?? null }; });
      setBatches(bMap);

      const mMap: Record<string, { semester: number | null }> = {};
      (mData || []).forEach((m: any) => { mMap[m.id] = { semester: m.semester ?? null }; });
      setModules(mMap);

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, role, weekStart, weekEnd]);

  const itemsForDay = (day: Date) => schedule.filter((s) => isSameDay(new Date(s.start_time), day));
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">My Schedule</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
            <p className="text-brand-warm-grey mt-1 text-xs sm:text-sm">
              {role === "instructor" ? "Classes you are scheduled to teach this week" : "Classes scheduled for your batch this week"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="rounded-xl">This Week</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </motion.div>

      <div className="rounded-2xl bg-card px-4 py-3 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] text-sm font-semibold text-brand-primary">
        {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : schedule.length === 0 ? (
        <div className="text-center p-8 sm:p-12 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-brand-gold" />
          </div>
          <h3 className="font-serif text-lg sm:text-xl text-brand-primary">No classes this week</h3>
          <p className="text-brand-warm-grey mt-2 text-xs sm:text-sm">Use the arrows above to navigate to another week.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
          {weekDays.map((day, i) => {
            const items = itemsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={`rounded-2xl border ${isToday ? "border-brand-gold bg-brand-gold-pale/20" : "border-brand-parchment bg-white"} p-3 shadow-[0_2px_16px_hsl(var(--primary)/0.04)]`}>
                <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-brand-parchment">
                  <span className="font-display text-sm font-bold text-brand-primary">{DAY_LABELS[i]}</span>
                  <span className="text-xs text-brand-warm-grey">{format(day, "MMM d")}</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-brand-warm-grey/70 italic text-center py-4">No classes</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((s) => {
                      const sem = s.batch_id ? batches[s.batch_id]?.semester : s.curriculum_module_id ? modules[s.curriculum_module_id]?.semester : null;
                      return (
                        <div key={s.id} className={`rounded-xl border p-2.5 ${typeColor(s.event_type)}`}>
                          <p className="font-serif font-semibold text-sm leading-tight">{s.event_title}</p>
                          <p className="flex items-center gap-1 text-[11px] mt-1 opacity-90"><Clock className="h-3 w-3" />{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</p>
                          {sem != null && <p className="flex items-center gap-1 text-[11px] mt-0.5 opacity-80"><Layers className="h-3 w-3" />Semester {sem}</p>}
                          {s.instructor_id && instructors[s.instructor_id] && (
                            <p className="flex items-center gap-1 text-[11px] mt-0.5 opacity-80"><User className="h-3 w-3" />{instructors[s.instructor_id]}</p>
                          )}
                          {s.batch_id && batches[s.batch_id] && (
                            <Badge className="mt-1 bg-white/60 border-0 text-[10px] text-current">{batches[s.batch_id].name}</Badge>
                          )}
                          {s.location && <p className="flex items-center gap-1 text-[11px] mt-0.5 opacity-80"><MapPin className="h-3 w-3" />{s.location}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardSchedule;
