import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";
import { courseImageMap, defaultCourseImage } from "@/lib/courseImages";

import imgMusic13 from "@/assets/gallery/NGMUSIC-13.webp";

const tabs = [
  { value: "all", label: "All Programs" },
  { value: "Vocal", label: "Vocal" },
  { value: "Instrumental", label: "Instrumental" },
  { value: "Dance", label: "Dance" },
];

const Courses = () => {
  const [tab, setTab] = useState("all");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["all-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (tab === "all") return courses;
    return courses.filter((c: any) => c.category === tab);
  }, [courses, tab]);

  const getImage = (course: any) => {
    if (course.slug && courseImageMap[course.slug]) return courseImageMap[course.slug];
    if (course.thumbnail_url) return course.thumbnail_url;
    if (course.image_url) return course.image_url;
    return defaultCourseImage;
  };

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
              <Sparkles className="h-3 w-3" /> {courses.length} Programs Available
            </span>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ FILTER + GRID ══════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
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

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[420px] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No programs found.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto"
              >
                {filtered.map((c: any, i: number) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  >
                    <Link to={`/programs/${c.slug || c.id}`} className="group block">
                      <div className="relative h-[420px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-700 hover-magnetic card-premium golden-sweep">
                        <img
                          src={getImage(c)}
                          alt={c.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.92)] via-[hsl(0_0%_0%/0.2)] to-transparent" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-[hsl(43_72%_52%/0.12)] via-transparent to-transparent" />

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
                            {c.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
};

export default Courses;
