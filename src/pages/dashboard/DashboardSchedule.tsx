import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Video, MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "student" | "instructor";

interface ScheduleItem {
  id: string;
  event_title: string;
  start_time: string;
  end_time: string;
  event_type: string;
}

const typeColors: Record<string, string> = {
  class: "bg-primary/15 text-primary",
  practice: "bg-secondary/15 text-secondary-foreground",
  workshop: "bg-accent/20 text-accent-foreground",
  exam: "bg-destructive/15 text-destructive",
};

const DashboardSchedule = () => {
  const { user, role } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchSchedule = async () => {
      let query = supabase
        .from("schedules")
        .select("id, event_title, start_time, end_time, event_type")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if ((role as UserRole) === "instructor") {
        query = query.or(`user_id.eq.${user.id},instructor_id.eq.${user.id}`);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data } = await query;
      setSchedule((data as ScheduleItem[]) || []);
      setLoading(false);
    };
    fetchSchedule();
  }, [user, role]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl font-bold text-foreground">Schedule</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your upcoming classes and events</p>
      </motion.div>

      {schedule.length === 0 ? (
        <Card className="text-center p-12 border-0 shadow-md">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-serif text-xl text-foreground">No upcoming classes</h3>
          <p className="text-muted-foreground mt-2">Your schedule will appear here when classes are assigned</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedule.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-20 md:w-24 bg-gradient-to-b from-primary to-primary/80 flex flex-col items-center justify-center text-primary-foreground shrink-0 p-3">
                      <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">{formatDate(s.start_time)}</span>
                      <span className="text-2xl font-extrabold">{new Date(s.start_time).getDate()}</span>
                    </div>
                    <div className="flex-1 p-4 md:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-serif font-bold text-foreground text-sm md:text-base">{s.event_title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTime(s.start_time)} – {formatTime(s.end_time)}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`${typeColors[s.event_type] || ""} border-0 shrink-0 text-[11px] capitalize`}>
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
