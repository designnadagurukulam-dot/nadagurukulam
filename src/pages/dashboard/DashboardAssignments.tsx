import { motion } from "framer-motion";
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const assignments = [
  { title: "Sarali Varisai Practice - Set 1", course: "Carnatic Vocal", dueDate: "Feb 20, 2026", status: "pending" },
  { title: "Record Alankarams (Ascending)", course: "Carnatic Vocal", dueDate: "Feb 22, 2026", status: "pending" },
  { title: "Tattadavu - 8 Counts Video", course: "Bharatanatyam", dueDate: "Feb 18, 2026", status: "overdue" },
  { title: "Basic Bol Patterns Practice", course: "Mridangam", dueDate: "Feb 25, 2026", status: "pending" },
  { title: "Raga Identification Quiz", course: "Carnatic Vocal", dueDate: "Feb 10, 2026", status: "completed" },
];

const statusConfig = {
  pending: { label: "Pending", icon: Clock, bg: "bg-secondary/15 text-secondary-foreground", dot: "bg-secondary" },
  overdue: { label: "Overdue", icon: AlertCircle, bg: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
  completed: { label: "Completed", icon: CheckCircle2, bg: "bg-green-100 text-green-700", dot: "bg-green-500" },
};

const DashboardAssignments = () => (
  <div className="space-y-6 pt-12 lg:pt-0">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-serif text-3xl font-bold text-foreground">Assignments</h1>
      <p className="text-muted-foreground mt-1 text-sm">View and manage your assignments</p>
    </motion.div>

    {/* Timeline-style layout with golden connecting line */}
    <div className="relative">
      {/* Golden connecting line */}
      <div className="absolute left-[23px] top-4 bottom-4 w-[2px] hidden md:block" style={{ background: "linear-gradient(180deg, hsl(43 72% 52% / 0.4), hsl(43 72% 52% / 0.1))" }} />

      <div className="space-y-3">
        {assignments.map((a, i) => {
          const cfg = statusConfig[a.status as keyof typeof statusConfig];
          return (
            <motion.div key={a.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="flex items-start gap-4">
                {/* Timeline dot */}
                <div className="hidden md:flex shrink-0 w-12 items-center justify-center relative z-10">
                  <div className={`w-3 h-3 rounded-full ${cfg.dot} shadow-sm`} />
                </div>

                <Card className="flex-1 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-primary/8 shrink-0">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.course} • Due: {a.dueDate}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`${cfg.bg} border-0 shrink-0`}>
                      <cfg.icon className="h-3 w-3 mr-1" />
                      {cfg.label}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
);

export default DashboardAssignments;
