import { motion } from "framer-motion";
import { Clock, Video, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const schedule = [
  { title: "Carnatic Vocal - Lesson 12", date: "Today", time: "4:00 PM - 5:30 PM", type: "Live Class", mode: "Online", instructor: "Smt. Lakshmi Devi" },
  { title: "Bharatanatyam Practice", date: "Tomorrow", time: "10:00 AM - 11:30 AM", type: "Practice Session", mode: "In-Person", instructor: "Smt. Meenakshi Iyer" },
  { title: "Mridangam - Lesson 6", date: "Feb 17, 2026", time: "3:00 PM - 4:00 PM", type: "Live Class", mode: "Online", instructor: "Sri. Ramesh Kumar" },
  { title: "Music Theory Workshop", date: "Feb 18, 2026", time: "2:00 PM - 4:00 PM", type: "Workshop", mode: "Online", instructor: "Dr. Anand Sharma" },
];

const typeColors: Record<string, string> = {
  "Live Class": "bg-primary/15 text-primary",
  "Practice Session": "bg-secondary/15 text-secondary-foreground",
  "Workshop": "bg-accent/20 text-accent-foreground",
};

const DashboardSchedule = () => (
  <div className="space-y-6 pt-12 lg:pt-0">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-serif text-3xl font-bold text-foreground">Schedule</h1>
      <p className="text-muted-foreground mt-1 text-sm">Your upcoming classes and events</p>
    </motion.div>

    <div className="space-y-4">
      {schedule.map((s, i) => (
        <motion.div key={s.title + s.date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                {/* Calendar date badge */}
                <div className="w-20 md:w-24 bg-gradient-to-b from-primary to-primary/80 flex flex-col items-center justify-center text-primary-foreground shrink-0 p-3">
                  <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">
                    {s.date === "Today" ? "Today" : s.date === "Tomorrow" ? "Tmrw" : s.date.split(",")[0]?.split(" ")[0]}
                  </span>
                  <span className="text-2xl font-extrabold">
                    {s.date === "Today" ? "📍" : s.date === "Tomorrow" ? "📅" : s.date.split(" ")[1]?.replace(",", "")}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif font-bold text-foreground text-sm md:text-base">{s.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{s.instructor}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.time}</span>
                        <span className="flex items-center gap-1">
                          {s.mode === "Online" ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                          {s.mode}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`${typeColors[s.type] || ""} border-0 shrink-0 text-[11px]`}>
                      {s.type}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

export default DashboardSchedule;
