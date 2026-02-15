import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronRight, Quote, Star, Building2, Music, Sparkles, Lightbulb, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionDivider from "@/components/SectionDivider";

import imgMusic13 from "@/assets/gallery/NGMUSIC-13.webp";
import imgMusic6 from "@/assets/gallery/NGMUSIC-6.webp";
import imgConcert from "@/assets/gallery/NGR6_M1630.webp";
import imgVocal from "@/assets/gallery/NGZ6R_1512_R.webp";
import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";
import imgChorus from "@/assets/gallery/NGR6M_0933.webp";
import imgDanceGroup from "@/assets/gallery/NGDSC_7428.webp";
import imgMaleChorus from "@/assets/gallery/NGDSC_8160.webp";
import imgSitar from "@/assets/gallery/NGMUSIC-2.webp";

import founderImg from "@/assets/founders/SadguruSriMadhusudanSai.jpg";
import { facultyMembers } from "@/data/facultyData";
import campusAerial from "@/assets/campus/NGCampusAerial.jpg";
import campusAmphitheatre from "@/assets/campus/NGAmphitheatre.jpg";
import campusReception from "@/assets/campus/NGReception.jpg";
import campusVault from "@/assets/campus/NGVaultPassage.jpg";
import campusVerandah from "@/assets/campus/NGVerandah.jpg";

/* ─── Animated counter ─── */
const useCounter = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          tick();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
};

/* ─── Data ─── */
const features = [
  { title: "Traditional Excellence", desc: "50+ Years of Combined Teaching Experience rooted in authentic Guru-Shishya Parampara tradition.", icon: Music },
  { title: "Modern Learning", desc: "State-of-the-art Online & Offline Training with interactive tools and personalized feedback.", icon: Lightbulb },
  { title: "Global Recognition", desc: "Students performing and teaching across 30+ countries around the world.", icon: Globe },
];

const courses = [
  { name: "Carnatic Vocal", img: imgVocal },
  { name: "Bharatanatyam", img: imgDanceGroup },
  { name: "Mridangam", img: imgPercussion },
  { name: "Hindustani Vocal", img: imgMaleChorus },
  { name: "Sitar", img: imgSitar },
  { name: "Tabla", img: imgPercussion },
];

const testimonials = [
  { name: "Priya Sharma", text: "Nada Gurukulam transformed my understanding of Carnatic music. The personal attention from Gurus is unmatched.", course: "Carnatic Vocal", img: imgVocal },
  { name: "Arun Krishnan", text: "The Guru-Shishya system here is authentic and life-changing. I found my true musical voice.", course: "Mridangam", img: imgPercussion },
  { name: "Meera Nair", text: "Learning Bharatanatyam here connects you to something timeless. Every class is a spiritual experience.", course: "Bharatanatyam", img: imgDanceGroup },
];

const stats = [
  { value: 500, label: "Students Enrolled", suffix: "+" },
  { value: 14, label: "Expert Gurus", suffix: "" },
  { value: 30, label: "Countries Reached", suffix: "+" },
  { value: 10, label: "Years of Legacy", suffix: "+" },
];

const facultyShowcase = facultyMembers.slice(0, 5);

const campusImages = [
  { src: campusAerial, alt: "Campus Aerial View", className: "col-span-2 row-span-2" },
  { src: campusAmphitheatre, alt: "Amphitheatre", className: "" },
  { src: campusReception, alt: "Reception Hall", className: "" },
  { src: campusVault, alt: "Heritage Passage", className: "" },
  { src: campusVerandah, alt: "Verandah Walkway", className: "col-span-2" },
];

/* ─── Mandala SVG Ornament ─── */
const GoldenMandala = () => (
  <motion.div
    className="absolute pointer-events-none opacity-[0.06]"
    style={{ width: "700px", height: "700px", top: "50%", left: "50%", x: "-50%", y: "-50%" }}
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
  >
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-secondary">
      <circle cx="100" cy="100" r="95" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="100" cy="100" r="75" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="100" cy="100" r="55" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="100" cy="100" r="35" stroke="currentColor" strokeWidth="0.3" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
        <line key={angle} x1="100" y1="5" x2="100" y2="40" stroke="currentColor" strokeWidth="0.4" transform={`rotate(${angle} 100 100)`} />
      ))}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <path key={`p-${angle}`} d="M100 10 L103 45 L100 38 L97 45 Z" fill="currentColor" opacity="0.5" transform={`rotate(${angle} 100 100)`} />
      ))}
    </svg>
  </motion.div>
);

/* ─── Page ─── */
const Index = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div>
      {/* ══════ HERO ══════ */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden grain-overlay">
        <motion.img
          src={imgMusic13}
          alt="Classical performance"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ y: heroY }}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.94)] via-[hsl(0_69%_18%/0.88)] to-[hsl(345_75%_12%/0.80)]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, hsl(43 72% 52% / 0.08) 0%, transparent 60%)" }} />

        {/* Rotating mandala behind text */}
        <GoldenMandala />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${3 + (i % 4) * 2}px`,
                height: `${3 + (i % 4) * 2}px`,
                left: `${5 + i * 8}%`,
                top: `${15 + (i * 19) % 65}%`,
                background: i % 3 === 0 ? "hsl(43 72% 52% / 0.4)" : "hsl(0 0% 100% / 0.2)",
              }}
              animate={{ y: [0, -30, 0], opacity: [0.15, 0.55, 0.15] }}
              transition={{ repeat: Infinity, duration: 3 + i * 0.4, delay: i * 0.25, ease: "easeInOut" }}
            />
          ))}
        </div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="font-devanagari text-3xl md:text-5xl mb-4 text-shimmer-gold">
            रसो वै सः
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="text-primary-foreground/45 italic text-sm md:text-base mb-10 tracking-[0.3em] uppercase">
            "He is the essence of all Rasa"
          </motion.p>

          <motion.h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] font-bold text-primary-foreground leading-tight mb-7" style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}>
            {"Nada Gurukulam".split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.5 + i * 0.04, duration: 0.6, ease: "easeOut" }}
                className="inline-block"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }} className="text-primary-foreground/60 text-lg md:text-xl mb-14 max-w-2xl mx-auto leading-relaxed">
            Traditional Guru-Shishya System meets Modern Education in Indian Classical Music & Dance
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-10 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 h-13 animate-glow-pulse">
              <Link to="/courses"><Sparkles className="h-4 w-4 mr-2" />Explore Courses</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 text-base px-10 backdrop-blur-sm h-13">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-primary-foreground/40 text-[10px] tracking-[0.3em] uppercase">Discover</span>
          <ChevronRight className="h-5 w-5 text-secondary/60 rotate-90" />
        </motion.div>
      </section>

      <SectionDivider />

      {/* ══════ FOUNDER'S MESSAGE ══════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid md:grid-cols-5 gap-10 items-center"
          >
            <div className="md:col-span-2 flex justify-center">
              <div className="relative vignette-gold">
                <motion.div
                  className="w-60 h-60 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl border-2 border-secondary/25"
                  whileInView={{ scale: [0.95, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <img src={founderImg} alt="Sadguru Sri Madhusudan Sai" className="w-full h-full object-cover object-[center_15%]" />
                </motion.div>
                {/* Corner ornaments */}
                <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-secondary rounded-tl-xl" />
                <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-secondary rounded-br-xl" />
                <div className="absolute -top-4 -right-4 w-6 h-6 border-t-2 border-r-2 border-secondary/30 rounded-tr-lg" />
                <div className="absolute -bottom-4 -left-4 w-6 h-6 border-b-2 border-l-2 border-secondary/30 rounded-bl-lg" />
              </div>
            </div>
            <div className="md:col-span-3">
              <span className="text-secondary text-xs tracking-[0.3em] uppercase font-semibold">Founder's Message</span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold mt-2 mb-1">Sadguru Sri Madhusudan Sai</h2>
              <p className="text-muted-foreground text-sm mb-2">Founder, Nada Gurukulam</p>
              <div className="w-12 h-0.5 bg-secondary rounded-full mb-5" />
              <blockquote className="border-l-4 border-secondary/40 pl-5 italic text-foreground/70 leading-relaxed text-sm md:text-base mb-3">
                "nāda brahma, says our scriptures. Sound is divine or 'parameṣṭi', as it is called. And while the seven notes of music have been inspired by various sounds in creation or 'sṛṣṭi', it is the singular privilege of humans or 'vyaṣṭi' to sing and play music. The music that comes from 'parameṣṭi' to 'sṛṣṭi' to 'vyaṣṭi' must take all of us – samaṣṭi back to divinity."
              </blockquote>
              <blockquote className="border-l-4 border-secondary/40 pl-5 italic text-foreground/60 leading-relaxed text-sm">
                "To practise, promote and propagate this rich cultural and spiritual Indian music tradition is the purpose of establishing the Department of Music and Performing Arts at the Sri Sathya Sai University for Human Excellence, so that the paramparā of the divine knowledge of music is seamlessly passed on from the masters to the seekers."
              </blockquote>
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ FEATURES ══════ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-3">
              Why <span className="text-gradient-gold">Nada Gurukulam</span>?
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12 text-sm">
              Blending centuries-old tradition with contemporary pedagogy to create extraordinary artists.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="group"
              >
                <div className="relative h-full rounded-2xl bg-card shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-700 origin-center" />
                  <div className="p-7">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                      <f.icon className="h-7 w-7 text-secondary" />
                    </div>
                    <h3 className="font-serif text-lg font-bold mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ COURSES — Full-bleed name-only cards ══════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-3">Our Programs</h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12 text-sm">
              Comprehensive programs in vocal, instrumental, and dance traditions.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group"
              >
                <Link to="/courses" className="block">
                  <div className="relative h-[320px] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 card-premium">
                    <img src={c.img} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1s]" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.9)] via-[hsl(0_0%_0%/0.2)] to-transparent" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-[hsl(43_72%_52%/0.1)] via-transparent to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-6">
                      <div className="w-8 h-0.5 bg-secondary rounded-full mb-3 group-hover:w-14 transition-all duration-500" />
                      <h3 className="font-serif text-2xl font-bold text-primary-foreground" style={{ textShadow: "0 2px 15px hsl(0 0% 0% / 0.6)" }}>{c.name}</h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-10">
              <Link to="/courses">View All Courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ══════ STATS ══════ */}
      <section className="relative py-20 overflow-hidden">
        <img src={imgConcert} alt="Performance" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.95)] to-[hsl(345_75%_12%/0.92)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => {
              const { count, ref } = useCounter(s.value);
              return (
                <motion.div
                  key={s.label}
                  ref={ref}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className={`text-center relative ${i < 3 ? "md:border-r md:border-primary-foreground/10" : ""}`}
                >
                  <p className="font-serif text-5xl md:text-6xl font-bold text-shimmer-gold mb-2">
                    {count}{s.suffix}
                  </p>
                  <div className="w-8 h-px bg-secondary/30 mx-auto mb-2" />
                  <p className="text-primary-foreground/50 text-xs tracking-[0.2em] uppercase">{s.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ FACULTY ══════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-3">Our Esteemed <span className="text-gradient-gold">Gurus</span></h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12 text-sm">
              Learn from masters who have dedicated their lives to classical arts.
            </p>
          </motion.div>

          {/* Founder — full width prominent card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group mb-6"
          >
            <div className="relative h-[320px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-700">
              <img src={founderImg} alt="Sadguru Sri Madhusudan Sai" className="absolute inset-0 w-full h-full object-cover object-[center_15%] group-hover:scale-105 transition-transform duration-[1s]" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_69%_10%/0.95)] via-[hsl(0_0%_0%/0.2)] to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-7">
                <div className="w-14 h-0.5 bg-secondary mb-3 rounded-full" />
                <h3 className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground mb-1" style={{ textShadow: "0 2px 10px hsl(0 0% 0% / 0.5)" }}>Sadguru Sri Madhusudan Sai</h3>
                <p className="text-secondary text-sm font-semibold">Founder & Visionary</p>
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-secondary/30 transition-all duration-700" />
            </div>
          </motion.div>

          {/* Faculty showcase grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {facultyShowcase.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <Link to={`/faculty/${f.id}`} className="group block">
                  <div className="relative h-[220px] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-700 hover:-translate-y-2">
                    <img src={f.image} alt={f.name} className="absolute inset-0 w-full h-full object-cover object-[center_15%] group-hover:scale-105 transition-transform duration-[1s]" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.88)] to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-3">
                      <h3 className="font-serif text-xs font-bold text-primary-foreground">{f.name}</h3>
                      <p className="text-secondary text-[10px] font-medium">{f.specialization}</p>
                    </div>
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-secondary/30 transition-all duration-700" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8">
              <Link to="/faculty">Meet All Gurus</Link>
            </Button>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ CAMPUS — Bento grid ══════ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Building2 className="h-5 w-5 text-secondary" />
              <h2 className="font-serif text-3xl md:text-4xl font-bold">Our Campus</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              A world-class campus designed to inspire creativity and foster the classical arts.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-3 max-w-5xl mx-auto auto-rows-[180px]">
            {campusImages.map((img, i) => (
              <motion.div
                key={img.alt}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`${img.className} rounded-2xl overflow-hidden shadow-lg group relative cursor-pointer`}
              >
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.75)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                  <span className="text-primary-foreground text-xs font-semibold" style={{ textShadow: "0 1px 4px hsl(0 0% 0% / 0.5)" }}>{img.alt}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ TESTIMONIALS ══════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-3">What Our Students Say</h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12 text-sm">
              Hear from those who have walked the path of musical excellence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="group"
              >
                <div className="relative h-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2">
                  <div className="absolute inset-0">
                    <img src={t.img} alt="" className="w-full h-full object-cover opacity-15 group-hover:opacity-20 transition-opacity duration-500" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-card/95 to-card/85" />
                  <div className="relative p-7">
                    {/* Large decorative quote */}
                    <span className="quote-decorative">"</span>
                    <Quote className="h-7 w-7 text-secondary/25 mb-4 relative z-10" />
                    <p className="text-foreground/80 text-sm leading-relaxed mb-6 italic relative z-10">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary/30">
                        <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.course}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mt-3">
                      {[...Array(5)].map((_, j) => (
                        <motion.div key={j} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + j * 0.1, duration: 0.3 }}>
                          <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA ══════ */}
      <section className="relative py-24 overflow-hidden">
        <img src={imgChorus} alt="Music" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.95)] to-[hsl(345_75%_12%/0.90)]" />
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          style={{ background: "linear-gradient(135deg, hsl(43 72% 52% / 0.12), transparent, hsl(0 69% 33% / 0.12))", backgroundSize: "200% 200%" }}
        />

        {/* Floating musical notes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {["♪", "♫", "♩", "♬"].map((note, i) => (
            <motion.span
              key={i}
              className="absolute text-secondary/15 text-3xl font-serif"
              style={{ left: `${15 + i * 22}%`, top: `${20 + (i * 20) % 50}%` }}
              animate={{ y: [0, -30, 0], rotate: [0, 15, -15, 0], opacity: [0.1, 0.25, 0.1] }}
              transition={{ repeat: Infinity, duration: 4 + i, delay: i * 0.7, ease: "easeInOut" }}
            >
              {note}
            </motion.span>
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <Music className="h-8 w-8 text-secondary/50 mx-auto mb-5" />
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-primary-foreground mb-4 leading-tight">
              Begin Your Musical<br />
              <span className="text-shimmer-gold">Journey Today</span>
            </h2>
            <p className="text-primary-foreground/55 max-w-xl mx-auto mb-12 text-base leading-relaxed">
              Discover the joy of Indian classical arts at Nada Gurukulam. Reach out to learn more.
            </p>
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-14 h-14 shadow-2xl hover:shadow-secondary/30 transition-all hover:-translate-y-1 animate-glow-pulse">
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
