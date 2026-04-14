import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "student" | "instructor";

interface ScheduleItem { id: string; event_title: string; start_time: string; end_time: string; event_type: string; }

const typeColors: Record<string, string> = {
  class: "bg-brand-gold-pale text-brand-primary",
  practice: "bg-green-50 text-green-700",
  workshop: "bg-blue-50 text-blue-700",
  exam: "bg-red-50 text-red-700",
};

const DashboardSchedule = () => {
  const { user, role } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchSchedule = async () => {
      let query = supabase.from("schedules").select("id, event_title, start_time, end_time, event_type")
        .gte("start_time", new Date().toISOString()).order("start_time", { ascending: true });
      if ((role as UserRole) === "instructor") { query = query.or(`user_id.eq.${user.id},instructor_id.eq.${user.id}`); }
      else { query = query.eq("user_id", user.id); }
      const { data } = await query;
      setSchedule((data as ScheduleItem[]) || []);
      setLoading(false);
    };
    fetchSchedule();
  }, [user, role]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso); const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  };
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">Schedule</h1>
        <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        <p className="text-brand-warm-grey mt-1.5 sm:mt-2 text-xs sm:text-sm">Your upcoming classes and events</p>
      </motion.div>

      {schedule.length === 0 ? (
        <Card className="text-center p-8 sm:p-12 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand-gold-pale flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-brand-gold" />
          </div>
          <h3 className="font-serif text-lg sm:text-xl text-brand-primary">No upcoming classes</h3>
          <p className="text-brand-warm-grey mt-2 text-xs sm:text-sm">Your schedule will appear here when classes are assigned</p>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {schedule.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-16 sm:w-24 bg-gradient-to-b from-brand-primary to-brand-primary-dark flex flex-col items-center justify-center text-white shrink-0 p-2.5 sm:p-3">
                      <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-medium opacity-70">{formatDate(s.start_time)}</span>
                      <span className="text-xl sm:text-2xl font-extrabold">{new Date(s.start_time).getDate()}</span>
                    </div>
                    <div className="flex-1 p-3 sm:p-5 min-w-0">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif font-bold text-brand-charcoal-mid text-sm sm:text-base truncate">{s.event_title}</h3>
                          <div className="flex items-center gap-2 sm:gap-4 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-brand-warm-grey">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{formatTime(s.start_time)} – {formatTime(s.end_time)}</span>
                          </div>
                        </div>
                        <Badge className={`${typeColors[s.event_type] || "bg-brand-cream-dark text-brand-warm-grey"} border-0 shrink-0 text-[9px] sm:text-[11px] capitalize`}>
                          {s.event_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardSchedule;
