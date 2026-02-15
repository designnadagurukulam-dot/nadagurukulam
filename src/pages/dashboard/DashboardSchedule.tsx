import { motion } from "framer-motion";
import { Calendar, Clock, Video, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const schedule = [
  { title: "Carnatic Vocal - Lesson 12", date: "Today", time: "4:00 PM - 5:30 PM", type: "Live Class", mode: "Online", instructor: "Smt. Lakshmi Devi" },
  { title: "Bharatanatyam Practice", date: "Tomorrow", time: "10:00 AM - 11:30 AM", type: "Practice Session", mode: "In-Person", instructor: "Smt. Meenakshi Iyer" },
  { title: "Mridangam - Lesson 6", date: "Feb 17, 2026", time: "3:00 PM - 4:00 PM", type: "Live Class", mode: "Online", instructor: "Sri. Ramesh Kumar" },
  { title: "Music Theory Workshop", date: "Feb 18, 2026", time: "2:00 PM - 4:00 PM", type: "Workshop", mode: "Online", instructor: "Dr. Anand Sharma" },
];

const DashboardSchedule = () => (
  <div className="space-y-6">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-serif text-3xl text-foreground">Schedule</h1>
      <p className="text-muted-foreground mt-1">Your upcoming classes and events</p>
    </motion.div>

    <div className="space-y-4">
      {schedule.map((s, i) => (
        <motion.div key={s.title + s.date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{s.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{s.instructor}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.date}, {s.time}</span>
                      <span className="flex items-center gap-1">
                        {s.mode === "Online" ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                        {s.mode}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">{s.type}</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

export default DashboardSchedule;
