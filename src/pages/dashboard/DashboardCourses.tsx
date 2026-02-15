import { motion } from "framer-motion";
import { BookOpen, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const enrolledCourses = [
  { title: "Carnatic Vocal - Basics", instructor: "Smt. Lakshmi Devi", duration: "6 months", progress: 65, level: "Beginner", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600" },
  { title: "Bharatanatyam - Adavus", instructor: "Smt. Meenakshi Iyer", duration: "8 months", progress: 40, level: "Beginner", image: "https://images.unsplash.com/photo-1547153760-18fc86c083c8?w=600" },
  { title: "Mridangam Foundations", instructor: "Sri. Ramesh Kumar", duration: "12 months", progress: 25, level: "Beginner", image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600" },
];

const DashboardCourses = () => (
  <div className="space-y-6">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-serif text-3xl text-foreground">My Courses</h1>
      <p className="text-muted-foreground mt-1">Track your enrolled courses and progress</p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {enrolledCourses.map((course, i) => (
        <motion.div key={course.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <Card className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
            <div className="h-40 overflow-hidden relative">
              <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground">{course.level}</Badge>
            </div>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-serif text-lg text-foreground">{course.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{course.instructor}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration}</span>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

export default DashboardCourses;
