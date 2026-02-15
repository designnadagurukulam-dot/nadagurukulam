import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";
import { facultyMembers, categories } from "@/data/facultyData";

import imgDanceRed from "@/assets/gallery/NGDSC_0608_R.webp";

const Faculty = () => {
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? facultyMembers : facultyMembers.filter((f) => f.category === tab);

  return (
    <div>
      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden grain-overlay">
        <motion.img
          src={imgDanceRed}
          alt="Faculty"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.94)] via-[hsl(0_69%_18%/0.88)] to-[hsl(345_75%_12%/0.82)]" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-secondary/25"
              style={{ width: `${4 + i % 3 * 2}px`, height: `${4 + i % 3 * 2}px`, left: `${12 + i * 18}%`, top: `${20 + (i * 15) % 55}%` }}
              animate={{ y: [0, -20, 0], opacity: [0.1, 0.45, 0.1] }}
              transition={{ repeat: Infinity, duration: 3.5 + i * 0.6, delay: i * 0.3, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="font-devanagari text-xl text-shimmer-gold mb-3">
              गुरु ब्रह्मा गुरु विष्णु
            </motion.p>
            <h1
              className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-4"
              style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}
            >
              Meet Our <span className="text-shimmer-gold">Gurus</span>
            </h1>
            <p className="text-primary-foreground/55 max-w-2xl mx-auto text-lg">
              Masters of their art, dedicated to nurturing the next generation.
            </p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-5">
              <span className="badge-gold inline-flex items-center gap-1.5 text-xs">
                <Sparkles className="h-3 w-3" /> {facultyMembers.length} Expert Gurus
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ FILTER + GRID ══════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {/* Filter tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-14">
            {categories.map((t) => (
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
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filtered.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                >
                  <Link to={`/faculty/${f.id}`} className="group block">
                    <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 bg-card">
                      {/* Portrait image — tall for face visibility */}
                      <div className="relative h-80 overflow-hidden">
                        <img
                          src={f.image}
                          alt={f.name}
                          className="w-full h-full object-cover object-[center_15%] group-hover:scale-105 transition-transform duration-[1s]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-70" />
                        {/* Golden border glow on hover */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-secondary/40 transition-all duration-700 rounded-t-2xl" />
                        {/* Hover shimmer */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-[hsl(43_72%_52%/0.08)] via-transparent to-transparent" />
                      </div>

                      {/* Info panel */}
                      <div className="p-5 border-t-2 border-secondary/25 group-hover:border-secondary/50 transition-colors duration-500">
                        <h3 className="font-serif text-base font-bold truncate mb-0.5">{f.name}</h3>
                        <p className="text-secondary text-xs font-semibold">{f.id === "revathi-ramachandran" ? f.title : f.specialization}</p>
                        <p className="text-muted-foreground text-xs mt-1">{f.experience}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default Faculty;
