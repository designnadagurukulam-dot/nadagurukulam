import { motion } from "framer-motion";
import { Target, Eye, BookOpen, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

const milestones = [
  { year: "2015", title: "Foundation", desc: "Nada Gurukulam founded under Sri Sathya Sai University for Human Excellence." },
  { year: "2017", title: "First Graduates", desc: "First cohort of students complete the foundation program." },
  { year: "2019", title: "International Reach", desc: "Students from 10+ countries enrolled in online programs." },
  { year: "2021", title: "Advanced Programs", desc: "Launch of advanced diploma and degree-level programs." },
  { year: "2023", title: "Global Performances", desc: "Students perform in prestigious venues across 30+ countries." },
  { year: "2025", title: "Digital Campus", desc: "Full-featured online LMS launched for global learners." },
];

const About = () => (
  <div>
    {/* Hero */}
    <section className="gradient-maroon py-20 md:py-28">
      <div className="container mx-auto px-4 text-center">
        <p className="font-devanagari text-xl md:text-2xl text-gold mb-3">नादो उपासना</p>
        <p className="text-primary-foreground/60 italic text-sm mb-6">"Worship through Sound"</p>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground">About Nada Gurukulam</h1>
      </div>
    </section>

    {/* Story timeline */}
    <Section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-14">Our Journey</h2>
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />
          {milestones.map((m, i) => (
            <motion.div
              key={m.year}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative flex items-start gap-6 mb-10 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
            >
              <div className="hidden md:block md:w-1/2" />
              <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background -translate-x-1/2 z-10 mt-1" />
              <div className="pl-10 md:pl-0 md:w-1/2">
                <span className="text-secondary font-bold text-sm">{m.year}</span>
                <h3 className="font-serif text-lg font-semibold mt-1">{m.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{m.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>

    {/* Vision & Mission */}
    <Section className="py-20 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <Card className="border-none shadow-lg">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-full gradient-maroon flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To be a global center of excellence for Indian classical music and dance education, preserving ancient traditions while embracing modern pedagogical methods, and nurturing artists who carry forward the cultural legacy with devotion and skill.
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">Our Mission</h3>
              <ul className="text-muted-foreground space-y-2 text-sm leading-relaxed">
                <li>• Preserve and promote Indian classical art forms through authentic Guru-Shishya training</li>
                <li>• Make quality music and dance education accessible to students worldwide</li>
                <li>• Foster spiritual growth through the practice of Nada Yoga</li>
                <li>• Create performing artists who embody technical mastery and cultural depth</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Section>

    {/* Founder's Message */}
    <Section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-5 gap-10 items-center">
          <div className="md:col-span-2 flex justify-center">
            <div className="w-52 h-52 rounded-full gradient-maroon flex items-center justify-center">
              <Heart className="h-16 w-16 text-primary-foreground/40" />
            </div>
          </div>
          <div className="md:col-span-3">
            <h2 className="font-serif text-3xl font-bold mb-2">Founder's Message</h2>
            <p className="text-secondary font-medium mb-4">Sadguru Sri Madhusudan Sai</p>
            <blockquote className="border-l-4 border-secondary pl-4 italic text-muted-foreground mb-4 leading-relaxed">
              "Music is the language of the soul. At Nada Gurukulam, we don't just teach notes and rhythms — we awaken the divinity within through the sacred vibrations of Nada Brahma."
            </blockquote>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Under the guidance of Sadguru Sri Madhusudan Sai, Nada Gurukulam was established with the vision of creating a haven for classical arts — where the ancient Guru-Shishya tradition thrives alongside modern educational excellence.
            </p>
          </div>
        </div>
      </div>
    </Section>

    {/* Director's Message */}
    <Section className="py-20 bg-muted/40">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-5 gap-10 items-center">
          <div className="md:col-span-3 order-2 md:order-1">
            <h2 className="font-serif text-3xl font-bold mb-2">Director's Message</h2>
            <p className="text-secondary font-medium mb-4">Smt. Revathi Ramachandran</p>
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4 leading-relaxed">
              "Every student who walks through our doors carries within them the potential for artistic greatness. Our duty is to nurture that seed with patience, love, and rigorous training."
            </blockquote>
            <p className="text-muted-foreground text-sm leading-relaxed">
              With decades of experience in Carnatic music and a deep commitment to the Guru-Shishya tradition, Smt. Revathi Ramachandran leads Nada Gurukulam with a unique blend of artistic excellence and administrative vision.
            </p>
          </div>
          <div className="md:col-span-2 flex justify-center order-1 md:order-2">
            <div className="w-52 h-52 rounded-full gradient-gold flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-secondary-foreground/40" />
            </div>
          </div>
        </div>
      </div>
    </Section>

    {/* Philosophy */}
    <Section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">Our Philosophy</h2>
        <h3 className="font-serif text-xl text-secondary font-semibold mb-4">The Guru-Shishya Parampara</h3>
        <p className="text-muted-foreground leading-relaxed mb-6">
          At the heart of Nada Gurukulam lies the time-honored Guru-Shishya tradition — a sacred bond between teacher and student that goes beyond mere instruction. This ancient system of knowledge transfer has preserved Indian classical arts for millennia.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          We believe that true learning happens not just through technique and practice, but through the transformative relationship with a Guru who imparts not only skill but wisdom, discipline, and devotion. Every student at Nada Gurukulam is guided on a deeply personal journey of artistic and spiritual growth.
        </p>
      </div>
    </Section>
  </div>
);

export default About;
