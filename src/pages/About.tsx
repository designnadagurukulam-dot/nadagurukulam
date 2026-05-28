import { motion, useScroll, useTransform } from "framer-motion";
import { Target, Eye, Building2, Heart } from "lucide-react";
import { useRef } from "react";
import SectionDivider from "@/components/SectionDivider";

import founderImg from "@/assets/founders/SadguruSriMadhusudanSai.jpg";
import directorImg from "@/assets/founders/SmtRevathiRamachandran.webp";
import leadershipImg from "@/assets/founders/Director.webp";
import campusAerial from "@/assets/campus/NGCampusAerial.jpg";
import campusAmphitheatre from "@/assets/campus/NGAmphitheatre.jpg";
import campusVault from "@/assets/campus/NGVaultPassage.jpg";
import campusVerandah from "@/assets/campus/NGVerandah.jpg";
import campusReception from "@/assets/campus/NGReception.jpg";
import campusAmphyEntry from "@/assets/campus/NGAmphyEntry.jpg";
import heroPerformance from "@/assets/gallery/NGR6_M1630.webp";

const campusGrid = [
  { src: campusAerial, alt: "Campus Aerial View", className: "col-span-2 row-span-2" },
  { src: campusAmphitheatre, alt: "Central Amphitheatre", className: "" },
  { src: campusReception, alt: "Reception Hall", className: "" },
  { src: campusVault, alt: "Heritage Vault Passage", className: "row-span-2" },
  { src: campusVerandah, alt: "Verandah Walkway", className: "col-span-2" },
  { src: campusAmphyEntry, alt: "Amphitheatre Entry", className: "" },
];

const About = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImgY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <div>
      {/* ══════ HERO ══════ */}
      <section ref={heroRef} className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
        <motion.img
          src={heroPerformance}
          alt="Classical performance at Nada Gurukulam"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ y: heroImgY }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(358_68%_6%/0.93)] via-[hsl(358_68%_14%/0.87)] to-[hsl(358_68%_10%/0.92)]" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 60%, hsl(33 62% 58% / 0.08) 0%, transparent 50%)" }}
        />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-devanagari text-3xl md:text-5xl lg:text-6xl text-shimmer-gold mb-4 leading-relaxed overflow-visible py-2"
          >
            रसो वै सः
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-primary-foreground/50 italic text-lg md:text-2xl tracking-[0.3em] uppercase"
          >
            "He is the essence of all Rasa"
          </motion.p>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ FOUNDER ══════ */}
      <section className="py-24 bg-background golden-sweep relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-5 gap-12 items-center"
          >
            <div className="md:col-span-2 flex justify-center">
              <div className="relative vignette-gold">
                {/* Rotating chakra behind founder photo */}
                <motion.div
                  aria-hidden
                  className="absolute -inset-6 pointer-events-none opacity-40"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                >
                  <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
                    <circle cx="100" cy="100" r="96" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="88" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeDasharray="2 4" />
                    {Array.from({ length: 24 }).map((_, i) => (
                      <line
                        key={i}
                        x1="100" y1="6" x2="100" y2="22"
                        stroke="hsl(var(--primary))"
                        strokeWidth="1.5"
                        transform={`rotate(${i * 15} 100 100)`}
                      />
                    ))}
                  </svg>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  className="relative w-56 h-64 sm:w-64 sm:h-72 md:w-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl golden-frame"
                >
                  <img
                    src={founderImg}
                    alt="Sadguru Sri Madhusudan Sai"
                    className="w-full h-full object-cover object-[center_15%]"
                    loading="lazy"
                  />
                </motion.div>
                <motion.span
                  className="absolute -top-6 -left-4 font-serif text-[7rem] leading-none text-secondary/20 pointer-events-none select-none z-10"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: false, amount: 0.2 }}
                >
                  "
                </motion.span>
              </div>
            </div>
            <div className="md:col-span-3">
              <motion.div
                className="card-glass-gold rounded-2xl p-8 md:p-10"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ delay: 0.2, duration: 0.7 }}
              >
                <span className="text-secondary text-xs tracking-[0.3em] uppercase font-semibold">
                  Founder's Message
                </span>
                <h2 className="font-serif text-2xl md:text-3xl font-bold mt-3 mb-1 text-brand-primary">Sadguru Sri Madhusudan Sai</h2>
                <p className="text-muted-foreground text-sm mb-3">Founder, Nada Gurukulam</p>
                <div className="w-16 h-0.5 bg-secondary rounded-full mb-6" />
                <blockquote className="border-l-4 border-secondary pl-5 italic text-foreground mb-4 leading-relaxed text-sm md:text-base">
                  "nāda brahma, says our scriptures. Sound is divine or 'parameṣṭi', as it is called. And while the
                  seven notes of music have been inspired by various sounds in creation or 'sṛṣṭi', it is the singular
                  privilege of humans or 'vyaṣṭi' to sing and play music."
                </blockquote>
                <blockquote className="border-l-4 border-secondary pl-5 italic text-foreground/90 leading-relaxed text-sm md:text-base">
                  "To practise, promote and propagate this rich cultural and spiritual Indian music tradition is the
                  purpose of establishing the Department of Music and Performing Arts at the Sri Sathya Sai University
                  for Human Excellence."
                </blockquote>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ VISION & MISSION — Timeline style ══════ */}
      <section className="py-24 bg-background overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-16"
          >
            Our <span className="text-gradient-gold">Foundation</span>
          </motion.h2>

          {/* Vertical golden timeline */}
          <div className="relative">
            {/* Golden connecting line */}
            <div
              className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2"
              style={{
                background:
                  "linear-gradient(180deg, hsl(33 62% 58% / 0.5), hsl(33 62% 58% / 0.2), hsl(33 62% 58% / 0.5))",
              }}
            />

            {[
              {
                icon: Eye,
                title: "Our Vision",
                color: "from-primary to-primary/80",
                desc: "To be a global center of excellence for Indian classical music and dance education, preserving ancient traditions while embracing modern pedagogical methods.",
              },
              {
                icon: Target,
                title: "Our Mission",
                color: "from-secondary to-accent",
                desc: "Preserve and promote Indian classical art forms through authentic Guru-Shishya training. Make quality education accessible worldwide.",
              },
              {
                icon: Heart,
                title: "Our Values",
                color: "from-primary to-secondary",
                desc: "Devotion to the art, respect for tradition, excellence in teaching, inclusivity for all backgrounds, and spiritual growth through music.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ delay: i * 0.2, duration: 0.7 }}
                className={`relative flex items-start gap-6 mb-16 last:mb-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} flex-row`}
              >
                {/* Timeline dot */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                  >
                    <item.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                </div>

                {/* Card */}
                <div className={`ml-20 md:ml-0 ${i % 2 === 0 ? "md:mr-[55%]" : "md:ml-[55%]"} w-full md:w-[40%]`}>
                  <div className="card-glass-gold rounded-2xl p-8 hover:shadow-xl transition-shadow duration-500">
                    <h3 className="font-serif text-2xl md:text-3xl font-bold mb-4">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══════ DIRECTOR ══════ */}
      <section className="py-24 bg-background golden-sweep relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-5 gap-12 items-center"
          >
            <div className="md:col-span-3 order-2 md:order-1">
              <motion.div
                className="card-glass-gold rounded-2xl p-8 md:p-10"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ delay: 0.2, duration: 0.7 }}
              >
                <span className="text-primary text-xs tracking-[0.3em] uppercase font-semibold">Director</span>
                <h2 className="font-serif text-2xl md:text-3xl font-bold mt-3 mb-1">Smt. Revathi Ramachandran</h2>
                <div className="w-16 h-0.5 bg-primary rounded-full mb-6" />
                <blockquote className="border-l-4 border-primary/40 pl-5 italic text-foreground/70 mb-4 leading-relaxed text-base">
                  "Every student who walks through our doors carries within them the potential for artistic greatness.
                  Our duty is to nurture that seed with patience, love, and rigorous training."
                </blockquote>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  With decades of experience in Carnatic music and a deep commitment to the Guru-Shishya tradition, Smt.
                  Revathi Ramachandran leads Nada Gurukulam with a unique blend of artistic excellence and
                  administrative vision.
                </p>
              </motion.div>
            </div>
            <div className="md:col-span-2 flex justify-center order-1 md:order-2">
              <div className="relative vignette-gold">
                <div className="w-52 h-64 sm:w-60 sm:h-72 md:w-72 md:h-80 rounded-2xl overflow-hidden shadow-2xl golden-frame">
                  <img
                    src={directorImg}
                    alt="Smt. Revathi Ramachandran"
                    className="w-full h-full object-cover object-[center_15%]"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════ OUR VISION ══════ */}
      <section className="py-24 bg-background golden-sweep relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-5 gap-12 items-center"
          >
            <div className="md:col-span-2 flex justify-center">
              <div className="relative vignette-gold">
                <div className="w-60 h-72 sm:w-72 sm:h-80 md:w-96 md:h-[28rem] rounded-2xl overflow-hidden shadow-2xl golden-frame">
                  <img
                    src={leadershipImg}
                    alt="Smt Revathi Ramachandran - Director"
                    className="w-full h-full object-cover object-[center_15%]"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
            <div className="md:col-span-3">
              <motion.div
                className="card-glass-gold rounded-2xl p-8 md:p-10"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ delay: 0.2, duration: 0.7 }}
              >
                <span className="text-secondary text-xs tracking-[0.3em] uppercase font-semibold">
                  Director's Message
                </span>
                <h2 className="font-serif text-2xl md:text-3xl font-bold mt-3 mb-1">Our Vision</h2>
                <p className="text-muted-foreground text-sm mb-3 italic">
                  A gentle yet rigorous pathway from foundation to performance: rooted in the guru–śiṣya tradition—clear
                  progression, patient mentorship, and space for devotion.
                </p>
                <div className="w-16 h-0.5 bg-secondary rounded-full mb-6" />
                <p className="text-foreground/70 leading-relaxed text-sm md:text-base mb-4">
                  Nada Gurukulam will nurture creative excellence and foster cultural understanding. Its vision is to
                  inspire and challenge young minds to develop into caring and committed citizens of Bharat, who aspire
                  to achieve excellence in their chosen field of art and pursue knowledge throughout their life. The
                  institution would strive to motivate innovations in Performing arts and Visual arts enriching life and
                  shaping the future of the country through arts.
                </p>
                <p className="text-foreground/70 leading-relaxed text-sm md:text-base mb-6">
                  Nada Gurukulam will not only inculcate the means of living but also the wisdom of living through
                  dissemination of fine arts in its most pristine form. Nada Gurukulam will create an ambience of
                  culture and incite cultural exchange and dialogue, using the Performing arts and Visual arts to unite
                  communities and promote understanding globally.
                </p>
                <p className="text-muted-foreground text-sm font-semibold">Smt Revathi Ramachandran</p>
                <p className="text-muted-foreground text-xs">Director, Nada Gurukulam</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
      <SectionDivider />


      {/* ══════ PHILOSOPHY ══════ */}
      <section className="relative py-28 overflow-hidden">
        <img src={campusVault} alt="Heritage Passage" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(358_68%_6%/0.96)] to-[hsl(358_68%_8%/0.93)]" />

        <div className="relative z-10 container mx-auto px-4 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            <div className="w-16 h-0.5 bg-secondary mx-auto mb-6 rounded-full" />
            <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl font-extrabold mb-4 text-primary-foreground">
              Our Philosophy
            </h2>
            <h3 className="font-serif text-lg md:text-xl text-shimmer-gold font-semibold mb-6">
              The Guru-Shishya Parampara
            </h3>
            <p className="text-primary-foreground/70 leading-relaxed mb-4 text-base md:text-lg">
              At the heart of Nada Gurukulam lies the time-honored Guru-Shishya tradition — a sacred bond between
              teacher and student that goes beyond mere instruction.
            </p>
            <p className="text-primary-foreground/45 leading-relaxed text-sm md:text-base">
              We believe that true learning happens not just through technique and practice, but through the
              transformative relationship with a Guru who imparts not only skill but wisdom, discipline, and devotion.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
