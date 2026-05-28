import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { addWeeks, format, startOfWeek, subWeeks, endOfWeek, addDays } from "date-fns";
import LiveClassesBlock from "@/components/overview/LiveClassesBlock";
import WeeklyTeachingLogGrid from "@/components/schedule/WeeklyTeachingLogGrid";

type UserRole = "admin" | "student" | "instructor" | "super_admin";

const DashboardSchedule = () => {
  const { user, role } = useAuth();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [studentBatchIds, setStudentBatchIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user || (role as UserRole) !== "student") return;
    (async () => {
      const { data } = await supabase.from("batch_enrollments").select("batch_id").eq("student_id", user.id);
      setStudentBatchIds((data || []).map((r: any) => r.batch_id).filter(Boolean));
    })();
  }, [user, role]);

  if (!user) return null;

  const gridRole: "student" | "instructor" | "admin" | "super_admin" =
    (role as UserRole) === "instructor" ? "instructor" : "student";

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">Schedule</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
            <p className="text-brand-warm-grey mt-1 text-xs sm:text-sm">
              {role === "instructor"
                ? "Weekly teaching log — record topic and L / Th / P for each period."
                : "Period-wise schedule of classes for your batch this week."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="rounded-xl"
          >
            This Week
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="rounded-xl">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <WeeklyTeachingLogGrid
        role={gridRole}
        userId={user.id}
        studentBatchIds={studentBatchIds}
        weekStart={weekStart}
      />

      {role === "student" && (
        <LiveClassesBlock scope={{ kind: "student", batchIds: studentBatchIds }} seeAllLink="/dashboard/student/schedule" />
      )}
      {role === "instructor" && user && (
        <LiveClassesBlock scope={{ kind: "instructor", instructorId: user.id }} seeAllLink="/dashboard/tutor/schedule" />
      )}
    </div>
  );
};

export default DashboardSchedule;
