import { motion } from "framer-motion";
import { BookOpen, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import imgVocal from "@/assets/gallery/NGZ6R_1512_R.webp";
import imgBharatanatyam from "@/assets/gallery/NGZ6R_1931_R.webp";
import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";

const enrolledCourses = [
  { title: "Carnatic Vocal - Basics", instructor: "Smt. Lakshmi Devi", duration: "6 months", progress: 65, level: "Beginner", image: imgVocal },
  { title: "Bharatanatyam - Adavus", instructor: "Smt. Meenakshi Iyer", duration: "8 months", progress: 40, level: "Beginner", image: imgBharatanatyam },
  { title: "Mridangam Foundations", instructor: "Sri. Ramesh Kumar", duration: "12 months", progress: 25, level: "Beginner", image: imgPercussion },
];

const DashboardCourses = () => (
  <div className="space-y-6 pt-12 lg:pt-0">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-serif text-3xl font-bold text-foreground">My Courses</h1>
      <p className="text-muted-foreground mt-1 text-sm">Track your enrolled courses and progress</p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {enrolledCourses.map((course, i) => (
        <motion.div key={course.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group cursor-pointer border-0 shadow-md">
            <div className="h-44 overflow-hidden relative">
              <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
              <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground border-0 shadow-md">{course.level}</Badge>
            </div>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-serif text-lg font-bold text-foreground">{course.title}</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{course.instructor}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration}</span>
              </div>
              {/* Golden progress ring indicator */}
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                    <circle
                      cx="28" cy="28" r="24" fill="none"
                      stroke="hsl(33 62% 58%)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${course.progress * 1.508} ${150.8 - course.progress * 1.508}`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">{course.progress}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">In Progress</p>
                  <p>{course.progress}% completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

export default DashboardCourses;
