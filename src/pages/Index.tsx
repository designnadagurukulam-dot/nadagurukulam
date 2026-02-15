import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Quote, Star, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SectionDivider from "@/components/SectionDivider";

import imgMusic13 from "@/assets/gallery/NGMUSIC-13.webp";
import imgMusic6 from "@/assets/gallery/NGMUSIC-6.webp";
import imgConcert from "@/assets/gallery/NGR6_M1630.webp";
import imgBharatanatyam from "@/assets/gallery/NGZ6R_1931_R.webp";
import imgVocal from "@/assets/gallery/NGZ6R_1512_R.webp";
import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";
import imgChorus from "@/assets/gallery/NGR6M_0933.webp";
import imgDanceGroup from "@/assets/gallery/NGDSC_7428.webp";
import imgMaleChorus from "@/assets/gallery/NGDSC_8160.webp";
import imgSitar from "@/assets/gallery/NGMUSIC-2.webp";
import imgGuruShishya from "@/assets/gallery/NGDANCE-3.webp";
import imgDanceRecital from "@/assets/gallery/NGDANCE-RECITAL-4.webp";

import founderImg from "@/assets/founders/SadguruSriMadhusudanSai.jpg";
import directorImg from "@/assets/founders/SmtRevathiRamachandran.webp";
import campusAerial from "@/assets/campus/NGCampusAerial.jpg";
import campusAmphitheatre from "@/assets/campus/NGAmphitheatre.jpg";
import campusReception from "@/assets/campus/NGReception.jpg";

/* ─── Animated counter hook ─── */
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

/* ─── Section wrapper ─── */
const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.section
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6 }}
    className={className}
  >
    {children}
  </motion.section>
);

/* ─── Data ─── */
const features = [
  { img: imgMusic6, title: "Traditional Excellence", desc: "50+ Years of Combined Teaching Experience rooted in authentic Guru-Shishya Parampara", link: "/faculty" },
  { img: imgMusic13, title: "Modern Learning", desc: "State-of-the-art Online & Offline Training with interactive tools and personalized feedback", link: "/courses" },
  { img: imgConcert, title: "Global Recognition", desc: "Students performing and teaching across 30+ countries around the world", link: "/about" },
];

const courses = [
  { name: "Carnatic Vocal", img: imgVocal, desc: "Master the melodic intricacies of South Indian classical music tradition.", teacher: "Smt. Revathi Ramachandran", level: "Beginner–Advanced" },
  { name: "Bharatanatyam", img: imgDanceGroup, desc: "Learn the ancient temple dance form with grace, precision, and devotion.", teacher: "Ms. Manasvini Ramachandran", level: "Beginner–Advanced" },
  { name: "Mridangam", img: imgPercussion, desc: "Explore the rhythmic heart of Carnatic music with traditional percussion.", teacher: "Sri Venkatesh Kumar", level: "Beginner–Intermediate" },
  { name: "Hindustani Vocal", img: imgMaleChorus, desc: "Dive into the soulful ragas of North Indian classical music.", teacher: "Sri Raghunandan Panshikar", level: "Beginner–Advanced" },
  { name: "Sitar", img: imgSitar, desc: "Discover the divine sound of the sitar in classical tradition.", teacher: "Sri Shashank Subramanyam", level: "Beginner–Advanced" },
  { name: "Tabla", img: imgPercussion, desc: "Master complex rhythmic patterns of Hindustani percussion.", teacher: "Sri Abhishek Mishra", level: "Beginner–Intermediate" },
];

const testimonials = [
  { name: "Priya Sharma", text: "Nada Gurukulam transformed my understanding of Carnatic music. The personal attention from Gurus is unmatched.", course: "Carnatic Vocal" },
  { name: "Arun Krishnan", text: "The Guru-Shishya system here is authentic and life-changing. I found my true musical voice.", course: "Mridangam" },
  { name: "Meera Nair", text: "Learning Bharatanatyam here connects you to something timeless. Every class is a spiritual experience.", course: "Bharatanatyam" },
];

const stats = [
  { value: 500, label: "Students", suffix: "+" },
  { value: 14, label: "Expert Gurus", suffix: "" },
  { value: 30, label: "Countries", suffix: "+" },
  { value: 10, label: "Years", suffix: "+" },
];

const facultyShowcase = [
  { name: "Sadguru Sri Madhusudan Sai", spec: "Founder", img: founderImg },
  { name: "Smt. Revathi Ramachandran", spec: "Director & Carnatic Vocal", img: directorImg },
  { name: "Ms. Manasvini Ramachandran", spec: "Bharatanatyam", img: imgGuruShishya },
  { name: "Sri Venkatesh Kumar", spec: "Mridangam", img: imgPercussion },
];

const campusImages = [
  { src: campusAerial, alt: "Campus Aerial View", span: "col-span-2 row-span-2" },
  { src: campusAmphitheatre, alt: "Amphitheatre", span: "col-span-1" },
  { src: campusReception, alt: "Reception Hall", span: "col-span-1" },
];

/* ─── Page ─── */
const Index = () => {
  return (
    <div>
      {/* ══════ Hero ══════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <img
          src={imgMusic13}
          alt="Classical performance"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_15%/0.92)] via-[hsl(0_69%_20%/0.85)] to-[hsl(345_75%_15%/0.8)]" />
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-10 w-2 h-2 rounded-full bg-secondary/30 animate-float" style={{ animationDelay: "0s" }} />
          <div className="absolute top-1/3 right-20 w-3 h-3 rounded-full bg-secondary/20 animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 rounded-full bg-secondary/25 animate-float" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 right-1/3 w-2 h-2 rounded-full bg-secondary/20 animate-float" style={{ animationDelay: "0.5s" }} />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-devanagari text-3xl md:text-5xl text-gradient-gold mb-4"
          >
            रसो वै सः
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-primary-foreground/60 italic text-sm md:text-base mb-8 tracking-wider"
          >
            "He is the essence of all Rasa"
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground leading-tight mb-4"
            style={{ textShadow: "0 4px 30px hsl(0 0% 0% / 0.3)" }}
          >
            Nada Gurukulam
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-primary-foreground/75 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Traditional Guru-Shishya System meets Modern Education in Indian Classical Music & Dance
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              <Link to="/courses">Explore Courses</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8 backdrop-blur-sm">
              <Link to="/admissions">Apply Now</Link>
            </Button>
          </motion.div>
        </div>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronRight className="h-6 w-6 text-gold rotate-90" />
        </motion.div>
      </section>

      <SectionDivider />

      {/* ══════ Features ══════ */}
      <Section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">Why Nada Gurukulam?</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-14">
            Blending centuries-old tradition with contemporary pedagogy to create extraordinary artists.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <Card className="text-center h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 group overflow-hidden hover:-translate-y-1">
                  <div className="h-52 img-zoom relative">
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  </div>
                  <CardContent className="pt-6 pb-8 px-6 -mt-10 relative z-10">
                    <h3 className="font-serif text-xl font-semibold mb-3">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{f.desc}</p>
                    <Link to={f.link} className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn More <ChevronRight className="h-3 w-3" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <SectionDivider />

      {/* ══════ Courses Overview ══════ */}
      <Section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">Our Programs</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-14">
            Comprehensive programs in vocal, instrumental, and dance traditions.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-border/50 hover:-translate-y-1">
                  <div className="h-44 img-zoom relative">
                    <img src={c.img} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <Button asChild size="sm" variant="secondary" className="shadow-lg">
                        <Link to="/courses">Learn More</Link>
                      </Button>
                    </div>
                    <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-secondary/90 text-secondary-foreground backdrop-blur-sm">{c.level}</span>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-serif text-lg font-semibold mb-1">{c.name}</h3>
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{c.desc}</p>
                    <p className="text-xs text-muted-foreground">Instructor: <span className="font-medium text-foreground">{c.teacher}</span></p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Link to="/courses">View All Courses</Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* ══════ Stats ══════ */}
      <section className="relative py-24 overflow-hidden">
        <img
          src={imgConcert}
          alt="Performance"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_15%/0.92)] to-[hsl(345_75%_15%/0.88)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => {
              const { count, ref } = useCounter(s.value);
              return (
                <div key={s.label} ref={ref} className="text-center">
                  <p className="font-serif text-5xl md:text-6xl font-bold text-gradient-gold" style={{ WebkitTextFillColor: "unset", color: "hsl(43 72% 52%)" }}>
                    {count}{s.suffix}
                  </p>
                  <p className="text-primary-foreground/60 mt-2 text-sm tracking-wider uppercase">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ Faculty Showcase ══════ */}
      <Section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">Our Esteemed Gurus</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-14">
            Learn from masters who have dedicated their lives to classical arts.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {facultyShowcase.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="text-center group"
              >
                <div className="w-36 h-36 md:w-44 md:h-44 mx-auto rounded-full overflow-hidden golden-frame mb-5 group-hover:animate-glow-pulse transition-all duration-500">
                  <img src={f.img} alt={f.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                </div>
                <h3 className="font-serif text-sm md:text-base font-semibold">{f.name}</h3>
                <p className="text-xs text-secondary mt-0.5">{f.spec}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Link to="/faculty">Meet All Gurus</Link>
            </Button>
          </div>
        </div>
      </Section>

      <SectionDivider />

      {/* ══════ Campus ══════ */}
      <Section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-6 w-6 text-secondary" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center">Our Campus</h2>
          </div>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-14">
            A world-class campus designed to inspire creativity and foster the classical arts.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {campusImages.map((img, i) => (
              <motion.div
                key={img.alt}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`${img.span} rounded-xl overflow-hidden shadow-lg img-zoom group`}
              >
                <div className="relative w-full h-full min-h-[200px]">
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.5)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-primary-foreground text-sm font-medium">{img.alt}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <SectionDivider />

      {/* ══════ Testimonials ══════ */}
      <Section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">What Our Students Say</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-14">
            Hear from those who have walked the path of musical excellence at Nada Gurukulam.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <Card className="h-full border-none shadow-md hover:shadow-xl transition-all duration-500 bg-card relative overflow-hidden hover:-translate-y-1">
                  <div className="absolute top-4 right-4 text-secondary/10">
                    <Quote className="h-16 w-16" />
                  </div>
                  <CardContent className="p-6 relative z-10">
                    <Quote className="h-8 w-8 text-secondary/50 mb-4" />
                    <p className="text-foreground/80 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.course}</p>
                    </div>
                    <div className="flex gap-0.5 mt-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-secondary text-secondary" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════ CTA ══════ */}
      <section className="relative py-28 overflow-hidden">
        <img
          src={imgChorus}
          alt="Music"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_15%/0.92)] to-[hsl(345_75%_15%/0.88)]" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground mb-6"
          >
            Begin Your Musical Journey Today
          </motion.h2>
          <p className="text-primary-foreground/70 max-w-xl mx-auto mb-10 text-lg leading-relaxed">
            Join hundreds of students who have discovered the joy of Indian classical arts at Nada Gurukulam.
          </p>
          <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-12 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5">
            <Link to="/admissions">Apply for Admission</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
