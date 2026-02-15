import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";

import imgMusic13 from "@/assets/gallery/NGMUSIC-13.webp";
import imgVocal from "@/assets/gallery/NGZ6R_1512_R.webp";
import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";
import imgDanceGroup from "@/assets/gallery/NGDSC_7428.webp";
import imgMaleChorus from "@/assets/gallery/NGDSC_8160.webp";
import imgSitar from "@/assets/gallery/NGMUSIC-2.webp";

const allCourses = [
  { name: "Carnatic Vocal", category: "vocal", img: imgVocal },
  { name: "Hindustani Vocal", category: "vocal", img: imgMaleChorus },
  { name: "Bharatanatyam", category: "dance", img: imgDanceGroup },
  { name: "Mridangam", category: "instrumental", img: imgPercussion },
  { name: "Tabla", category: "instrumental", img: imgPercussion },
  { name: "Sitar", category: "instrumental", img: imgSitar },
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
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
        <motion.img
          src={imgMusic13}
          alt="Instruments"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(0_69%_6%/0.93)] via-[hsl(0_69%_14%/0.87)] to-[hsl(345_75%_10%/0.92)]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 60%, hsl(43 72% 52% / 0.08) 0%, transparent 50%)" }} />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-devanagari text-xl md:text-2xl text-shimmer-gold mb-3">
              विद्या ददाति विनयम्
            </motion.p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-extrabold text-primary-foreground mb-5" style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}>
              Our Programs
            </h1>
            <p className="text-primary-foreground/50 max-w-2xl mx-auto mb-6 text-lg">
              Comprehensive programs rooted in tradition, designed for the modern learner.
            </p>
            <span className="badge-gold inline-flex items-center gap-1.5 text-xs">
              <Sparkles className="h-3 w-3" /> {allCourses.length} Programs Available
            </span>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ FILTER + GRID ══════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          {/* Larger pill tabs with golden active indicator */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`relative px-8 py-3 rounded-full text-sm font-semibold transition-all duration-400 ${
                  tab === t.value
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/25"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                }`}
              >
                {t.label}
                {tab === t.value && (
                  <motion.div
                    layoutId="course-tab-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                    style={{ background: "linear-gradient(90deg, hsl(43 72% 52%), hsl(48 90% 60%))" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
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
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto"
            >
              {filtered.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group cursor-pointer"
                >
                  <div className="relative h-[420px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-700 hover-magnetic card-premium golden-sweep">
                    <img
                      src={c.img}
                      alt={c.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.92)] via-[hsl(0_0%_0%/0.2)] to-transparent" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-[hsl(43_72%_52%/0.12)] via-transparent to-transparent" />

                    {/* Golden corner ornaments */}
                    <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-secondary/30 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-secondary/30 rounded-tr-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute bottom-20 left-4 w-10 h-10 border-b-2 border-l-2 border-secondary/30 rounded-bl-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute bottom-20 right-4 w-10 h-10 border-b-2 border-r-2 border-secondary/30 rounded-br-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

                    <div className="absolute bottom-0 inset-x-0 p-7">
                      <div className="w-12 h-0.5 bg-secondary rounded-full mb-3 group-hover:w-20 transition-all duration-500" />
                      <h3
                        className="font-serif text-3xl font-extrabold text-primary-foreground leading-tight"
                        style={{ textShadow: "0 3px 20px hsl(0 0% 0% / 0.7)" }}
                      >
                        {c.name}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default Courses;
