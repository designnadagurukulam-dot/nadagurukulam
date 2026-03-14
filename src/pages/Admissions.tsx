import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { GraduationCap, HelpCircle, ArrowRight, Music, BookOpen, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionDivider from "@/components/SectionDivider";

import imgDancePerf from "@/assets/gallery/NGR6M_9591.webp";
import campusAmphitheatre from "@/assets/campus/NGAmphitheatre.jpg";

const highlights = [
  { icon: Music, title: "Classical Traditions", desc: "Carnatic & Hindustani vocal, instrumental, and dance courses rooted in authentic Guru-Shishya Parampara." },
  { icon: BookOpen, title: "Holistic Curriculum", desc: "A blend of rigorous artistic training, spiritual growth, and academic excellence." },
  { icon: Users, title: "Renowned Gurus", desc: "Learn from masters who have dedicated their lives to preserving and propagating Indian classical arts." },
  { icon: Heart, title: "Values-Driven", desc: "Education anchored in human values — selfless service, devotion, and the pursuit of inner excellence." },
];

const faqs = [
  { q: "Who can join Nada Gurukulam?", a: "Nada Gurukulam welcomes sincere seekers of Indian classical music and dance. Prior musical training may be required for certain programs." },
  { q: "Are online classes available?", a: "Yes, we offer online live sessions for students who cannot attend in person at the campus." },
  { q: "What is the duration of the programs?", a: "Programs range from 2 to 4 years depending on the discipline and level." },
  { q: "Are scholarships available?", a: "Yes, merit-based and need-based scholarships are available for deserving students." },
  { q: "How can I express interest in joining?", a: "Please reach out through our Contact page. Our team will get back to you with all the details." },
];

const Admissions = () => (
  <div>
    {/* ══════ HERO ══════ */}
    <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden grain-overlay">
      <motion.img
        src={campusAmphitheatre}
        alt="Campus Amphitheatre"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.94)] via-[hsl(0_69%_18%/0.88)] to-[hsl(345_75%_12%/0.82)]" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-secondary/25"
            style={{ width: `${3 + i % 3 * 2}px`, height: `${3 + i % 3 * 2}px`, left: `${12 + i * 18}%`, top: `${22 + (i * 14) % 50}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.5, delay: i * 0.3, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="font-devanagari text-xl text-shimmer-gold mb-3">
            शिक्षा परम् धर्मम्
          </motion.p>
          <h1
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-4"
            style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}
          >
            Join Nada Gurukulam
          </h1>
          <p className="text-primary-foreground/55 max-w-2xl mx-auto text-lg">
            Embark on a transformative journey into the sacred world of Indian classical music and dance.
          </p>
        </motion.div>
      </div>
    </section>

    <SectionDivider />

    {/* ══════ WHAT WE OFFER ══════ */}
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-3xl md:text-5xl font-bold text-center mb-4">
          What We <span className="text-gradient-gold">Offer</span>
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-center text-muted-foreground max-w-2xl mx-auto mb-16">
          Nada Gurukulam provides a nurturing environment for serious seekers of Indian classical arts.
        </motion.p>

        <div className="grid sm:grid-cols-2 gap-6">
          {highlights.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="group"
            >
              <div className="relative h-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 bg-card">
                <div className="h-1.5 bg-gradient-to-r from-primary to-secondary" />
                <div className="p-7">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-500"
                  >
                    <h.icon className="h-7 w-7 text-primary-foreground" />
                  </motion.div>
                  <h3 className="font-serif text-xl font-bold mb-3">{h.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{h.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <SectionDivider />

    {/* ══════ SCHOLARSHIPS ══════ */}
    <section className="relative py-28 overflow-hidden">
      <img src={imgDancePerf} alt="Celebration" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.95)] to-[hsl(345_75%_12%/0.90)]" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-secondary/20"
            style={{ width: `${4 + i * 2}px`, height: `${4 + i * 2}px`, left: `${25 + i * 25}%`, top: `${30 + (i * 15) % 40}%` }}
            animate={{ y: [0, -15, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ repeat: Infinity, duration: 3.5 + i, delay: i * 0.5, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-3xl text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <GraduationCap className="h-12 w-12 text-secondary mx-auto mb-6" />
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-primary-foreground">Scholarships & Support</h2>
          <div className="w-16 h-0.5 bg-secondary mx-auto rounded-full mb-6" />
          <p className="text-primary-foreground/65 mb-4 leading-relaxed text-lg">
            Nada Gurukulam is committed to making classical arts education accessible to all deserving students.
          </p>
          <p className="text-primary-foreground/50 leading-relaxed">
            Merit-based and need-based support is available. Reach out to us to learn more about how we can help you on your artistic journey.
          </p>
        </motion.div>
      </div>
    </section>

    {/* ══════ FAQs ══════ */}
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-3xl md:text-5xl font-bold text-center mb-12">
          <HelpCircle className="inline h-8 w-8 mb-1 mr-2 text-secondary" />
          Frequently Asked Questions
        </motion.h2>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <AccordionItem value={`faq-${i}`} className="bg-card rounded-xl border border-border/50 px-6 hover:shadow-lg transition-all duration-500 hover:border-secondary/20">
                <AccordionTrigger className="text-sm font-medium text-left py-5 hover:text-primary transition-colors">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-5">{faq.a}</AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>

    {/* ══════ CTA ══════ */}
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 gradient-maroon" />
      <motion.div
        className="absolute inset-0 opacity-25"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        style={{ background: "linear-gradient(135deg, hsl(43 72% 52% / 0.15), transparent, hsl(43 72% 52% / 0.15))", backgroundSize: "200% 200%" }}
      />

      {/* Floating musical notes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["♪", "♫", "♩"].map((note, i) => (
          <motion.span
            key={i}
            className="absolute text-secondary/12 text-3xl font-serif"
            style={{ left: `${20 + i * 28}%`, top: `${25 + (i * 20) % 45}%` }}
            animate={{ y: [0, -25, 0], rotate: [0, 10, -10, 0], opacity: [0.08, 0.2, 0.08] }}
            transition={{ repeat: Infinity, duration: 4 + i, delay: i * 0.7, ease: "easeInOut" }}
          >
            {note}
          </motion.span>
        ))}
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-primary-foreground mb-4">Interested in Joining?</h2>
          <p className="text-primary-foreground/55 mb-12 max-w-lg mx-auto text-lg">We'd love to hear from you. Reach out to learn more about our programs.</p>
          <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-14 h-14 shadow-2xl hover:shadow-secondary/30 transition-all hover:-translate-y-1 animate-glow-pulse">
            <Link to="/contact">
              <ArrowRight className="h-5 w-5 mr-2" />
              Contact Us for Inquiries
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  </div>
);

export default Admissions;
