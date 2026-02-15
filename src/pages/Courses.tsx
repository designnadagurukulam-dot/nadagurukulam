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
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden grain-overlay">
        <motion.img
          src={imgMusic13}
          alt="Instruments"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.94)] via-[hsl(0_69%_18%/0.88)] to-[hsl(345_75%_12%/0.82)]" />

        {/* Floating golden particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-secondary/30"
              style={{ width: `${3 + i % 3 * 2}px`, height: `${3 + i % 3 * 2}px`, left: `${15 + i * 14}%`, top: `${25 + (i * 13) % 50}%` }}
              animate={{ y: [0, -25, 0], opacity: [0.15, 0.5, 0.15] }}
              transition={{ repeat: Infinity, duration: 3 + i * 0.7, delay: i * 0.4, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-devanagari text-xl md:text-2xl text-shimmer-gold mb-3"
            >
              विद्या ददाति विनयम्
            </motion.p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-5" style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}>
              Our Programs
            </h1>
            <p className="text-primary-foreground/55 max-w-2xl mx-auto mb-6 text-lg">
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
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {/* Pill tabs */}
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
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {filtered.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group cursor-pointer"
                >
                  <div className="relative h-[380px] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 card-premium">
                    <img
                      src={c.img}
                      alt={c.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1s]"
                      loading="lazy"
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.9)] via-[hsl(0_0%_0%/0.15)] to-transparent" />

                    {/* Hover gold shimmer */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-[hsl(43_72%_52%/0.12)] via-transparent to-transparent" />

                    {/* Course name only */}
                    <div className="absolute bottom-0 inset-x-0 p-7">
                      <div className="w-10 h-0.5 bg-secondary rounded-full mb-3 group-hover:w-16 transition-all duration-500" />
                      <h3
                        className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground leading-tight"
                        style={{ textShadow: "0 2px 20px hsl(0 0% 0% / 0.6)" }}
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
