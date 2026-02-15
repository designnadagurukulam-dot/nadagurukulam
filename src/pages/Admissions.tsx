import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle, GraduationCap, HelpCircle, IndianRupee, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionDivider from "@/components/SectionDivider";

import imgDancePerf from "@/assets/gallery/NGR6M_9591.webp";
import campusAmphitheatre from "@/assets/campus/NGAmphitheatre.jpg";

const steps = [
  { num: 1, title: "Create Account", desc: "Register on our portal with your basic details." },
  { num: 2, title: "Fill Application", desc: "Complete the detailed application form for your chosen program." },
  { num: 3, title: "Upload Documents", desc: "Submit required documents and any performance videos." },
  { num: 4, title: "Pay Application Fee", desc: "Complete the one-time application fee payment." },
  { num: 5, title: "Audition / Interview", desc: "Attend an online or in-person audition with our faculty." },
  { num: 6, title: "Admission Confirmation", desc: "Receive your admission decision and confirm enrollment." },
];

const faqs = [
  { q: "What is the minimum age for admission?", a: "Students of all ages are welcome. For children under 12, parental consent is required." },
  { q: "Is prior musical training required?", a: "Not for beginner-level programs. Intermediate and advanced programs require prior training and may include an audition." },
  { q: "Are online classes available?", a: "Yes, we offer online live sessions for students who cannot attend in person." },
  { q: "What is the duration of the programs?", a: "Programs range from 2 to 4 years depending on the discipline and level." },
  { q: "Are scholarships available?", a: "Yes, merit-based and need-based scholarships are available." },
  { q: "Can I enroll in multiple courses?", a: "Students may enroll in up to two programs simultaneously, subject to schedule compatibility." },
];

const Admissions = () => (
  <div>
    {/* ══════ HERO ══════ */}
    <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
      <img src={campusAmphitheatre} alt="Campus Amphitheatre" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.94)] via-[hsl(0_69%_18%/0.88)] to-[hsl(345_75%_12%/0.82)]" />
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-4"
          style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}
        >
          Admissions
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-primary-foreground/60 max-w-2xl mx-auto"
        >
          Begin your journey into Indian classical arts. Applications are now open for 2025–26.
        </motion.p>
      </div>
    </section>

    <SectionDivider />

    {/* ══════ APPLICATION TIMELINE ══════ */}
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-3xl md:text-5xl font-bold text-center mb-16">
          Application <span className="text-gradient-gold">Process</span>
        </motion.h2>

        {/* Horizontal timeline on desktop */}
        <div className="hidden md:block relative">
          {/* Connecting line */}
          <div className="absolute top-8 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, hsl(43 72% 52% / 0.3), hsl(43 72% 52% / 0.6), hsl(43 72% 52% / 0.3))" }} />
          <div className="grid grid-cols-6 gap-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center group"
              >
                <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center text-secondary-foreground font-bold text-xl mx-auto mb-4 shadow-lg shadow-secondary/20 group-hover:scale-110 transition-transform duration-300 relative z-10">
                  {s.num}
                </div>
                <h3 className="font-serif font-bold text-sm mb-1">{s.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Vertical timeline on mobile */}
        <div className="md:hidden relative">
          <div className="absolute left-8 top-0 bottom-0 w-[2px]" style={{ background: "linear-gradient(180deg, hsl(43 72% 52% / 0.6), hsl(43 72% 52% / 0.2))" }} />
          <div className="space-y-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-start gap-6 pl-2"
              >
                <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-secondary-foreground font-bold shrink-0 shadow-lg shadow-secondary/20 relative z-10">{s.num}</div>
                <div className="card-glass-gold rounded-xl p-4 flex-1">
                  <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                  <p className="text-muted-foreground text-xs">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <SectionDivider />

    {/* ══════ ELIGIBILITY ══════ */}
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-3xl md:text-5xl font-bold text-center mb-12">
          Eligibility Criteria
        </motion.h2>
        <div className="space-y-3">
          {[
            "Open to students of all nationalities and backgrounds",
            "Basic understanding of music/dance preferred for intermediate programs",
            "Audition required for advanced programs",
            "Proficiency in English or Hindi for instruction",
            "Performance video submission for online applicants",
          ].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-4 card-glass-gold p-5 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/80">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ══════ FEE STRUCTURE ══════ */}
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-3xl md:text-5xl font-bold text-center mb-12">
          <IndianRupee className="inline h-8 w-8 mb-1" /> Fee Structure
        </motion.h2>
        <div className="rounded-2xl overflow-hidden shadow-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="gradient-gold">
                <th className="text-left p-5 font-semibold text-secondary-foreground">Fee Component</th>
                <th className="text-right p-5 font-semibold text-secondary-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Application Fee", "₹500"],
                ["Tuition Fee (per semester)", "₹15,000"],
                ["Examination Fee", "₹2,000"],
                ["Library & Resources", "₹1,000"],
              ].map(([label, amt], i) => (
                <tr key={label} className={`${i % 2 === 0 ? "bg-card" : "bg-muted/20"} hover:bg-secondary/5 transition-colors`}>
                  <td className="p-5 text-foreground/80">{label}</td>
                  <td className="p-5 text-right font-bold text-lg">{amt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">* Fees are subject to revision. Installment plans available.</p>
      </div>
    </section>

    <SectionDivider />

    {/* ══════ SCHOLARSHIPS ══════ */}
    <section className="relative py-28 overflow-hidden">
      <img src={imgDancePerf} alt="Celebration" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.95)] to-[hsl(345_75%_12%/0.90)]" />
      <div className="relative z-10 container mx-auto px-4 max-w-3xl text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <GraduationCap className="h-12 w-12 text-secondary mx-auto mb-6" />
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-primary-foreground">Scholarships & Financial Aid</h2>
          <div className="w-16 h-0.5 bg-secondary mx-auto rounded-full mb-6" />
          <p className="text-primary-foreground/65 mb-8 leading-relaxed text-lg">
            Nada Gurukulam is committed to making classical arts education accessible to all deserving students. Merit-based scholarships cover up to 100% of tuition fees.
          </p>
          <Button variant="outline" className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm px-8">
            Learn About Scholarships
          </Button>
        </motion.div>
      </div>
    </section>

    {/* ══════ FAQs ══════ */}
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-3xl md:text-5xl font-bold text-center mb-12">
          <HelpCircle className="inline h-8 w-8 mb-1 mr-2" />
          Frequently Asked Questions
        </motion.h2>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <AccordionItem value={`faq-${i}`} className="bg-card rounded-xl border border-border/50 px-6 hover:shadow-md transition-all duration-300 hover:border-secondary/20">
                <AccordionTrigger className="text-sm font-medium text-left py-5 hover:text-primary transition-colors">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-5">{faq.a}</AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>

    {/* ══════ CTA ══════ */}
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 gradient-maroon" />
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        style={{ background: "linear-gradient(135deg, hsl(43 72% 52% / 0.15), transparent, hsl(43 72% 52% / 0.15))", backgroundSize: "200% 200%" }}
      />
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-primary-foreground mb-4">Ready to Apply?</h2>
          <p className="text-primary-foreground/60 mb-10 max-w-lg mx-auto text-lg">Take the first step towards your artistic journey. Applications for 2025–26 are open now.</p>
          <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-14 h-14 shadow-2xl hover:shadow-secondary/30 transition-all hover:-translate-y-1 animate-glow-pulse">
            <ArrowRight className="h-5 w-5 mr-2" />
            Apply for Admission
          </Button>
        </motion.div>
      </div>
    </section>
  </div>
);

export default Admissions;
