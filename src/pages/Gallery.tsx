import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Play, Sparkles } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";

import imgMusic13 from "@/assets/gallery/NGMUSIC-13.webp";
import imgMusic6 from "@/assets/gallery/NGMUSIC-6.webp";
import imgConcert from "@/assets/gallery/NGR6_M1630.webp";
import imgBharatanatyam from "@/assets/gallery/NGZ6R_1931_R.webp";
import imgDancers from "@/assets/gallery/NGR6M_9613.webp";
import imgVocal from "@/assets/gallery/NGZ6R_1512_R.webp";
import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";
import imgChorus from "@/assets/gallery/NGR6M_0933.webp";
import imgEnsemble from "@/assets/gallery/NGR6M_2124_R.webp";
import imgDancePerf from "@/assets/gallery/NGR6M_9591.webp";
import imgDanceGroup from "@/assets/gallery/NGDSC_7428.webp";
import imgMaleChorus from "@/assets/gallery/NGDSC_8160.webp";
import imgVocalClose from "@/assets/gallery/NGIMG_2141.webp";
import imgSitar from "@/assets/gallery/NGMUSIC-2.webp";
import imgGuruShishya from "@/assets/gallery/NGDANCE-3.webp";
import imgDanceRecital from "@/assets/gallery/NGDANCE-RECITAL-4.webp";
import imgDanceSolo from "@/assets/gallery/NGDANCE.webp";
import imgDancePink from "@/assets/gallery/NGDSC_0238.webp";
import imgDanceRed from "@/assets/gallery/NGDSC_0608_R.webp";
import imgDance2 from "@/assets/gallery/NGDANCE-2.webp";

import campusAerial from "@/assets/campus/NGCampusAerial.jpg";
import campusAmphitheatre from "@/assets/campus/NGAmphitheatre.jpg";
import campusVault from "@/assets/campus/NGVaultPassage.jpg";
import campusVerandah from "@/assets/campus/NGVerandah.jpg";
import campusReception from "@/assets/campus/NGReception.jpg";
import campusAmphyEntry from "@/assets/campus/NGAmphyEntry.jpg";

const images = [
  { src: imgDanceGroup, cat: "performances", alt: "Bharatanatyam group pose" },
  { src: imgConcert, cat: "events", alt: "Grand stage concert" },
  { src: imgPercussion, cat: "performances", alt: "Percussion ensemble" },
  { src: imgVocal, cat: "performances", alt: "Vocal concert" },
  { src: imgMusic13, cat: "campus", alt: "Student playing veena" },
  { src: imgDancers, cat: "events", alt: "Dancers in magenta" },
  { src: imgMusic6, cat: "campus", alt: "Students singing outdoors" },
  { src: imgChorus, cat: "events", alt: "Vocal chorus" },
  { src: imgEnsemble, cat: "workshops", alt: "Vocal ensemble" },
  { src: imgDancePerf, cat: "performances", alt: "Dance performance" },
  { src: imgMaleChorus, cat: "events", alt: "Male vocal ensemble on stage" },
  { src: imgVocalClose, cat: "performances", alt: "Vocalists close-up" },
  { src: imgSitar, cat: "campus", alt: "Sitar player on campus lawn" },
  { src: imgGuruShishya, cat: "workshops", alt: "Guru-Shishya dance training" },
  { src: imgDanceRecital, cat: "performances", alt: "Spectacular dance recital" },
  { src: imgDanceSolo, cat: "performances", alt: "Bharatanatyam solo dancer" },
  { src: imgDancePink, cat: "performances", alt: "Dancers in pink costumes" },
  { src: imgDanceRed, cat: "performances", alt: "Dance formation with red lighting" },
  { src: imgDance2, cat: "performances", alt: "Bharatanatyam group reaching upward" },
  { src: imgBharatanatyam, cat: "performances", alt: "Bharatanatyam Krishna theme" },
  { src: campusAerial, cat: "campus-renders", alt: "Campus Aerial View (3D)" },
  { src: campusAmphitheatre, cat: "campus-renders", alt: "Central Amphitheatre (3D)" },
  { src: campusVault, cat: "campus-renders", alt: "Heritage Vault Passage (3D)" },
  { src: campusVerandah, cat: "campus-renders", alt: "Verandah Walkway (3D)" },
  { src: campusReception, cat: "campus-renders", alt: "Reception Hall (3D)" },
  { src: campusAmphyEntry, cat: "campus-renders", alt: "Amphitheatre Entry (3D)" },
];

const videos = [
  { title: "Annual Day Carnatic Concert 2024", thumb: imgConcert },
  { title: "Bharatanatyam Arangetram Highlights", thumb: imgDanceRecital },
  { title: "Guru Purnima Celebrations", thumb: imgDanceRed },
];

const tabs = [
  { value: "all", label: "All" },
  { value: "events", label: "Events" },
  { value: "performances", label: "Performances" },
  { value: "workshops", label: "Workshops" },
  { value: "campus", label: "Campus Life" },
  { value: "campus-renders", label: "Campus (3D)" },
];

const Gallery = () => {
  const [tab, setTab] = useState("all");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const filtered = tab === "all" ? images : images.filter((img) => img.cat === tab);

  const navigate = (dir: -1 | 1) => {
    if (lightboxIdx === null) return;
    setLightboxIdx((lightboxIdx + dir + filtered.length) % filtered.length);
  };

  return (
    <div>
      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
        <motion.img
          src={imgDanceRecital}
          alt="Gallery"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(0_69%_6%/0.93)] via-[hsl(0_69%_14%/0.87)] to-[hsl(345_75%_10%/0.92)]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 60%, hsl(43 72% 52% / 0.08) 0%, transparent 50%)" }} />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="font-devanagari text-xl text-shimmer-gold mb-3">
              कला दर्शन
            </motion.p>
            <h1
              className="font-serif text-5xl md:text-7xl lg:text-8xl font-extrabold text-primary-foreground mb-5"
              style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}
            >
              Gallery
            </h1>
            <p className="text-primary-foreground/50 max-w-2xl mx-auto text-lg">
              Moments of artistry, devotion, and celebration from Nada Gurukulam.
            </p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6">
              <span className="badge-gold inline-flex items-center gap-1.5 text-xs">
                <Sparkles className="h-3 w-3" /> {images.length} Photos
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ FILTER + MASONRY ══════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {tabs.map((t) => {
              const count = t.value === "all" ? images.length : images.filter(img => img.cat === t.value).length;
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`relative px-6 py-3 rounded-full text-sm font-semibold transition-all duration-400 ${
                    tab === t.value
                      ? "bg-primary text-primary-foreground shadow-xl shadow-primary/25"
                      : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                  }`}
                >
                  {t.label} <span className="text-[10px] opacity-50 ml-1">({count})</span>
                  {tab === t.value && (
                    <motion.div
                      layoutId="gallery-tab-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                      style={{ background: "linear-gradient(90deg, hsl(43 72% 52%), hsl(48 90% 60%))" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
            >
              {filtered.map((img, i) => (
                <motion.div
                  key={`${img.alt}-${i}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  className="break-inside-avoid cursor-pointer group relative rounded-2xl overflow-hidden"
                  onClick={() => setLightboxIdx(i)}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  {/* Golden frame border on hover */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-secondary/40 transition-all duration-500 pointer-events-none" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[hsl(0_0%_0%/0.75)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                    <div>
                      <span className="badge-gold text-[9px] mb-2 inline-block">{img.cat}</span>
                      <p className="text-sm font-serif font-semibold text-primary-foreground" style={{ textShadow: "0 1px 4px hsl(0 0% 0% / 0.5)" }}>{img.alt}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ VIDEO GALLERY ══════ */}
      <section className="py-24 section-glass">
        <div className="container mx-auto px-4">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-4xl md:text-5xl font-extrabold text-center mb-16">
            Video Gallery
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group cursor-pointer"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-700 hover-magnetic">
                  <img src={v.thumb} alt={v.title} className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center group-hover:bg-primary/40 transition-colors duration-300">
                    <div className="w-16 h-16 rounded-full bg-secondary/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-secondary/30 animate-glow-pulse">
                      <Play className="h-7 w-7 text-secondary-foreground ml-0.5" />
                    </div>
                  </div>
                  {/* Golden border on hover */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-secondary/30 transition-all duration-500" />
                </div>
                <p className="mt-4 font-serif font-bold text-sm">{v.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ LIGHTBOX ══════ */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[hsl(0_0%_0%/0.96)] backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <button className="absolute top-6 right-6 w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-colors" onClick={() => setLightboxIdx(null)}>
              <X className="h-6 w-6" />
            </button>
            <button
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); navigate(-1); }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); navigate(1); }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <motion.img
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              src={filtered[lightboxIdx].src}
              alt={filtered[lightboxIdx].alt}
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <p className="text-primary-foreground/80 text-sm font-serif font-semibold">{filtered[lightboxIdx].alt}</p>
              <p className="text-primary-foreground/40 text-xs mt-1">{lightboxIdx + 1} / {filtered.length}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
