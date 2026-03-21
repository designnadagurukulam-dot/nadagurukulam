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
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
        <motion.img
          src={imgDanceRed}
          alt="Faculty"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(0_69%_6%/0.93)] via-[hsl(0_69%_14%/0.87)] to-[hsl(345_75%_10%/0.92)]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 60%, hsl(43 72% 52% / 0.08) 0%, transparent 50%)" }} />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="font-devanagari text-3xl md:text-5xl lg:text-6xl text-shimmer-gold mb-4 leading-relaxed overflow-visible py-2">
              गुरु ब्रह्मा गुरु विष्णु
            </motion.p>
            <p className="text-primary-foreground/50 italic text-lg md:text-2xl tracking-[0.2em]">
              "Guru is Brahma, Guru is Vishnu"
            </p>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ FILTER + GRID ══════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          {/* Filter tabs — larger with golden active indicator */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {categories.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`relative px-7 py-3 rounded-full text-sm font-semibold transition-all duration-400 ${
                  tab === t.value
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/25"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                }`}
              >
                {t.label}
                {tab === t.value && (
                  <motion.div
                    layoutId="faculty-tab-indicator"
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
            >
              {/* Featured leaders row */}
              {(() => {
                const leaderIds = ["revathi-ramachandran", "manasvini-ramachandran"];
                const leaders = leaderIds.map(id => filtered.find(f => f.id === id)).filter(Boolean) as typeof filtered;
                const others = filtered.filter(f => !leaderIds.includes(f.id));

                return (
                  <>
                    {leaders.length > 0 && (
                      <div className="flex flex-wrap justify-center items-end gap-10 md:gap-16 mb-16">
                        {leaders.map((f, i) => (
                          <motion.div
                            key={f.id}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="w-60 md:w-72"
                          >
                            <Link to={`/faculty/${f.id}`} className="group block text-center">
                              <div className="relative mb-6">
                                <div className="w-48 h-48 md:w-60 md:h-60 mx-auto rounded-full overflow-hidden portrait-gold-ring relative">
                                  <img
                                    src={f.image}
                                    alt={f.name}
                                    className="w-full h-full object-cover object-[center_15%] group-hover:scale-110 transition-transform duration-700"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-52 h-52 md:w-64 md:h-64 rounded-full border border-secondary/0 group-hover:border-secondary/20 transition-all duration-700 group-hover:scale-110" />
                                </div>
                              </div>
                              <h3 className="font-serif text-lg md:text-xl font-bold mb-1 group-hover:text-primary transition-colors">{f.name}</h3>
                              <p className="text-secondary text-sm font-semibold">{f.id === "revathi-ramachandran" ? f.title : f.specialization}</p>
                              <p className="text-muted-foreground text-xs mt-1">{f.experience}</p>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Other faculty grid */}
                    {others.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                        {others.map((f, i) => (
                          <motion.div
                            key={f.id}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (leaders.length + i) * 0.07, duration: 0.5 }}
                          >
                            <Link to={`/faculty/${f.id}`} className="group block text-center">
                              <div className="relative mb-5">
                                <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden portrait-gold-ring relative">
                                  <img
                                    src={f.image}
                                    alt={f.name}
                                    className="w-full h-full object-cover object-[center_15%] group-hover:scale-110 transition-transform duration-700"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border border-secondary/0 group-hover:border-secondary/20 transition-all duration-700 group-hover:scale-110" />
                                </div>
                              </div>
                              <h3 className="font-serif text-sm md:text-base font-bold mb-1 group-hover:text-primary transition-colors">{f.name}</h3>
                              <p className="text-secondary text-xs font-semibold">{f.specialization}</p>
                              <p className="text-muted-foreground text-[11px] mt-1">{f.experience}</p>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default Faculty;
