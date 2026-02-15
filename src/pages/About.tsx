import { motion } from "framer-motion";
import { Target, Eye, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SectionDivider from "@/components/SectionDivider";

import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";
import imgMusic13 from "@/assets/gallery/NGMUSIC-13.webp";
import imgChorus from "@/assets/gallery/NGR6M_0933.webp";
import imgVocal from "@/assets/gallery/NGZ6R_1512_R.webp";
import imgConcert from "@/assets/gallery/NGR6_M1630.webp";
import imgMusic6 from "@/assets/gallery/NGMUSIC-6.webp";

import founderImg from "@/assets/founders/SadguruSriMadhusudanSai.jpg";
import directorImg from "@/assets/founders/SmtRevathiRamachandran.webp";
import leadershipImg from "@/assets/founders/Director.webp";
import campusAerial from "@/assets/campus/NGCampusAerial.jpg";
import campusAmphitheatre from "@/assets/campus/NGAmphitheatre.jpg";
import campusVault from "@/assets/campus/NGVaultPassage.jpg";
import campusVerandah from "@/assets/campus/NGVerandah.jpg";
import campusReception from "@/assets/campus/NGReception.jpg";
import campusAmphyEntry from "@/assets/campus/NGAmphyEntry.jpg";

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
  { year: "2015", title: "Foundation", desc: "Nada Gurukulam founded under Sri Sathya Sai University for Human Excellence.", img: imgPercussion },
  { year: "2017", title: "First Graduates", desc: "First cohort of students complete the foundation program.", img: imgMusic6 },
  { year: "2019", title: "International Reach", desc: "Students from 10+ countries enrolled in online programs.", img: imgChorus },
  { year: "2021", title: "Advanced Programs", desc: "Launch of advanced diploma and degree-level programs.", img: imgVocal },
  { year: "2023", title: "Global Performances", desc: "Students perform in prestigious venues across 30+ countries.", img: imgConcert },
  { year: "2025", title: "Digital Campus", desc: "Full-featured online LMS launched for global learners.", img: imgMusic13 },
];

const campusGrid = [
  { src: campusAerial, alt: "Campus Aerial View", className: "col-span-2 row-span-2" },
  { src: campusAmphitheatre, alt: "Central Amphitheatre", className: "" },
  { src: campusReception, alt: "Reception Hall", className: "" },
  { src: campusVault, alt: "Heritage Vault Passage", className: "row-span-2" },
  { src: campusVerandah, alt: "Verandah Walkway", className: "col-span-2" },
  { src: campusAmphyEntry, alt: "Amphitheatre Entry", className: "" },
];

const About = () => (
  <div>
    {/* Hero */}
    <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
      <img src={campusAerial} alt="Campus" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_15%/0.9)] via-[hsl(0_69%_20%/0.85)] to-[hsl(345_75%_15%/0.8)]" />
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-devanagari text-xl md:text-2xl text-gradient-gold mb-3"
          style={{ WebkitTextFillColor: "unset", color: "hsl(43 72% 52%)" }}
        >
          नादो उपासना
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-primary-foreground/60 italic text-sm mb-6 tracking-wider"
        >
          "Worship through Sound"
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground"
          style={{ textShadow: "0 4px 30px hsl(0 0% 0% / 0.3)" }}
        >
          About Nada Gurukulam
        </motion.h1>
      </div>
    </section>

    <SectionDivider />

    {/* Story timeline */}
    <Section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-14">Our Journey</h2>
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-secondary/50 via-secondary/30 to-secondary/10 -translate-x-1/2" />
          {milestones.map((m, i) => (
            <motion.div
              key={m.year}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative flex items-start gap-6 mb-12 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
            >
              <div className="hidden md:block md:w-1/2" />
              <div className="absolute left-4 md:left-1/2 w-5 h-5 rounded-full bg-secondary border-4 border-background -translate-x-1/2 z-10 mt-1 shadow-lg" />
              <div className="pl-10 md:pl-0 md:w-1/2">
                <div className="flex items-start gap-3">
                  <img src={m.img} alt={m.title} className="w-16 h-16 rounded-lg object-cover shadow-md hidden sm:block" loading="lazy" />
                  <div>
                    <span className="text-secondary font-bold text-sm">{m.year}</span>
                    <h3 className="font-serif text-lg font-semibold mt-1">{m.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{m.desc}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>

    <SectionDivider />

    {/* Vision & Mission */}
    <Section className="py-20 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-500">
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
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-500">
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

    <SectionDivider />

    {/* Founder's Message */}
    <Section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-5 gap-10 items-center">
          <div className="md:col-span-2 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-56 h-56 rounded-full overflow-hidden golden-frame shadow-2xl animate-glow-pulse"
            >
              <img src={founderImg} alt="Sadguru Sri Madhusudan Sai" className="w-full h-full object-cover" loading="lazy" />
            </motion.div>
          </div>
          <div className="md:col-span-3">
            <h2 className="font-serif text-3xl font-bold mb-2">Founder's Message</h2>
            <p className="text-secondary font-medium mb-4">Sadguru Sri Madhusudan Sai</p>
            <div className="relative">
              <span className="absolute -top-4 -left-2 text-6xl text-secondary/15 font-serif leading-none">"</span>
              <blockquote className="border-l-4 border-secondary pl-4 italic text-muted-foreground mb-4 leading-relaxed">
                "Music is the language of the soul. At Nada Gurukulam, we don't just teach notes and rhythms — we awaken the divinity within through the sacred vibrations of Nada Brahma."
              </blockquote>
            </div>
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
            <div className="relative">
              <span className="absolute -top-4 -left-2 text-6xl text-primary/15 font-serif leading-none">"</span>
              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4 leading-relaxed">
                "Every student who walks through our doors carries within them the potential for artistic greatness. Our duty is to nurture that seed with patience, love, and rigorous training."
              </blockquote>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              With decades of experience in Carnatic music and a deep commitment to the Guru-Shishya tradition, Smt. Revathi Ramachandran leads Nada Gurukulam with a unique blend of artistic excellence and administrative vision.
            </p>
          </div>
          <div className="md:col-span-2 flex justify-center order-1 md:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-56 h-56 rounded-full overflow-hidden golden-frame shadow-2xl animate-glow-pulse"
            >
              <img src={directorImg} alt="Smt. Revathi Ramachandran" className="w-full h-full object-cover" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </div>
    </Section>

    {/* Leadership Banner */}
    <Section className="py-0">
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        <img src={leadershipImg} alt="Our Leadership" className="w-full h-full object-cover object-top" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_69%_15%/0.7)] to-transparent flex items-end justify-center pb-8">
          <h3 className="font-serif text-2xl md:text-3xl text-primary-foreground font-bold" style={{ textShadow: "0 2px 10px hsl(0 0% 0% / 0.5)" }}>Our Leadership</h3>
        </div>
      </div>
    </Section>

    <SectionDivider />

    {/* Campus */}
    <Section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Building2 className="h-6 w-6 text-secondary" />
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center">Our Campus</h2>
        </div>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-14">
          A world-class campus at Sathya Sai Grama, designed to inspire creativity and devotion.
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto auto-rows-[180px]">
          {campusGrid.map((img, i) => (
            <motion.div
              key={img.alt}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`${img.className} rounded-xl overflow-hidden shadow-lg img-zoom group`}
            >
              <div className="relative w-full h-full">
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.5)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-primary-foreground text-sm font-medium">{img.alt}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>

    <SectionDivider />

    {/* Philosophy */}
    <section className="relative py-28 overflow-hidden">
      <img src={campusVault} alt="Heritage Passage" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_15%/0.92)] to-[hsl(345_75%_15%/0.88)]" />
      <div className="relative z-10 container mx-auto px-4 max-w-3xl text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-primary-foreground">Our Philosophy</h2>
        <h3 className="font-serif text-xl text-gold font-semibold mb-4">The Guru-Shishya Parampara</h3>
        <p className="text-primary-foreground/80 leading-relaxed mb-6">
          At the heart of Nada Gurukulam lies the time-honored Guru-Shishya tradition — a sacred bond between teacher and student that goes beyond mere instruction. This ancient system of knowledge transfer has preserved Indian classical arts for millennia.
        </p>
        <p className="text-primary-foreground/65 leading-relaxed">
          We believe that true learning happens not just through technique and practice, but through the transformative relationship with a Guru who imparts not only skill but wisdom, discipline, and devotion.
        </p>
      </div>
    </section>
  </div>
);

export default About;
