import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Clock, Send, HelpCircle, HandHeart, Briefcase, MapPinned } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";
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

const faqs = [
  { q: "Who can join Nada Gurukulam?", a: "Nada Gurukulam welcomes sincere seekers of Indian classical music and dance. Prior musical training may be required for certain courses." },
  { q: "Are online classes available?", a: "Yes, we offer online live sessions for students who cannot attend in person at the campus." },
  { q: "What is the duration of the courses?", a: "Courses range from 2 to 4 years depending on the discipline and level." },
  { q: "Are scholarships available?", a: "Yes, merit-based and need-based scholarships are available for deserving students." },
  { q: "How can I express interest in joining?", a: "Please reach out through our Contact page. Our team will get back to you with all the details." },
];

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Volunteer form state
  const [volForm, setVolForm] = useState({ full_name: "", email: "", phone: "", area_of_interest: "", availability: "", message: "" });

  const { data: jobPostings = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_postings").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const volunteerMutation = useMutation({
    mutationFn: async (data: typeof volForm) => {
      const { error } = await supabase.from("volunteer_applications").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Application Submitted!", description: "Thank you for your interest in volunteering. We'll reach out soon." });
      setVolForm({ full_name: "", email: "", phone: "", area_of_interest: "", availability: "", message: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit application. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Message Sent!", description: "Thank you for reaching out. We'll get back to you soon." });
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  const handleVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    volunteerMutation.mutate(volForm);
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
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(358_68%_10%/0.94)] via-[hsl(358_68%_18%/0.88)] to-[hsl(358_68%_12%/0.82)]" />

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
                  style={{ background: "linear-gradient(90deg, hsl(358 68% 28%), hsl(33 62% 58%), hsl(358 68% 28%))" }}
                />
                <div className="p-7 md:p-9">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">Send a Message</h2>
                  <p className="text-muted-foreground text-sm mb-8">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>

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
                    <Button type="submit" disabled={loading} size="lg" className="px-10 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
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
                <img src={campusReception} alt="Campus Reception" className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
              <div className="card-glass-gold rounded-2xl p-7">
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


      {/* ══════ GET INVOLVED: Volunteering + Job Openings ══════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-3xl md:text-5xl font-bold text-center mb-4">
            Get <span className="text-gradient-gold">Involved</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Join our mission to preserve and propagate Indian classical arts. Volunteer your time or explore career opportunities.
          </motion.p>

          <Tabs defaultValue="volunteer" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="volunteer"><HandHeart className="h-4 w-4 mr-1.5" />Volunteer</TabsTrigger>
              <TabsTrigger value="jobs"><Briefcase className="h-4 w-4 mr-1.5" />Job Openings</TabsTrigger>
            </TabsList>

            {/* Volunteer Tab */}
            <TabsContent value="volunteer">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
                <div className="rounded-2xl overflow-hidden shadow-xl bg-card border border-border/50">
                  <div className="h-1.5" style={{ background: "linear-gradient(90deg, hsl(358 68% 28%), hsl(33 62% 58%), hsl(358 68% 28%))" }} />
                  <div className="p-7 md:p-9">
                    <h3 className="font-serif text-xl font-bold mb-2">Volunteer Application</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Share your skills and time to support classical arts education. Fill in your details below.
                    </p>
                    <form onSubmit={handleVolunteerSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label>Full Name *</Label>
                          <Input required value={volForm.full_name} onChange={(e) => setVolForm({ ...volForm, full_name: e.target.value })} placeholder="Your name" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input type="email" required value={volForm.email} onChange={(e) => setVolForm({ ...volForm, email: e.target.value })} placeholder="you@example.com" className="h-12 rounded-xl" />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={volForm.phone} onChange={(e) => setVolForm({ ...volForm, phone: e.target.value })} placeholder="+91 98765 43210" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Area of Interest</Label>
                          <Select value={volForm.area_of_interest} onValueChange={(v) => setVolForm({ ...volForm, area_of_interest: v })}>
                            <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select area" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="teaching">Teaching Assistance</SelectItem>
                              <SelectItem value="events">Event Management</SelectItem>
                              <SelectItem value="content">Content & Media</SelectItem>
                              <SelectItem value="admin">Administrative Support</SelectItem>
                              <SelectItem value="tech">Technology</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Availability</Label>
                        <Select value={volForm.availability} onValueChange={(v) => setVolForm({ ...volForm, availability: v })}>
                          <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select availability" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekdays">Weekdays</SelectItem>
                            <SelectItem value="weekends">Weekends</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea value={volForm.message} onChange={(e) => setVolForm({ ...volForm, message: e.target.value })} rows={3} placeholder="Tell us about yourself and how you'd like to contribute..." className="rounded-xl" />
                      </div>
                      <Button type="submit" disabled={volunteerMutation.isPending} size="lg" className="px-10 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                        <HandHeart className="h-4 w-4 mr-2" /> {volunteerMutation.isPending ? "Submitting..." : "Submit Application"}
                      </Button>
                    </form>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-4">
                {jobsLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading openings...</div>
                ) : jobPostings.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-serif text-lg font-bold mb-2">No Current Openings</h3>
                      <p className="text-muted-foreground text-sm">Check back later or sign up for notifications about future opportunities.</p>
                    </CardContent>
                  </Card>
                ) : (
                  jobPostings.map((job: any) => (
                    <Card key={job.id} className="hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-serif text-lg font-bold mb-1">{job.title}</h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.department && <Badge variant="secondary">{job.department}</Badge>}
                              {job.type && <Badge variant="outline" className="capitalize">{job.type}</Badge>}
                              {job.location && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPinned className="h-3 w-3" /> {job.location}
                                </span>
                              )}
                            </div>
                            {job.description && <p className="text-sm text-muted-foreground mb-3">{job.description}</p>}
                            {job.requirements && (
                              <div>
                                <p className="text-xs font-semibold mb-1">Requirements:</p>
                                <p className="text-sm text-muted-foreground">{job.requirements}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button variant="outline" size="sm" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground" asChild>
                            <a href={`mailto:info.nadagurukulam@sssuhe.ac.in?subject=Application for ${job.title}`}>Apply via Email</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <SectionDivider />

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
