import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle, FileText, GraduationCap, HelpCircle, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const steps = [
  { num: 1, title: "Create Account", desc: "Register on our portal with your basic details." },
  { num: 2, title: "Fill Application", desc: "Complete the detailed application form for your chosen program." },
  { num: 3, title: "Upload Documents", desc: "Submit required documents and any performance videos." },
  { num: 4, title: "Pay Application Fee", desc: "Complete the one-time application fee payment." },
  { num: 5, title: "Audition / Interview", desc: "Attend an online or in-person audition with our faculty." },
  { num: 6, title: "Admission Confirmation", desc: "Receive your admission decision and confirm enrollment." },
];

const faqs = [
  { q: "What is the minimum age for admission?", a: "Students of all ages are welcome. For children under 12, parental consent is required. Each program may have specific age guidelines." },
  { q: "Is prior musical training required?", a: "Not for beginner-level programs. Intermediate and advanced programs require prior training and may include an audition." },
  { q: "Are online classes available?", a: "Yes, we offer online live sessions for students who cannot attend in person. Our LMS provides recorded lessons and practice materials." },
  { q: "What is the duration of the programs?", a: "Programs range from 2 to 4 years depending on the discipline and level. Certificate, diploma, and degree options are available." },
  { q: "Are scholarships available?", a: "Yes, merit-based and need-based scholarships are available. Apply through the financial aid section of your application." },
  { q: "Can I enroll in multiple courses?", a: "Students may enroll in up to two programs simultaneously, subject to schedule compatibility and faculty approval." },
];

const Admissions = () => (
  <div>
    {/* Hero */}
    <section className="gradient-maroon py-20 md:py-28">
      <div className="container mx-auto px-4 text-center">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">Admissions</h1>
        <p className="text-primary-foreground/70 max-w-2xl mx-auto">Begin your journey into Indian classical arts. Applications are now open for the 2025–26 academic year.</p>
      </div>
    </section>

    {/* Application Process */}
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="font-serif text-3xl font-bold text-center mb-12">Application Process</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}>
              <Card className="h-full border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-full gradient-maroon flex items-center justify-center text-primary-foreground font-bold text-sm mb-3">{s.num}</div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

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
            <div key={item} className="flex items-start gap-3 bg-card p-4 rounded-lg shadow-sm">
              <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/80">{item}</span>
            </div>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead className="gradient-maroon text-primary-foreground">
              <tr>
                <th className="text-left p-4">Fee Component</th>
                <th className="text-right p-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Application Fee", "₹500"],
                ["Tuition Fee (per semester)", "₹15,000"],
                ["Examination Fee", "₹2,000"],
                ["Library & Resources", "₹1,000"],
              ].map(([label, amt], i) => (
                <tr key={label} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
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

    {/* Scholarships */}
    <section className="py-16 bg-muted/40">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <GraduationCap className="h-10 w-10 text-secondary mx-auto mb-4" />
        <h2 className="font-serif text-3xl font-bold mb-4">Scholarships & Financial Aid</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Nada Gurukulam is committed to making classical arts education accessible to all deserving students. Merit-based scholarships cover up to 100% of tuition fees for exceptional talent. Need-based financial aid is also available.
        </p>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
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
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-medium text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 gradient-maroon">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl font-bold text-primary-foreground mb-4">Ready to Apply?</h2>
        <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">Take the first step towards your artistic journey. Applications for 2025–26 are open now.</p>
        <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-10">Apply for Admission</Button>
      </div>
    </section>
  </div>
);

export default Admissions;
