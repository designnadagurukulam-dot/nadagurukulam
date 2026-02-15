import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, BookOpen, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionDivider from "@/components/SectionDivider";

import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";
import imgSitar from "@/assets/gallery/NGMUSIC-2.webp";
import imgGuruShishya from "@/assets/gallery/NGDANCE-3.webp";
import imgMaleChorus from "@/assets/gallery/NGDSC_8160.webp";
import imgVocalClose from "@/assets/gallery/NGIMG_2141.webp";
import imgDanceRed from "@/assets/gallery/NGDSC_0608_R.webp";

import directorImg from "@/assets/founders/SmtRevathiRamachandran.webp";

const faculty = [
  { name: "Smt. Revathi Ramachandran", spec: "Carnatic Vocal", cat: "carnatic", role: "Director & Lead Faculty", exp: "25+ years", img: directorImg, awards: ["Sangeet Natak Akademi Award", "Kalaimamani Title"], bio: "A distinguished Carnatic vocalist and educator, Smt. Revathi has dedicated her life to preserving and propagating the rich tradition of South Indian classical music.", education: ["B.A. Music — University of Madras", "M.A. Carnatic Music — Sri Venkateswara University", "Ph.D. — Musicology"] },
  { name: "Sri Raghunandan Panshikar", spec: "Hindustani Vocal", cat: "hindustani", role: "Senior Faculty", exp: "20+ years", img: imgMaleChorus, awards: ["Kumar Gandharva Samman", "Tansen Award Nominee"], bio: "A powerful Hindustani vocalist trained in the Gwalior Gharana tradition, bringing depth of khayal gayaki to students.", education: ["Sangeet Visharad — Gandharva Mahavidyalaya", "M.A. Music — SNDT University"] },
  { name: "Ms. Manasvini Ramachandran", spec: "Bharatanatyam", cat: "bharatanatyam", role: "Lead Dance Faculty", exp: "15+ years", img: imgGuruShishya, awards: ["Natya Shiromani Award", "Young Artist Fellowship"], bio: "A graceful and technically brilliant Bharatanatyam artist, combining traditional Tanjore-style with contemporary choreographic sensibility.", education: ["B.F.A. Bharatanatyam — Kalakshetra", "M.A. Dance — University of Hyderabad"] },
  { name: "Sri Venkatesh Kumar", spec: "Mridangam", cat: "instrumental", role: "Percussion Faculty", exp: "18+ years", img: imgPercussion, awards: ["Best Accompanist Award — Music Academy", "CCRT Fellowship"], bio: "A consummate mridangam artist known for rhythmic precision and innovative approach.", education: ["Diploma in Mridangam — Karnataka College of Percussion", "M.Mus — University of Mysore"] },
  { name: "Sri Shashank Subramanyam", spec: "Sitar", cat: "instrumental", role: "Sitar Faculty", exp: "22+ years", img: imgSitar, awards: ["Padma Shri Nominee", "A-Grade Artist — All India Radio"], bio: "A sitarist of extraordinary caliber who has redefined classical sitar playing with unique tonal quality.", education: ["Trained under legendary sitar lineage", "Honorary Doctorate — University of Mysore"] },
  { name: "Sri Abhishek Mishra", spec: "Tabla", cat: "instrumental", role: "Tabla Faculty", exp: "12+ years", img: imgVocalClose, awards: ["Ustad Bismillah Khan Yuva Puraskar"], bio: "A dynamic young tabla maestro of the Benares Gharana, bringing energy and innovation to traditional tabla pedagogy.", education: ["B.Mus Tabla — Banaras Hindu University", "M.Mus — Delhi University"] },
];

const tabs = [
  { value: "all", label: "All" },
  { value: "carnatic", label: "Carnatic" },
  { value: "hindustani", label: "Hindustani" },
  { value: "bharatanatyam", label: "Bharatanatyam" },
  { value: "instrumental", label: "Instrumental" },
];

const Faculty = () => {
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<typeof faculty[0] | null>(null);
  const filtered = tab === "all" ? faculty : faculty.filter((f) => f.cat === tab);

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
          {/* Custom pill tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-14">
            {tabs.map((t) => (
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
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filtered.map((f, i) => (
                <motion.div
                  key={f.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="group cursor-pointer"
                  onClick={() => setSelected(f)}
                >
                  <div className="relative h-[300px] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <img src={f.img} alt={f.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.95)] via-[hsl(0_0%_0%/0.3)] to-transparent" />
                    {/* Gold accent stripe */}
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-secondary rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute bottom-0 inset-x-0 p-6">
                      <div className="w-10 h-0.5 bg-secondary mb-3 rounded-full" />
                      <h3 className="font-serif text-xl font-bold text-primary-foreground mb-0.5" style={{ textShadow: "0 2px 10px hsl(0 0% 0% / 0.5)" }}>{f.name}</h3>
                      <p className="text-secondary text-sm font-medium mb-1">{f.spec}</p>
                      <p className="text-primary-foreground/50 text-xs mb-3">{f.role} · {f.exp}</p>
                      <div className="flex flex-wrap gap-1">
                        {f.awards.slice(0, 2).map((a) => (
                          <span key={a} className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary backdrop-blur-sm border border-secondary/20">
                            <Award className="h-2.5 w-2.5" /> {a}
                          </span>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="mt-4 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        View Profile
                      </Button>
                    </div>

                    {/* Hover glow */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-secondary/30 transition-colors duration-500" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ══════ PROFILE MODAL ══════ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[hsl(0_0%_0%/0.85)] backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header image */}
              <div className="relative h-56 overflow-hidden rounded-t-2xl">
                <img src={selected.img} alt={selected.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-8 -mt-10 relative">
                <h2 className="font-serif text-2xl font-bold">{selected.name}</h2>
                <p className="text-secondary font-medium text-sm mb-1">{selected.spec} · {selected.role}</p>
                <div className="w-10 h-0.5 bg-secondary rounded-full my-4" />

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{selected.bio}</p>

                <div className="space-y-5">
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                      <BookOpen className="h-4 w-4 text-secondary" /> Education
                    </h4>
                    <ul className="space-y-1.5">
                      {selected.education.map((e) => <li key={e} className="text-xs text-muted-foreground pl-4 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-secondary/30">• {e}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                      <Award className="h-4 w-4 text-secondary" /> Awards & Accolades
                    </h4>
                    <ul className="space-y-1.5">
                      {selected.awards.map((a) => <li key={a} className="text-xs text-muted-foreground">• {a}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-secondary" /> Experience
                    </h4>
                    <p className="text-xs text-muted-foreground">{selected.exp} of teaching and performance</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Faculty;
