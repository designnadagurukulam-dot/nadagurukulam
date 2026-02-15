import { motion } from "framer-motion";
import { Target, Eye, Building2, Heart } from "lucide-react";
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
    {/* ══════ HERO ══════ */}
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
      <img src={campusAerial} alt="Campus" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.94)] via-[hsl(0_69%_18%/0.88)] to-[hsl(345_75%_12%/0.82)]" />
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="font-devanagari text-xl md:text-2xl text-shimmer-gold mb-3">
          नादो उपासना
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-primary-foreground/50 italic text-sm mb-6 tracking-[0.3em] uppercase">
          "Worship through Sound"
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground"
          style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}
        >
          About Nada Gurukulam
        </motion.h1>
      </div>
    </section>

    <SectionDivider />

    {/* ══════ FOUNDER — First priority ══════ */}
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid md:grid-cols-5 gap-10 items-center"
        >
          <div className="md:col-span-2 flex justify-center">
            <div className="relative">
              <div className="w-60 h-60 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl border-2 border-secondary/20">
                <img src={founderImg} alt="Sadguru Sri Madhusudan Sai" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="absolute -top-3 -left-3 w-10 h-10 border-t-2 border-l-2 border-secondary rounded-tl-lg" />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-2 border-r-2 border-secondary rounded-br-lg" />
            </div>
          </div>
          <div className="md:col-span-3">
            <span className="text-secondary text-xs tracking-[0.3em] uppercase font-semibold">Founder's Message</span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mt-2 mb-1">Sadguru Sri Madhusudan Sai</h2>
            <p className="text-muted-foreground text-sm mb-2">Founder, Nada Gurukulam</p>
            <div className="w-10 h-0.5 bg-secondary rounded-full mb-4" />
            <blockquote className="border-l-4 border-secondary/40 pl-5 italic text-foreground/70 mb-3 leading-relaxed text-sm md:text-base">
              "nāda brahma, says our scriptures. Sound is divine or 'parameṣṭi', as it is called. And while the seven notes of music have been inspired by various sounds in creation or 'sṛṣṭi', it is the singular privilege of humans or 'vyaṣṭi' to sing and play music. The music that comes from 'parameṣṭi' to 'sṛṣṭi' to 'vyaṣṭi' must take all of us – samaṣṭi back to divinity. Indian classical music that originated in the sāmaveda and evolved into its current form over centuries has been designed to do just that."
            </blockquote>
            <blockquote className="border-l-4 border-secondary/40 pl-5 italic text-foreground/60 leading-relaxed text-sm">
              "To practise, promote and propagate this rich cultural and spiritual Indian music tradition is the purpose of establishing the Department of Music and Performing Arts at the Sri Sathya Sai University for Human Excellence, so that the paramparā of the divine knowledge of music is seamlessly passed on from the masters to the seekers."
            </blockquote>
          </div>
        </motion.div>
      </div>
    </section>

    <SectionDivider />

    {/* ══════ VISION & MISSION ══════ */}
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Eye, title: "Our Vision", color: "from-primary to-primary/80", desc: "To be a global center of excellence for Indian classical music and dance education, preserving ancient traditions while embracing modern pedagogical methods." },
            { icon: Target, title: "Our Mission", color: "from-secondary to-accent", desc: "Preserve and promote Indian classical art forms through authentic Guru-Shishya training. Make quality education accessible worldwide." },
            { icon: Heart, title: "Our Values", color: "from-primary to-secondary", desc: "Devotion to the art, respect for tradition, excellence in teaching, inclusivity for all backgrounds, and spiritual growth through music." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="group"
            >
              <div className="relative h-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card">
                <div className={`h-1 bg-gradient-to-r ${item.color}`} />
                <div className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-serif text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <SectionDivider />

    {/* ══════ DIRECTOR ══════ */}
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid md:grid-cols-5 gap-10 items-center"
        >
          <div className="md:col-span-3 order-2 md:order-1">
            <span className="text-primary text-xs tracking-[0.3em] uppercase font-semibold">Director's Message</span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mt-2 mb-1">Smt. Revathi Ramachandran</h2>
            <div className="w-10 h-0.5 bg-primary rounded-full mb-4" />
            <blockquote className="border-l-4 border-primary/40 pl-5 italic text-foreground/70 mb-4 leading-relaxed text-base">
              "Every student who walks through our doors carries within them the potential for artistic greatness. Our duty is to nurture that seed with patience, love, and rigorous training."
            </blockquote>
            <p className="text-muted-foreground text-sm leading-relaxed">
              With decades of experience in Carnatic music and a deep commitment to the Guru-Shishya tradition, Smt. Revathi Ramachandran leads Nada Gurukulam with a unique blend of artistic excellence and administrative vision.
            </p>
          </div>
          <div className="md:col-span-2 flex justify-center order-1 md:order-2">
            <div className="relative">
              <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/20">
                <img src={directorImg} alt="Smt. Revathi Ramachandran" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="absolute -top-3 -right-3 w-10 h-10 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    {/* ══════ LEADERSHIP BANNER ══════ */}
    <section className="relative w-full h-56 md:h-72 overflow-hidden">
      <img src={leadershipImg} alt="Our Leadership" className="w-full h-full object-cover object-top" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_69%_10%/0.85)] via-[hsl(0_0%_0%/0.3)] to-transparent flex items-end justify-center pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <div className="w-14 h-0.5 bg-secondary mx-auto mb-3 rounded-full" />
          <h3 className="font-serif text-2xl md:text-3xl text-primary-foreground font-bold" style={{ textShadow: "0 2px 20px hsl(0 0% 0% / 0.6)" }}>
            Our Leadership
          </h3>
        </motion.div>
      </div>
    </section>

    <SectionDivider />

    {/* ══════ CAMPUS BENTO ══════ */}
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Building2 className="h-5 w-5 text-secondary" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold">Our Campus</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            A world-class campus at Sathya Sai Grama, designed to inspire creativity and devotion.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-3 max-w-5xl mx-auto auto-rows-[160px]">
          {campusGrid.map((img, i) => (
            <motion.div
              key={img.alt}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`${img.className} rounded-2xl overflow-hidden shadow-lg group relative cursor-pointer`}
            >
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.7)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                <span className="text-primary-foreground text-xs font-semibold" style={{ textShadow: "0 1px 4px hsl(0 0% 0% / 0.5)" }}>{img.alt}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <SectionDivider />

    {/* ══════ PHILOSOPHY ══════ */}
    <section className="relative py-20 overflow-hidden">
      <img src={campusVault} alt="Heritage Passage" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.95)] to-[hsl(345_75%_12%/0.90)]" />
      <div className="relative z-10 container mx-auto px-4 max-w-3xl text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <div className="w-14 h-0.5 bg-secondary mx-auto mb-5 rounded-full" />
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-primary-foreground">Our Philosophy</h2>
          <h3 className="font-serif text-lg text-shimmer-gold font-semibold mb-4">The Guru-Shishya Parampara</h3>
          <p className="text-primary-foreground/75 leading-relaxed mb-4 text-base">
            At the heart of Nada Gurukulam lies the time-honored Guru-Shishya tradition — a sacred bond between teacher and student that goes beyond mere instruction.
          </p>
          <p className="text-primary-foreground/55 leading-relaxed text-sm">
            We believe that true learning happens not just through technique and practice, but through the transformative relationship with a Guru who imparts not only skill but wisdom, discipline, and devotion.
          </p>
        </motion.div>
      </div>
    </section>
  </div>
);

export default About;
