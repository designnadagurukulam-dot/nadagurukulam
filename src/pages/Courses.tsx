import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, BookOpen, Mic, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionDivider from "@/components/SectionDivider";

const allCourses = [
  { name: "Carnatic Vocal", category: "vocal", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600", level: "Beginner to Advanced", duration: "3 Years", teacher: "Smt. Revathi Ramachandran", desc: "Master the melodic intricacies of South Indian classical music, from basic swaras to complex ragas and kritis.", outcomes: ["Swara knowledge & Shruti alignment", "Raga identification & Alapana", "Kriti rendition & Manodharma", "Stage performance readiness"] },
  { name: "Hindustani Vocal", category: "vocal", img: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600", level: "Beginner to Advanced", duration: "3 Years", teacher: "Sri Raghunandan Panshikar", desc: "Explore the soulful ragas of North Indian classical music with authentic Guru-Shishya training.", outcomes: ["Raga & Taal fundamentals", "Khayal & Thumri rendition", "Bandish composition", "Concert performance skills"] },
  { name: "Bharatanatyam", category: "dance", img: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=600", level: "Beginner to Advanced", duration: "4 Years", teacher: "Ms. Manasvini Ramachandran", desc: "Learn the ancient temple dance form with grace, precision, and devotion to this timeless art.", outcomes: ["Adavu mastery & footwork", "Abhinaya & expression", "Choreography & composition", "Arangetram preparation"] },
  { name: "Mridangam", category: "instrumental", img: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600", level: "Beginner to Intermediate", duration: "2 Years", teacher: "Sri Venkatesh Kumar", desc: "Explore the rhythmic heart of Carnatic music through traditional percussion training.", outcomes: ["Tala system mastery", "Solkattu & patterns", "Accompaniment techniques", "Concert readiness"] },
  { name: "Tabla", category: "instrumental", img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600", level: "Beginner to Intermediate", duration: "2 Years", teacher: "Sri Abhishek Mishra", desc: "Master complex rhythmic patterns and compositions of Hindustani percussion.", outcomes: ["Bol system & Theka", "Kayda & Rela", "Solo & accompaniment", "Gharana traditions"] },
  { name: "Flute", category: "instrumental", img: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=600", level: "Beginner to Advanced", duration: "3 Years", teacher: "Sri Shashank Subramanyam", desc: "Discover the divine sound of the bamboo flute in classical tradition.", outcomes: ["Breath control & embouchure", "Raga rendition on flute", "Gamakas & ornaments", "Stage performance"] },
];

const methodology = [
  { icon: BookOpen, title: "In-Person Classes", desc: "Traditional face-to-face sessions with personal guidance from Gurus.", img: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400" },
  { icon: Mic, title: "Online Live Sessions", desc: "Interactive live classes for students learning remotely.", img: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400" },
  { icon: Music, title: "Recorded Lessons", desc: "Comprehensive lesson library for self-paced practice.", img: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400" },
  { icon: CheckCircle, title: "Performance Opportunities", desc: "Regular recitals and concerts to build stage confidence.", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400" },
];

const Courses = () => {
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? allCourses : allCourses.filter((c) => c.category === tab);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[45vh] flex items-center justify-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1920&q=80" alt="Instruments" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_20%/0.88)] to-[hsl(345_75%_15%/0.8)]" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">Our Programs</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">
            Comprehensive programs rooted in tradition, designed for the modern learner.
          </p>
        </div>
      </section>

      <SectionDivider />

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
                <Card className="h-full hover:shadow-xl transition-all overflow-hidden group">
                  <div className="h-44 img-zoom relative">
                    <img src={c.img} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                    <span className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-1 rounded-full bg-secondary/90 text-secondary-foreground">{c.level}</span>
                    <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/90 text-primary-foreground">{c.duration}</span>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-serif text-xl font-semibold mb-1">{c.name}</h3>
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

      <SectionDivider />

      {/* Methodology */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="font-serif text-3xl font-bold text-center mb-10">Learning Methodology</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {methodology.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className="border-none shadow-md overflow-hidden group">
                  <div className="flex">
                    <div className="w-28 h-28 shrink-0 img-zoom">
                      <img src={m.img} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <CardContent className="p-4 flex flex-col justify-center">
                      <h3 className="font-semibold text-sm mb-1">{m.title}</h3>
                      <p className="text-muted-foreground text-xs leading-relaxed">{m.desc}</p>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Courses;
