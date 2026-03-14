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
  {
    icon: MapPin,
    label: "Address",
    value: "Nada Gurukulam, Sathya Sai Grama, Muddenahalli, Chikkaballapur, Karnataka - 562101",
    color: "from-primary to-primary/80",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info.nadagurukulam@sssuhe.ac.in",
    href: "mailto:info.nadagurukulam@sssuhe.ac.in",
    color: "from-secondary to-accent",
  },
  { icon: Phone, label: "Phone", value: "+91 80 1234 5678", color: "from-primary to-secondary" },
  {
    icon: Clock,
    label: "Office Hours",
    value: "Monday – Saturday, 9:00 AM – 5:00 PM IST",
    color: "from-accent to-secondary",
  },
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
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden grain-overlay">
        <motion.img
          src={campusAerial}
          alt="Campus"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.94)] via-[hsl(0_69%_18%/0.88)] to-[hsl(345_75%_12%/0.82)]" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-secondary/25"
              style={{
                width: `${3 + (i % 3) * 2}px`,
                height: `${3 + (i % 3) * 2}px`,
                left: `${15 + i * 20}%`,
                top: `${22 + ((i * 15) % 50)}%`,
              }}
              animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
              transition={{ repeat: Infinity, duration: 3 + i * 0.6, delay: i * 0.4, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-devanagari text-3xl md:text-5xl lg:text-6xl text-shimmer-gold mb-4 leading-relaxed overflow-visible py-2"
            >
              संपर्क करें
            </motion.p>
            <p className="text-primary-foreground/50 italic text-lg md:text-2xl tracking-[0.2em]">
              "Connect with us"
            </p>
          </motion.div>
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group"
              >
                <div className="relative h-full rounded-2xl bg-card shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 overflow-hidden p-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-md`}
                  >
                    <info.icon className="h-6 w-6 text-primary-foreground" />
                  </motion.div>
                  <h4 className="font-serif font-bold text-sm mb-2">{info.label}</h4>
                  {info.href ? (
                    <a href={info.href} className="text-sm text-primary hover:underline break-all">
                      {info.value}
                    </a>
                  ) : (
                    <p className="text-muted-foreground text-sm leading-relaxed">{info.value}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* ══════ FORM + IMAGE ══════ */}
          <div className="grid lg:grid-cols-5 gap-10 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-3"
            >
              <div className="rounded-2xl overflow-hidden shadow-xl bg-card border border-border/50">
                <div
                  className="h-1.5 shimmer-line"
                  style={{ background: "linear-gradient(90deg, hsl(0 69% 33%), hsl(43 72% 52%), hsl(0 69% 33%))" }}
                />
                <div className="p-7 md:p-9">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">Send a Message</h2>
                  <p className="text-muted-foreground text-sm mb-8">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          required
                          placeholder="Your name"
                          className="h-12 rounded-xl border-border/50 focus:border-secondary focus:ring-secondary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="you@example.com"
                          className="h-12 rounded-xl border-border/50 focus:border-secondary focus:ring-secondary/20"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          required
                          placeholder="+91 98765 43210"
                          className="h-12 rounded-xl border-border/50 focus:border-secondary focus:ring-secondary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-medium">
                          Subject *
                        </Label>
                        <Select required>
                          <SelectTrigger className="h-12 rounded-xl border-border/50">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
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
                      <Label htmlFor="message" className="text-sm font-medium">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        required
                        rows={5}
                        placeholder="Tell us how we can help..."
                        className="rounded-xl border-border/50 focus:border-secondary focus:ring-secondary/20"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      size="lg"
                      className="px-10 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                      <Send className="h-4 w-4 mr-2" /> {loading ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="rounded-2xl overflow-hidden shadow-xl group">
                <img
                  src={campusReception}
                  alt="Campus Reception"
                  className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="card-glass-gold rounded-2xl p-7">
                <h3 className="font-serif text-lg font-bold mb-3">Visit Us</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We welcome visitors to our campus at Sathya Sai Grama. Schedule a campus tour to experience our
                  facilities and meet our Gurus in person.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                >
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
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2744.4066459650808!2d77.6937803941797!3d13.40135829461648!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb1e52a89f0ad8d%3A0x8545bf8758410a18!2sNada%20Gurukulam!5e0!3m2!1sen!2sin!4v1773467122632!5m2!1sen!2sin"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </section>
    </div>
  );
};

export default Contact;
