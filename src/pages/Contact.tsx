import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import SectionDivider from "@/components/SectionDivider";

import campusAerial from "@/assets/campus/NGCampusAerial.jpg";
import campusReception from "@/assets/campus/NGReception.jpg";

const contactInfo = [
  { icon: MapPin, label: "Address", value: "Nada Gurukulam, Sathya Sai Grama, Muddenahalli, Chikkaballapur, Karnataka - 562101", color: "from-primary to-primary/80" },
  { icon: Mail, label: "Email", value: "info.nadagurukulam@sssuhe.ac.in", href: "mailto:info.nadagurukulam@sssuhe.ac.in", color: "from-secondary to-accent" },
  { icon: Phone, label: "Phone", value: "+91 80 1234 5678", color: "from-primary to-secondary" },
  { icon: Clock, label: "Office Hours", value: "Monday – Saturday, 9:00 AM – 5:00 PM IST", color: "from-accent to-secondary" },
];

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Message Sent!", description: "Thank you for reaching out. We'll get back to you soon." });
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div>
      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
        <img src={campusAerial} alt="Campus" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.94)] via-[hsl(0_69%_18%/0.88)] to-[hsl(345_75%_12%/0.82)]" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-4"
            style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}
          >
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-primary-foreground/60 max-w-2xl mx-auto"
          >
            We'd love to hear from you. Reach out with any questions about our programs.
          </motion.p>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ CONTACT INFO CARDS ══════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20">
            {contactInfo.map((info, i) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group"
              >
                <div className="relative h-full rounded-2xl bg-card shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <info.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h4 className="font-serif font-bold text-sm mb-2">{info.label}</h4>
                  {info.href ? (
                    <a href={info.href} className="text-sm text-primary hover:underline break-all">{info.value}</a>
                  ) : (
                    <p className="text-muted-foreground text-sm leading-relaxed">{info.value}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* ══════ FORM + IMAGE ══════ */}
          <div className="grid lg:grid-cols-5 gap-10 max-w-6xl mx-auto">
            {/* Form */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-3">
              <div className="rounded-2xl overflow-hidden shadow-xl bg-card border border-border/50">
                <div className="h-1.5 shimmer-line" style={{ background: "linear-gradient(90deg, hsl(0 69% 33%), hsl(43 72% 52%), hsl(0 69% 33%))" }} />
                <div className="p-8 md:p-10">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">Send a Message</h2>
                  <p className="text-muted-foreground text-sm mb-8">Fill out the form below and we'll get back to you within 24 hours.</p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                        <Input id="name" required placeholder="Your name" className="h-12 rounded-xl border-border/50 focus:border-secondary focus:ring-secondary/20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                        <Input id="email" type="email" required placeholder="you@example.com" className="h-12 rounded-xl border-border/50 focus:border-secondary focus:ring-secondary/20" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                        <Input id="phone" required placeholder="+91 98765 43210" className="h-12 rounded-xl border-border/50 focus:border-secondary focus:ring-secondary/20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-medium">Subject *</Label>
                        <Select required>
                          <SelectTrigger className="h-12 rounded-xl border-border/50"><SelectValue placeholder="Select subject" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="admissions">Admissions</SelectItem>
                            <SelectItem value="courses">Course Information</SelectItem>
                            <SelectItem value="technical">Technical Support</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">Message *</Label>
                      <Textarea id="message" required rows={5} placeholder="Tell us how we can help..." className="rounded-xl border-border/50 focus:border-secondary focus:ring-secondary/20" />
                    </div>
                    <Button type="submit" disabled={loading} size="lg" className="px-10 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all">
                      <Send className="h-4 w-4 mr-2" /> {loading ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>

            {/* Image sidebar */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl overflow-hidden shadow-xl group">
                <img src={campusReception} alt="Campus Reception" className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
              <div className="card-glass-gold rounded-2xl p-6">
                <h3 className="font-serif text-lg font-bold mb-3">Visit Us</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We welcome visitors to our campus at Sathya Sai Grama. Schedule a campus tour to experience our facilities and meet our Gurus in person.
                </p>
                <Button variant="outline" size="sm" className="mt-4 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                  Schedule a Tour
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════ MAP ══════ */}
      <section className="h-80 w-full">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3880.0!2d77.76!3d13.38!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sMuddenahalli%2C+Karnataka!5e0!3m2!1sen!2sin!4v1"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Nada Gurukulam Location"
        />
      </section>
    </div>
  );
};

export default Contact;
