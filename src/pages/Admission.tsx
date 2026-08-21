import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, FileText, UserCheck, CalendarCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionDivider from "@/components/SectionDivider";
import InquiryFormDialog from "@/components/InquiryFormDialog";

const steps = [
  {
    icon: FileText,
    title: "Submit an Inquiry",
    text: "Share your details and the program you are interested in. Our admissions team reviews every inquiry personally.",
  },
  {
    icon: UserCheck,
    title: "Interaction & Assessment",
    text: "A short conversation with our faculty helps us understand your background, aptitude and learning goals.",
  },
  {
    icon: CalendarCheck,
    title: "Confirmation & Onboarding",
    text: "Once selected, you receive your registration details and access to the learning dashboard.",
  },
];

const eligibility = [
  "Open to learners of all ages with a sincere interest in Indian classical arts.",
  "No prior formal training required for foundation programs.",
  "Diploma and University programs may require an aptitude interaction.",
  "Admissions are by pre-registration or invitation only.",
];

const Admission = () => {
  const [inquiryOpen, setInquiryOpen] = useState(false);

  return (
    <div>
      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <GraduationCap className="h-10 w-10 text-secondary mx-auto mb-4" />
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary-foreground mb-4">
              Admission
            </h1>
            <p className="text-primary-foreground/60 max-w-2xl mx-auto text-sm md:text-base tracking-wide">
              Begin your journey into the living tradition of Indian classical music and dance at Nada Gurukulam.
            </p>
            <Button
              onClick={() => setInquiryOpen(true)}
              className="mt-8 bg-background text-foreground border border-border hover:bg-muted shadow-lg px-8 h-12 font-semibold"
            >
              <Send className="h-4 w-4 mr-2" /> Start Your Inquiry
            </Button>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Process */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-3">Admission Process</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12 text-sm md:text-base">
            A simple, guided pathway from your first inquiry to your first class.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <step.icon className="h-6 w-6 text-secondary" />
                </div>
                <div className="text-xs font-semibold tracking-widest text-muted-foreground mb-2">
                  STEP {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-serif text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Eligibility */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-10">Eligibility & Guidelines</h2>
          <ul className="space-y-4">
            {eligibility.map((item) => (
              <li key={item} className="flex gap-3 items-start rounded-xl bg-card border border-border p-4">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-secondary shrink-0" />
                <span className="text-sm md:text-base text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              Have questions about a specific program? Our admissions team will guide you.
            </p>
            <Button onClick={() => setInquiryOpen(true)} size="lg" className="px-8 font-semibold">
              Enquire Now
            </Button>
          </div>
        </div>
      </section>

      <InquiryFormDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        programSlug="general-admission"
        programName="General Admission"
      />
    </div>
  );
};

export default Admission;
