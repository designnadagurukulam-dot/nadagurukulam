import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, BookOpen, Mic, Music, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionDivider from "@/components/SectionDivider";

import imgMusic13 from "@/assets/gallery/NGMUSIC-13.webp";
import imgVocal from "@/assets/gallery/NGZ6R_1512_R.webp";
import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";
import imgChorus from "@/assets/gallery/NGR6M_0933.webp";
import imgConcert from "@/assets/gallery/NGR6_M1630.webp";
import imgDanceGroup from "@/assets/gallery/NGDSC_7428.webp";
import imgMaleChorus from "@/assets/gallery/NGDSC_8160.webp";
import imgSitar from "@/assets/gallery/NGMUSIC-2.webp";
import imgGuruShishya from "@/assets/gallery/NGDANCE-3.webp";
import imgDancePink from "@/assets/gallery/NGDSC_0238.webp";

const allCourses = [
  { name: "Carnatic Vocal", category: "vocal", img: imgVocal, level: "Beginner to Advanced", duration: "3 Years", teacher: "Smt. Revathi Ramachandran", desc: "Master the melodic intricacies of South Indian classical music, from basic swaras to complex ragas and kritis.", outcomes: ["Swara knowledge & Shruti alignment", "Raga identification & Alapana", "Kriti rendition & Manodharma", "Stage performance readiness"] },
  { name: "Hindustani Vocal", category: "vocal", img: imgMaleChorus, level: "Beginner to Advanced", duration: "3 Years", teacher: "Sri Raghunandan Panshikar", desc: "Explore the soulful ragas of North Indian classical music with authentic Guru-Shishya training.", outcomes: ["Raga & Taal fundamentals", "Khayal & Thumri rendition", "Bandish composition", "Concert performance skills"] },
  { name: "Bharatanatyam", category: "dance", img: imgDanceGroup, level: "Beginner to Advanced", duration: "4 Years", teacher: "Ms. Manasvini Ramachandran", desc: "Learn the ancient temple dance form with grace, precision, and devotion to this timeless art.", outcomes: ["Adavu mastery & footwork", "Abhinaya & expression", "Choreography & composition", "Arangetram preparation"] },
  { name: "Mridangam", category: "instrumental", img: imgPercussion, level: "Beginner to Intermediate", duration: "2 Years", teacher: "Sri Venkatesh Kumar", desc: "Explore the rhythmic heart of Carnatic music through traditional percussion training.", outcomes: ["Tala system mastery", "Solkattu & patterns", "Accompaniment techniques", "Concert readiness"] },
  { name: "Tabla", category: "instrumental", img: imgPercussion, level: "Beginner to Intermediate", duration: "2 Years", teacher: "Sri Abhishek Mishra", desc: "Master complex rhythmic patterns and compositions of Hindustani percussion.", outcomes: ["Bol system & Theka", "Kayda & Rela", "Solo & accompaniment", "Gharana traditions"] },
  { name: "Sitar", category: "instrumental", img: imgSitar, level: "Beginner to Advanced", duration: "3 Years", teacher: "Sri Shashank Subramanyam", desc: "Discover the divine sound of the sitar in classical tradition.", outcomes: ["String technique & tuning", "Raga rendition on sitar", "Gamakas & ornaments", "Stage performance"] },
];

const methodology = [
  { icon: BookOpen, title: "In-Person Classes", desc: "Traditional face-to-face sessions with personal guidance from Gurus.", img: imgGuruShishya },
  { icon: Mic, title: "Online Live Sessions", desc: "Interactive live classes for students learning remotely.", img: imgChorus },
  { icon: Music, title: "Recorded Lessons", desc: "Comprehensive lesson library for self-paced practice.", img: imgConcert },
  { icon: CheckCircle, title: "Performance Opportunities", desc: "Regular recitals and concerts to build stage confidence.", img: imgDancePink },
];

const tabs = [
  { value: "all", label: "All Programs" },
  { value: "vocal", label: "Vocal" },
  { value: "instrumental", label: "Instrumental" },
  { value: "dance", label: "Dance" },
];

const Courses = () => {
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? allCourses : allCourses.filter((c) => c.category === tab);

  return (
    <div>
      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <img src={imgMusic13} alt="Instruments" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.94)] via-[hsl(0_69%_18%/0.88)] to-[hsl(345_75%_12%/0.82)]" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-4" style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}>
              Our Programs
            </h1>
            <p className="text-primary-foreground/60 max-w-2xl mx-auto mb-6">
              Comprehensive programs rooted in tradition, designed for the modern learner.
            </p>
            <span className="badge-gold inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> {allCourses.length} Programs Available
            </span>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ FILTER + GRID ══════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {/* Custom pill tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-14">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  tab === t.value
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="group"
                >
                  <div className="relative h-[480px] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 card-premium">
                    <img src={c.img} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.95)] via-[hsl(0_0%_0%/0.4)] to-transparent" />

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="badge-gold">{c.level}</span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/80 text-primary-foreground backdrop-blur-sm">{c.duration}</span>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 inset-x-0 p-6">
                      <h3 className="font-serif text-2xl font-bold text-primary-foreground mb-1" style={{ textShadow: "0 2px 10px hsl(0 0% 0% / 0.5)" }}>{c.name}</h3>
                      <p className="text-primary-foreground/60 text-sm mb-3">by {c.teacher}</p>
                      <p className="text-primary-foreground/50 text-xs leading-relaxed mb-4 line-clamp-2 group-hover:line-clamp-none transition-all">{c.desc}</p>

                      {/* Outcomes — reveal on hover */}
                      <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500 mb-3">
                        <div className="space-y-1 pt-2 border-t border-primary-foreground/10">
                          {c.outcomes.map((o) => (
                            <div key={o} className="flex items-center gap-2 text-[11px] text-primary-foreground/60">
                              <CheckCircle className="h-3 w-3 text-secondary shrink-0" /> {o}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-lg">
                        Enquire Now
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ METHODOLOGY — Bento grid ══════ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-3xl md:text-5xl font-bold text-center mb-16">
            Learning <span className="text-gradient-gold">Methodology</span>
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {methodology.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group"
              >
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                  <img src={m.img} alt={m.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.85)] via-[hsl(0_0%_0%/0.4)] to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-6 flex items-end gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                      <m.icon className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-primary-foreground mb-0.5">{m.title}</h3>
                      <p className="text-primary-foreground/60 text-xs leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Courses;
