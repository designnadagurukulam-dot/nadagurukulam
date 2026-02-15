import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";
import { facultyMembers, categories } from "@/data/facultyData";

import imgDanceRed from "@/assets/gallery/NGDSC_0608_R.webp";

const Faculty = () => {
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? facultyMembers : facultyMembers.filter((f) => f.category === tab);

  return (
    <div>
      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
        <img src={imgDanceRed} alt="Faculty" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.94)] via-[hsl(0_69%_18%/0.88)] to-[hsl(345_75%_12%/0.82)]" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-4"
            style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}
          >
            Meet Our Esteemed <span className="text-shimmer-gold">Gurus</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-primary-foreground/60 max-w-2xl mx-auto"
          >
            Masters of their art, dedicated to nurturing the next generation.
          </motion.p>
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
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
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
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <Link to={`/faculty/${f.id}`} className="group block">
                    <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card">
                      {/* Portrait image — 65% of card */}
                      <div className="relative h-72 overflow-hidden">
                        <img
                          src={f.image}
                          alt={f.name}
                          className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                        {/* Hover glow border */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-secondary/30 transition-colors duration-500 rounded-t-2xl" />
                      </div>

                      {/* Info panel */}
                      <div className="p-4 border-t-2 border-secondary/20">
                        <h3 className="font-serif text-base font-bold truncate">{f.name}</h3>
                        <p className="text-secondary text-xs font-medium mt-0.5">{f.specialization}</p>
                        <p className="text-muted-foreground text-xs mt-1">{f.title} · {f.experience}</p>
                        {f.awards.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Award className="h-3 w-3 text-secondary/60" />
                            <span className="text-[10px] text-muted-foreground truncate">{f.awards[0]}</span>
                          </div>
                        )}
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
