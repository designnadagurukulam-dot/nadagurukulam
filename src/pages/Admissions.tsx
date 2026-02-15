import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle, GraduationCap, HelpCircle, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    {/* Hero */}
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
      <img src={campusAmphitheatre} alt="Campus Amphitheatre" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_15%/0.92)] via-[hsl(0_69%_20%/0.85)] to-[hsl(345_75%_15%/0.8)]" />
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4"
          style={{ textShadow: "0 4px 30px hsl(0 0% 0% / 0.3)" }}
        >
          Admissions
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-primary-foreground/70 max-w-2xl mx-auto"
        >
          Begin your journey into Indian classical arts. Applications are now open for the 2025–26 academic year.
        </motion.p>
      </div>
    </section>

    <SectionDivider />

    {/* Application Process */}
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="font-serif text-3xl font-bold text-center mb-12">Application Process</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}>
              <Card className="h-full border-border/50 hover:shadow-xl transition-all duration-500 hover:border-secondary/30 hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-secondary-foreground font-bold text-lg mb-4 group-hover:scale-110 transition-transform duration-300">{s.num}</div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <SectionDivider />

    {/* Eligibility */}
    <section className="py-16 bg-muted/40">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-serif text-3xl font-bold text-center mb-8">Eligibility Criteria</h2>
        <div className="space-y-3">
          {[
            "Open to students of all nationalities and backgrounds",
            "Basic understanding of music/dance preferred for intermediate programs",
            "Audition required for advanced programs",
            "Proficiency in English or Hindi for instruction",
            "Performance video submission for online applicants",
          ].map((item) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-start gap-3 bg-card p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/80">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Fee Structure */}
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-serif text-3xl font-bold text-center mb-8">
          <IndianRupee className="inline h-7 w-7 mb-1" /> Fee Structure
        </h2>
        <div className="overflow-x-auto rounded-xl shadow-lg">
          <table className="w-full text-sm overflow-hidden">
            <thead>
              <tr className="gradient-gold">
                <th className="text-left p-4 font-semibold text-secondary-foreground">Fee Component</th>
                <th className="text-right p-4 font-semibold text-secondary-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Application Fee", "₹500"],
                ["Tuition Fee (per semester)", "₹15,000"],
                ["Examination Fee", "₹2,000"],
                ["Library & Resources", "₹1,000"],
              ].map(([label, amt], i) => (
                <tr key={label} className={`${i % 2 === 0 ? "bg-card" : "bg-muted/30"} hover:bg-secondary/5 transition-colors`}>
                  <td className="p-4 text-foreground/80">{label}</td>
                  <td className="p-4 text-right font-semibold">{amt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">* Fees are subject to revision. Installment plans available.</p>
      </div>
    </section>

    <SectionDivider />

    {/* Scholarships */}
    <section className="relative py-24 overflow-hidden">
      <img src={imgDancePerf} alt="Celebration" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_15%/0.92)] to-[hsl(345_75%_15%/0.88)]" />
      <div className="relative z-10 container mx-auto px-4 max-w-3xl text-center">
        <GraduationCap className="h-10 w-10 text-gold mx-auto mb-4" />
        <h2 className="font-serif text-3xl font-bold mb-4 text-primary-foreground">Scholarships & Financial Aid</h2>
        <p className="text-primary-foreground/70 mb-6 leading-relaxed">
          Nada Gurukulam is committed to making classical arts education accessible to all deserving students. Merit-based scholarships cover up to 100% of tuition fees.
        </p>
        <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm">
          Learn About Scholarships
        </Button>
      </div>
    </section>

    {/* FAQs */}
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-serif text-3xl font-bold text-center mb-8">
          <HelpCircle className="inline h-7 w-7 mb-1 mr-1" /> Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-lg border px-4 hover:shadow-sm transition-shadow">
              <AccordionTrigger className="text-sm font-medium text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 gradient-maroon pattern-overlay relative">
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="font-serif text-3xl font-bold text-primary-foreground mb-4">Ready to Apply?</h2>
        <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">Take the first step towards your artistic journey. Applications for 2025–26 are open now.</p>
        <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-10 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5">Apply for Admission</Button>
      </div>
    </section>
  </div>
);

export default Admissions;
