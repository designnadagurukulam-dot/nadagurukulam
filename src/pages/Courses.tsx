import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import SectionDivider from "@/components/SectionDivider";
import { courseImageMap, defaultCourseImage } from "@/lib/courseImages";

import imgVocal from "@/assets/gallery/NGZ6R_1512_R.webp";
import imgChorus from "@/assets/gallery/NGDSC_8160.webp";
import imgDance from "@/assets/gallery/NGDSC_7428.webp";
import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";
import imgSitar from "@/assets/gallery/NGMUSIC-2.webp";
import imgEnsemble from "@/assets/gallery/NGR6M_0933.webp";

const tabs = [
  { value: "all", label: "All Courses" },
  { value: "Vocal", label: "Vocal" },
  { value: "Instrumental", label: "Instrumental" },
  { value: "Dance", label: "Dance" },
];

const maestros = [
  { src: imgVocal, alt: "Carnatic vocal maestro" },
  { src: imgChorus, alt: "Hindustani vocal" },
  { src: imgDance, alt: "Bharatanatyam" },
  { src: imgPercussion, alt: "Mridangam & percussion" },
  { src: imgSitar, alt: "Sitar maestro" },
  { src: imgEnsemble, alt: "Classical ensemble" },
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
        .is("archived_at", null)
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
      {/* ══════ HERO — Maestros collage ══════ */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Collage grid background */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0.5">
          {maestros.map((m, i) => (
            <motion.div
              key={m.alt}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: i * 0.08, ease: "easeOut" }}
              className="relative overflow-hidden"
            >
              <img src={m.src} alt={m.alt} className="w-full h-full object-cover" loading="eager" />
            </motion.div>
          ))}
        </div>
        {/* Dark gradient overlay so text reads cleanly */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(358_68%_8%/0.85)] via-[hsl(358_68%_10%/0.78)] to-[hsl(358_68%_8%/0.92)]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 55%, hsl(33 62% 58% / 0.12) 0%, transparent 55%)" }} />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            <motion.p
              className="font-devanagari text-3xl md:text-5xl lg:text-6xl text-shimmer-gold mb-4 leading-relaxed overflow-visible py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
            >
              विद्या ददाति विनयम्
            </motion.p>
            <p className="text-primary-foreground/70 italic text-lg md:text-2xl tracking-[0.2em]">
              "Knowledge bestows humility"
            </p>
            <p className="mt-6 text-primary-foreground/55 text-sm md:text-base tracking-widest uppercase">
              Tracing the lineage of India's classical maestros
            </p>
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
                className={`relative px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
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
                    style={{ background: "linear-gradient(90deg, hsl(33 62% 58%), hsl(35 62% 65%))" }}
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
              <p className="text-muted-foreground text-lg">No courses found.</p>
            </div>
          ) : (
            <motion.div
              key={tab}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
              }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto"
            >
              {filtered.map((c: any) => (
                <motion.div
                  key={c.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
                  }}
                >
                  <Link to={`/programs/${c.slug || c.id}`} className="group block">
                    <div className="relative h-[420px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500 card-premium golden-sweep">
                      <img
                        src={getImage(c)}
                        alt={c.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.92)] via-[hsl(0_0%_0%/0.2)] to-transparent" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-[hsl(33_62%_58%/0.12)] via-transparent to-transparent" />

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
          )}
        </div>
      </section>
    </div>
  );
};

export default Courses;
