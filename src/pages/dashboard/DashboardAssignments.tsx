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
  pending: { label: "Pending", icon: Clock, className: "bg-secondary/20 text-secondary-foreground" },
  overdue: { label: "Overdue", icon: AlertCircle, className: "bg-destructive/20 text-destructive" },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-green-100 text-green-700" },
};

const DashboardAssignments = () => (
  <div className="space-y-6">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-serif text-3xl text-foreground">Assignments</h1>
      <p className="text-muted-foreground mt-1">View and manage your assignments</p>
    </motion.div>

    <div className="space-y-3">
      {assignments.map((a, i) => {
        const cfg = statusConfig[a.status as keyof typeof statusConfig];
        return (
          <motion.div key={a.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.course} • Due: {a.dueDate}</p>
                  </div>
                </div>
                <Badge variant="secondary" className={cfg.className}>
                  <cfg.icon className="h-3 w-3 mr-1" />
                  {cfg.label}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  </div>
);

export default DashboardAssignments;
