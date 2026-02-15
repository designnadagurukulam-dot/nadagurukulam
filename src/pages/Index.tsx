import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Monitor, Globe, ChevronRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  { icon: Music, title: "Traditional Excellence", desc: "50+ Years of Combined Teaching Experience rooted in authentic Guru-Shishya Parampara", link: "/faculty" },
  { icon: Monitor, title: "Modern Learning", desc: "State-of-the-art Online & Offline Training with interactive tools and personalized feedback", link: "/courses" },
  { icon: Globe, title: "Global Recognition", desc: "Students performing and teaching across 30+ countries around the world", link: "/about" },
];

const courses = [
  { name: "Carnatic Vocal", desc: "Master the melodic intricacies of South Indian classical music tradition.", teacher: "Smt. Revathi Ramachandran" },
  { name: "Bharatanatyam", desc: "Learn the ancient temple dance form with grace, precision, and devotion.", teacher: "Ms. Manasvini Ramachandran" },
  { name: "Mridangam", desc: "Explore the rhythmic heart of Carnatic music with traditional percussion.", teacher: "Sri Venkatesh Kumar" },
  { name: "Hindustani Vocal", desc: "Dive into the soulful ragas of North Indian classical music.", teacher: "Sri Raghunandan Panshikar" },
  { name: "Flute", desc: "Discover the divine sound of the bamboo flute in classical tradition.", teacher: "Sri Shashank Subramanyam" },
  { name: "Tabla", desc: "Master complex rhythmic patterns of Hindustani percussion.", teacher: "Sri Abhishek Mishra" },
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

/* ─── Page ─── */
const Index = () => {
  return (
    <div>
      {/* ══════ Hero ══════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center gradient-maroon overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=1920')] bg-cover bg-center opacity-15" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-devanagari text-2xl md:text-4xl text-gold mb-4"
          >
            रसो वै सः
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-primary-foreground/70 italic text-sm md:text-base mb-8"
          >
            "He is the essence of all Rasa"
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-4"
          >
            Nada Gurukulam
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-primary-foreground/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto"
          >
            Traditional Guru-Shishya System meets Modern Education in Indian Classical Music & Dance
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-8">
              <Link to="/courses">Explore Courses</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8">
              <Link to="/admissions">Apply Now</Link>
            </Button>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="h-6 w-6 text-primary-foreground/50 rotate-90" />
        </div>
      </section>

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
                <Card className="text-center h-full border-none shadow-lg hover:shadow-xl transition-shadow bg-card">
                  <CardContent className="pt-10 pb-8 px-6">
                    <div className="mx-auto w-16 h-16 rounded-full gradient-maroon flex items-center justify-center mb-6">
                      <f.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold mb-3">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{f.desc}</p>
                    <Link to={f.link} className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1">
                      Learn More <ChevronRight className="h-3 w-3" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

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
                <Card className="overflow-hidden group hover:shadow-xl transition-all border-border/50">
                  <div className="h-44 gradient-maroon flex items-center justify-center">
                    <Music className="h-12 w-12 text-primary-foreground/40 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-serif text-lg font-semibold mb-1">{c.name}</h3>
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{c.desc}</p>
                    <p className="text-xs text-muted-foreground">Instructor: <span className="font-medium text-foreground">{c.teacher}</span></p>
                    <Button asChild variant="link" className="px-0 mt-2 text-primary">
                      <Link to="/courses">Learn More →</Link>
                    </Button>
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
      <section className="py-16 gradient-maroon">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => {
              const { count, ref } = useCounter(s.value);
              return (
                <div key={s.label} ref={ref} className="text-center">
                  <p className="font-serif text-4xl md:text-5xl font-bold text-secondary">
                    {count}{s.suffix}
                  </p>
                  <p className="text-primary-foreground/70 mt-1 text-sm">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
                <Card className="h-full border-none shadow-md bg-card">
                  <CardContent className="p-6">
                    <Quote className="h-8 w-8 text-secondary/50 mb-4" />
                    <p className="text-foreground/80 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-maroon flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.course}</p>
                      </div>
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
      <Section className="py-20 gradient-maroon">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Begin Your Musical Journey Today
          </h2>
          <p className="text-primary-foreground/70 max-w-xl mx-auto mb-8 text-lg">
            Join hundreds of students who have discovered the joy of Indian classical arts at Nada Gurukulam.
          </p>
          <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-10">
            <Link to="/admissions">Apply for Admission</Link>
          </Button>
        </div>
      </Section>
    </div>
  );
};

export default Index;
