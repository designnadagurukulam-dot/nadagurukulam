import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Mic, Drum, Wind, BookOpen, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const allCourses = [
  { name: "Carnatic Vocal", category: "vocal", icon: Mic, level: "Beginner to Advanced", duration: "3 Years", teacher: "Smt. Revathi Ramachandran", desc: "Master the melodic intricacies of South Indian classical music, from basic swaras to complex ragas and kritis.", outcomes: ["Swara knowledge & Shruti alignment", "Raga identification & Alapana", "Kriti rendition & Manodharma", "Stage performance readiness"] },
  { name: "Hindustani Vocal", category: "vocal", icon: Mic, level: "Beginner to Advanced", duration: "3 Years", teacher: "Sri Raghunandan Panshikar", desc: "Explore the soulful ragas of North Indian classical music with authentic Guru-Shishya training.", outcomes: ["Raga & Taal fundamentals", "Khayal & Thumri rendition", "Bandish composition", "Concert performance skills"] },
  { name: "Bharatanatyam", category: "dance", icon: Music, level: "Beginner to Advanced", duration: "4 Years", teacher: "Ms. Manasvini Ramachandran", desc: "Learn the ancient temple dance form with grace, precision, and devotion to this timeless art.", outcomes: ["Adavu mastery & footwork", "Abhinaya & expression", "Choreography & composition", "Arangetram preparation"] },
  { name: "Mridangam", category: "instrumental", icon: Drum, level: "Beginner to Intermediate", duration: "2 Years", teacher: "Sri Venkatesh Kumar", desc: "Explore the rhythmic heart of Carnatic music through traditional percussion training.", outcomes: ["Tala system mastery", "Solkattu & patterns", "Accompaniment techniques", "Concert readiness"] },
  { name: "Tabla", category: "instrumental", icon: Drum, level: "Beginner to Intermediate", duration: "2 Years", teacher: "Sri Abhishek Mishra", desc: "Master complex rhythmic patterns and compositions of Hindustani percussion.", outcomes: ["Bol system & Theka", "Kayda & Rela", "Solo & accompaniment", "Gharana traditions"] },
  { name: "Flute", category: "instrumental", icon: Wind, level: "Beginner to Advanced", duration: "3 Years", teacher: "Sri Shashank Subramanyam", desc: "Discover the divine sound of the bamboo flute in classical tradition.", outcomes: ["Breath control & embouchure", "Raga rendition on flute", "Gamakas & ornaments", "Stage performance"] },
];

const Courses = () => {
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? allCourses : allCourses.filter((c) => c.category === tab);

  return (
    <div>
      {/* Hero */}
      <section className="gradient-maroon py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">Our Programs</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">
            Comprehensive programs rooted in tradition, designed for the modern learner.
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <Tabs value={tab} onValueChange={setTab} className="mb-10">
            <TabsList className="mx-auto flex w-fit">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="vocal">Vocal</TabsTrigger>
              <TabsTrigger value="instrumental">Instrumental</TabsTrigger>
              <TabsTrigger value="dance">Dance</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow overflow-hidden group">
                  <div className="h-40 gradient-maroon flex items-center justify-center">
                    <c.icon className="h-14 w-14 text-primary-foreground/30 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-serif text-xl font-semibold mb-1">{c.name}</h3>
                    <p className="text-xs text-secondary font-medium mb-2">{c.level} · {c.duration}</p>
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{c.desc}</p>
                    <p className="text-xs text-muted-foreground mb-4">Instructor: <span className="font-medium text-foreground">{c.teacher}</span></p>

                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-2">Learning Outcomes</h4>
                    <ul className="space-y-1 mb-5">
                      {c.outcomes.map((o) => (
                        <li key={o} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-secondary shrink-0" /> {o}
                        </li>
                      ))}
                    </ul>
                    <Button size="sm" className="w-full">Enquire Now</Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-center mb-10">Learning Methodology</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: BookOpen, title: "In-Person Classes", desc: "Traditional face-to-face sessions with personal guidance from Gurus." },
              { icon: Mic, title: "Online Live Sessions", desc: "Interactive live classes for students learning remotely from anywhere." },
              { icon: Music, title: "Recorded Lessons", desc: "Comprehensive lesson library for self-paced practice and revision." },
              { icon: CheckCircle, title: "Performance Opportunities", desc: "Regular recitals and concerts to build stage presence and confidence." },
            ].map((m) => (
              <Card key={m.title} className="border-none shadow-md">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{m.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{m.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Courses;
