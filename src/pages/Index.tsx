import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Quote, Star, Building2, Music, Sparkles, Lightbulb, Globe, ArrowRight, CalendarDays, MapPin, Clock } from "lucide-react";
import { format, isPast } from "date-fns";
import { Button } from "@/components/ui/button";
import SectionDivider from "@/components/SectionDivider";
import logo from "@/assets/logo.png";

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
import { getCourseImage } from "@/lib/courseImages";
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

/* ─── Auto-rotate testimonials ─── */
const useAutoRotate = (length: number, interval = 5000) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % length), interval);
    return () => clearInterval(timer);
  }, [length, interval]);
  return index;
};

/* ─── Data ─── */
const features = [
  { title: "Traditional Excellence", desc: "50+ Years of Combined Teaching Experience rooted in authentic Guru-Shishya Parampara tradition.", icon: Music },
  { title: "Modern Learning", desc: "State-of-the-art Online & Offline Training with interactive tools and personalized feedback.", icon: Lightbulb },
  { title: "Global Recognition", desc: "Students performing and teaching across 30+ countries around the world.", icon: Globe },
];

// Static courses removed — fetched from DB in component

const testimonials = [
  { name: "Priya Sharma", text: "Nada Gurukulam transformed my understanding of Carnatic music. The personal attention from Gurus is unmatched.", course: "Carnatic Vocal" },
  { name: "Arun Krishnan", text: "The Guru-Shishya system here is authentic and life-changing. I found my true musical voice.", course: "Mridangam" },
  { name: "Meera Nair", text: "Learning Bharatanatyam here connects you to something timeless. Every class is a spiritual experience.", course: "Bharatanatyam" },
];

const stats = [
  { value: 500, label: "Students Enrolled", suffix: "+" },
  { value: 14, label: "Expert Gurus", suffix: "" },
  { value: 30, label: "Countries Reached", suffix: "+" },
  { value: 10, label: "Years of Legacy", suffix: "+" },
];

const facultyShowcase = facultyMembers.slice(0, 8);

const campusImages = [
  { src: campusAerial, alt: "Campus Aerial View", className: "col-span-2 row-span-2" },
  { src: campusAmphitheatre, alt: "Amphitheatre", className: "" },
  { src: campusReception, alt: "Reception Hall", className: "" },
  { src: campusVault, alt: "Heritage Passage", className: "" },
  { src: campusVerandah, alt: "Verandah Walkway", className: "col-span-2" },
];

const marqueeItems = [
  "Carnatic Vocal", "✦", "Bharatanatyam", "✦", "Mridangam", "✦", "Hindustani Vocal", "✦",
  "Tabla", "✦", "Sitar", "✦", "Guru-Shishya Parampara", "✦", "नाद ब्रह्म", "✦",
  "रसो वै सः", "✦", "Classical Dance", "✦", "Indian Heritage", "✦",
];

/* ─── Mandala SVG Ornament ─── */
const GoldenMandala = () => (
  <motion.div
    className="absolute pointer-events-none opacity-[0.07]"
    style={{ width: "900px", height: "900px", top: "50%", left: "50%", x: "-50%", y: "-50%" }}
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

/* ─── Floating golden ornamental shapes ─── */
const FloatingOrnament = ({ style, delay }: { style: React.CSSProperties; delay: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={style}
    animate={{ y: [0, -25, 0], rotate: [0, 8, -8, 0] }}
    transition={{ repeat: Infinity, duration: 6, delay, ease: "easeInOut" }}
  >
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <path d="M30 2 L34 26 L30 20 L26 26 Z" fill="hsl(33 62% 58%)" opacity="0.25" />
      <path d="M30 58 L26 34 L30 40 L34 34 Z" fill="hsl(33 62% 58%)" opacity="0.25" />
      <path d="M2 30 L26 26 L20 30 L26 34 Z" fill="hsl(33 62% 58%)" opacity="0.25" />
      <path d="M58 30 L34 34 L40 30 L34 26 Z" fill="hsl(33 62% 58%)" opacity="0.25" />
      <circle cx="30" cy="30" r="5" fill="hsl(33 62% 58%)" opacity="0.3" />
    </svg>
  </motion.div>
);

/* ─── Page ─── */
const Index = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  const { data: dbCourses = [] } = useQuery({
    queryKey: ["homepage-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, slug, image_url, thumbnail_url")
        .eq("status", "approved")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const activeTestimonial = useAutoRotate(testimonials.length);

  return (
    <div>
      {/* ══════ HERO — Full Viewport Cinematic ══════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.img
          src={imgMusic13}
          alt="Classical performance"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ y: heroY }}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(358_68%_6%/0.92)] via-[hsl(358_68%_12%/0.85)] to-[hsl(358_68%_8%/0.95)]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, hsl(33 62% 58% / 0.1) 0%, transparent 55%)" }} />

        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />

        {/* Rotating mandala */}
        <GoldenMandala />

        {/* Floating ornamental shapes */}
        <FloatingOrnament style={{ top: "15%", left: "8%" }} delay={0} />
        <FloatingOrnament style={{ top: "25%", right: "10%" }} delay={2} />
        <FloatingOrnament style={{ bottom: "20%", left: "15%" }} delay={4} />

        {/* Animated golden radiating lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <motion.div
              key={angle}
              className="absolute top-1/2 left-1/2 origin-left"
              style={{
                width: "600px", height: "1px",
                background: "linear-gradient(90deg, hsl(33 62% 58% / 0.15), transparent)",
                transform: `rotate(${angle}deg)`,
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1 + angle * 0.002, duration: 2, ease: "easeOut" }}
            />
          ))}
        </div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Sanskrit in golden pill badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-border bg-background/95 backdrop-blur-2xl shadow-xl mb-8"
          >
            <img src={logo} alt="Nada Gurukulam" className="h-12 md:h-16 w-auto object-contain" />
          </motion.div>

          <motion.h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-extrabold text-primary-foreground leading-[0.95] mb-8" style={{ textShadow: "0 6px 60px hsl(0 0% 0% / 0.6)" }}>
            {"Nada".split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 60, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.4 + i * 0.06, duration: 0.7, ease: "easeOut" }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
            <br className="sm:hidden" />
            <span className="inline-block sm:ml-6">
              {"Gurukulam".split("").map((char, i) => (
                <motion.span
                  key={`g-${i}`}
                  initial={{ opacity: 0, y: 60, filter: "blur(12px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.7 + i * 0.05, duration: 0.7, ease: "easeOut" }}
                  className="inline-block text-outline-gold"
                  style={{ WebkitTextStroke: "2px hsl(33 62% 58% / 0.6)", color: "transparent" }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }} className="text-primary-foreground/50 text-base sm:text-lg md:text-xl mb-14 max-w-2xl mx-auto leading-relaxed tracking-wide">
            Traditional Guru-Shishya System meets Modern Education in Indian Classical Music & Dance
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-12 shadow-2xl hover:shadow-secondary/30 transition-all hover:-translate-y-1 h-14 animate-glow-pulse font-semibold">
              <Link to="/courses"><Sparkles className="h-4 w-4 mr-2" />Explore Courses</Link>
            </Button>
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 text-base px-12 h-14 font-medium shadow-lg">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator with pulse ring */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
          <span className="text-primary-foreground/30 text-[10px] tracking-[0.4em] uppercase font-medium">Scroll</span>
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full border border-secondary/30"
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              style={{ width: 36, height: 36, top: -6, left: -6 }}
            />
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
              <ChevronDown className="h-6 w-6 text-secondary/60" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════ MARQUEE STRIPS ══════ */}
      <div className="bg-primary py-3 overflow-hidden">
        <div className="marquee-strip">
          <div className="marquee-content">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className={`mx-4 text-sm font-medium whitespace-nowrap ${item === "✦" ? "text-secondary text-xs" : "text-primary-foreground/80 font-serif"}`}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-primary/95 py-2.5 overflow-hidden border-t border-primary-foreground/5">
        <div className="marquee-strip">
          <div className="marquee-content-reverse">
            {[...marqueeItems.reverse(), ...marqueeItems].map((item, i) => (
              <span key={i} className={`mx-4 text-xs whitespace-nowrap ${item === "✦" ? "text-secondary/60 text-[10px]" : "text-primary-foreground/50 tracking-widest uppercase"}`}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <SectionDivider />

      {/* ══════ FOUNDER'S MESSAGE ══════ */}
      <section className="py-24 bg-background relative golden-sweep">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-5 gap-12 items-center"
          >
            <div className="md:col-span-2 flex justify-center">
              <div className="relative vignette-gold">
                <motion.div
                  className="w-64 h-72 md:w-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl golden-frame"
                  whileInView={{ scale: [0.92, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                >
                  <img src={founderImg} alt="Sadguru Sri Madhusudan Sai" className="w-full h-full object-cover object-[center_15%]" />
                </motion.div>
                {/* Large decorative quote marks */}
                <motion.span
                  className="absolute -top-8 -left-6 font-serif text-[8rem] leading-none text-secondary/15 pointer-events-none select-none"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  "
                </motion.span>
              </div>
            </div>
            <div className="md:col-span-3">
              <motion.div
                className="card-glass-gold rounded-2xl p-8 md:p-10 relative"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.7 }}
              >
                <span className="text-secondary text-xs tracking-[0.3em] uppercase font-semibold">Founder's Message</span>
                <h2 className="font-serif text-2xl md:text-3xl font-bold mt-3 mb-1">Sadguru Sri Madhusudan Sai</h2>
                <p className="text-muted-foreground text-sm mb-3">Founder, Nada Gurukulam</p>
                <div className="w-16 h-0.5 bg-secondary rounded-full mb-6" />
                <blockquote className="border-l-4 border-secondary/40 pl-5 italic text-foreground/75 leading-relaxed text-sm md:text-base mb-4">
                  "nāda brahma, says our scriptures. Sound is divine or 'parameṣṭi', as it is called. And while the seven notes of music have been inspired by various sounds in creation or 'sṛṣṭi', it is the singular privilege of humans or 'vyaṣṭi' to sing and play music."
                </blockquote>
                <blockquote className="border-l-4 border-secondary/40 pl-5 italic text-foreground/55 leading-relaxed text-sm">
                  "To practise, promote and propagate this rich cultural and spiritual Indian music tradition is the purpose of establishing the Department of Music and Performing Arts at the Sri Sathya Sai University for Human Excellence."
                </blockquote>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ FEATURES ══════ */}
      <section className="py-24 section-glass relative">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-4xl md:text-5xl font-extrabold text-center mb-3">
              Why <span className="text-gradient-gold">Nada Gurukulam</span>?
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-16 text-sm tracking-wide">
              Blending centuries-old tradition with contemporary pedagogy to create extraordinary artists.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.7 }}
                className="group"
              >
                <div className="relative h-full rounded-2xl bg-card shadow-xl hover:shadow-2xl transition-all duration-700 hover-magnetic overflow-hidden">
                  {/* Gold line at bottom on hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-700 origin-center" />
                  <div className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary/25 to-secondary/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-secondary/20 transition-all duration-500">
                      <f.icon className="h-8 w-8 text-secondary" />
                    </div>
                    <h3 className="font-serif text-xl font-bold mb-3">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ COURSES — Horizontal auto-scroll carousel ══════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-4xl md:text-5xl font-extrabold text-center mb-3">Our Courses</h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-16 text-sm tracking-wide">
              Comprehensive courses in vocal, instrumental, and dance traditions.
            </p>
          </motion.div>
        </div>

        {/* Horizontal scrolling strip */}
        <div className="relative overflow-hidden">
          <div className="marquee-strip">
            <div className="marquee-content" style={{ animationDuration: "40s" }}>
              {[...dbCourses, ...dbCourses].map((c: any, i: number) => (
                <Link to={`/programs/${c.slug || c.id}`} key={i} className="group inline-block mx-3 flex-shrink-0">
                  <div className="relative w-[280px] sm:w-[320px] h-[400px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-700 card-premium">
                    <img src={getCourseImage(c)} alt={c.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s]" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.92)] via-[hsl(0_0%_0%/0.3)] to-transparent" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-[hsl(33_62%_58%/0.12)] via-transparent to-transparent" />
                    {/* Golden corner ornaments */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-secondary/40 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-20 right-4 w-8 h-8 border-b-2 border-r-2 border-secondary/40 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 inset-x-0 p-6">
                      <div className="w-10 h-0.5 bg-secondary rounded-full mb-3 group-hover:w-16 transition-all duration-500" />
                      <h3 className="font-serif text-2xl font-bold text-primary-foreground" style={{ textShadow: "0 3px 20px hsl(0 0% 0% / 0.7)" }}>{c.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        </div>

        <div className="text-center mt-14">
          <Button asChild size="lg" className="border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground px-12 h-13 font-semibold transition-all">
            <Link to="/courses">View All Courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* ══════ STATS ══════ */}
      <section className="relative py-24 overflow-hidden">
        <img src={imgConcert} alt="Performance" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(358_68%_6%/0.96)] to-[hsl(358_68%_8%/0.94)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
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
                  <p className="font-serif text-6xl md:text-7xl font-extrabold text-shimmer-gold mb-3">
                    {count}{s.suffix}
                  </p>
                  <div className="w-12 h-0.5 bg-secondary/40 mx-auto mb-3" />
                  <p className="text-primary-foreground/50 text-xs tracking-[0.25em] uppercase">{s.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ FACULTY — Auto-scrolling strip ══════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-4xl md:text-5xl font-extrabold text-center mb-3">Our Esteemed <span className="text-gradient-gold">Gurus</span></h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-16 text-sm tracking-wide">
              Learn from masters who have dedicated their lives to classical arts.
            </p>
          </motion.div>

          {/* Founder card — full width cinematic */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="group mb-8"
          >
            <div className="relative h-[350px] md:h-[400px] rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700">
              <img src={founderImg} alt="Sadguru Sri Madhusudan Sai" className="absolute inset-0 w-full h-full object-cover object-[center_15%] group-hover:scale-105 transition-transform duration-[1.2s]" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_69%_8%/0.97)] via-[hsl(0_0%_0%/0.3)] to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-8 md:p-10">
                <div className="w-16 h-0.5 bg-secondary mb-4 rounded-full" />
                <h3 className="font-serif text-3xl md:text-4xl font-extrabold text-primary-foreground mb-2" style={{ textShadow: "0 3px 15px hsl(0 0% 0% / 0.6)" }}>Sadguru Sri Madhusudan Sai</h3>
                <p className="text-secondary text-sm font-semibold tracking-wider uppercase">Founder & Visionary</p>
              </div>
              <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-secondary/25 transition-all duration-700" />
            </div>
          </motion.div>

          {/* Auto-scrolling faculty strip */}
          <div className="relative overflow-hidden">
            <div className="marquee-strip">
              <div className="marquee-content" style={{ animationDuration: "35s" }}>
                {[...facultyShowcase, ...facultyShowcase].map((f, i) => (
                  <Link to={`/faculty/${f.id}`} key={i} className="group inline-block mx-3 flex-shrink-0 text-center">
                    <div className="w-36 md:w-44">
                      <div className="w-28 h-28 md:w-36 md:h-36 mx-auto rounded-full overflow-hidden portrait-gold-ring mb-4">
                        <img src={f.image} alt={f.name} className="w-full h-full object-cover object-[center_15%]" loading="lazy" />
                      </div>
                      <h3 className="font-serif text-sm font-bold text-foreground leading-tight">{f.name}</h3>
                      <p className="text-secondary text-[11px] font-medium mt-1">{f.specialization}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          </div>

          <div className="text-center mt-14">
            <Button asChild variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-10 h-12 font-semibold">
              <Link to="/faculty">Meet All Gurus <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ CAMPUS — Bento grid ══════ */}
      <section className="py-24 section-glass">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Building2 className="h-6 w-6 text-secondary" />
              <h2 className="font-serif text-4xl md:text-5xl font-extrabold">Our Campus</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm tracking-wide">
              A world-class campus designed to inspire creativity and foster the classical arts.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto auto-rows-[140px] md:auto-rows-[220px]">
            {campusImages.map((img, i) => (
              <motion.div
                key={img.alt}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`${img.className} rounded-2xl overflow-hidden shadow-xl group relative cursor-pointer`}
              >
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.8)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                  <span className="text-primary-foreground text-sm font-serif font-semibold" style={{ textShadow: "0 2px 8px hsl(0 0% 0% / 0.6)" }}>{img.alt}</span>
                </div>
                {/* Golden frame on hover */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-secondary/30 transition-all duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ TESTIMONIALS — Single rotating large card ══════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-4xl md:text-5xl font-extrabold text-center mb-3">Student Voices</h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-16 text-sm tracking-wide">
              Hear from those who have walked the path of musical excellence.
            </p>
          </motion.div>

          <div className="relative min-h-[280px]">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: i === activeTestimonial ? 1 : 0, scale: i === activeTestimonial ? 1 : 0.95 }}
                transition={{ duration: 0.6 }}
                className={`absolute inset-0 ${i === activeTestimonial ? "pointer-events-auto" : "pointer-events-none"}`}
              >
                <div className="card-glass-gold rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                  {/* Large decorative quote marks */}
                  <span className="absolute top-4 left-8 font-serif text-[10rem] leading-none text-secondary/8 pointer-events-none select-none">"</span>
                  <div className="relative z-10">
                    <Quote className="h-8 w-8 text-secondary/30 mx-auto mb-6" />
                    <p className="text-foreground/80 text-lg md:text-xl leading-relaxed italic mb-8 max-w-2xl mx-auto">"{t.text}"</p>
                    <div className="flex items-center justify-center gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-secondary text-secondary" />
                      ))}
                    </div>
                    <p className="font-serif font-bold text-lg">{t.name}</p>
                    <p className="text-secondary text-sm font-medium">{t.course}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === activeTestimonial ? "bg-secondary w-6" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA — Full viewport dramatic ══════ */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <img src={imgChorus} alt="Music" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(358_68%_6%/0.96)] to-[hsl(358_68%_8%/0.93)]" />
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          style={{ background: "linear-gradient(135deg, hsl(33 62% 58% / 0.12), transparent, hsl(358 68% 28% / 0.12))", backgroundSize: "200% 200%" }}
        />

        {/* Floating musical notes — larger and more visible */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {["♪", "♫", "♩", "♬", "♪", "♫"].map((note, i) => (
            <motion.span
              key={i}
              className="absolute text-secondary/20 font-serif"
              style={{ fontSize: `${2 + i * 0.5}rem`, left: `${10 + i * 15}%`, top: `${15 + (i * 18) % 60}%` }}
              animate={{ y: [0, -40, 0], rotate: [0, 20, -20, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 5 + i, delay: i * 0.5, ease: "easeInOut" }}
            >
              {note}
            </motion.span>
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <Music className="h-10 w-10 text-secondary/40 mx-auto mb-6" />
            <h2 className="font-serif text-5xl md:text-7xl font-extrabold text-primary-foreground mb-5 leading-tight">
              Begin Your Musical<br />
              <span className="text-shimmer-gold">Journey Today</span>
            </h2>
            <p className="text-primary-foreground/50 max-w-xl mx-auto mb-14 text-base md:text-lg leading-relaxed">
              Discover the joy of Indian classical arts at Nada Gurukulam. Reach out to learn more.
            </p>
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-16 h-16 shadow-2xl hover:shadow-secondary/30 transition-all hover:-translate-y-1 animate-glow-pulse font-bold">
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
