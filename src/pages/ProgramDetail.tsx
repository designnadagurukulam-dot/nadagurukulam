import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Music, Clock, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionDivider from "@/components/SectionDivider";

import imgVocal from "@/assets/gallery/NGZ6R_1512_R.webp";
import imgMaleChorus from "@/assets/gallery/NGDSC_8160.webp";
import imgDanceGroup from "@/assets/gallery/NGDSC_7428.webp";
import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";
import imgSitar from "@/assets/gallery/NGMUSIC-2.webp";

interface ProgramInfo {
  name: string;
  category: string;
  img: string;
  description: string;
  highlights: string[];
  duration: string;
  level: string;
}

const programsData: Record<string, ProgramInfo> = {
  "carnatic-vocal": {
    name: "Carnatic Vocal",
    category: "Vocal",
    img: imgVocal,
    description:
      "Immerse yourself in the melodic traditions of South Indian classical music. This comprehensive program covers the foundational ragas, talas, and compositions of Carnatic music, guiding students from basic swaras to advanced kritis and manodharma sangeetam.",
    highlights: [
      "Sarali Varisai to Varnam progression",
      "Raga Alapana & Niraval techniques",
      "Compositions by Trinity of Carnatic Music",
      "Manodharma Sangeetam (improvisation)",
      "Concert preparation & stage performance",
    ],
    duration: "3 – 5 Years",
    level: "Beginner to Advanced",
  },
  "hindustani-vocal": {
    name: "Hindustani Vocal",
    category: "Vocal",
    img: imgMaleChorus,
    description:
      "Explore the rich heritage of North Indian classical music through this structured program. Students learn the art of Khayal, Dhrupad, and Thumri, developing mastery over ragas and layakari under the guidance of experienced gurus.",
    highlights: [
      "Alankar & Paltas for voice training",
      "Raga-based Khayal rendition",
      "Bandish learning in Vilambit & Drut",
      "Taan and Bol-Taan techniques",
      "Light classical forms: Thumri, Bhajan",
    ],
    duration: "3 – 5 Years",
    level: "Beginner to Advanced",
  },
  bharatanatyam: {
    name: "Bharatanatyam",
    category: "Dance",
    img: imgDanceGroup,
    description:
      "A classical dance form originating from Tamil Nadu, Bharatanatyam blends rhythm, expression, and spirituality. This program covers the Adavus, Jathis, and Margam, preparing students for solo recitals with grace and precision.",
    highlights: [
      "Basic Adavus & Aramandi techniques",
      "Jathis and Korvais",
      "Abhinaya (expressive storytelling)",
      "Full Margam performance training",
      "Arangetram preparation",
    ],
    duration: "4 – 6 Years",
    level: "Beginner to Advanced",
  },
  mridangam: {
    name: "Mridangam",
    category: "Instrumental",
    img: imgPercussion,
    description:
      "Master the king of Carnatic percussion. This program trains students in the intricate rhythmic patterns, jathis, and solkattu of the Mridangam, developing them into accomplished accompanists and solo performers.",
    highlights: [
      "Basic strokes & finger techniques",
      "Solkattu and rhythmic exercises",
      "Tala patterns: Adi, Rupaka, Misra Chapu",
      "Accompaniment for vocal & instrumental concerts",
      "Solo Tani Avartanam",
    ],
    duration: "3 – 5 Years",
    level: "Beginner to Advanced",
  },
  tabla: {
    name: "Tabla",
    category: "Instrumental",
    img: imgPercussion,
    description:
      "Learn the heartbeat of Hindustani music. The Tabla program covers the fundamental bols, kaidas, relas, and compositions across various gharanas, building a strong rhythmic foundation for both solo and accompaniment.",
    highlights: [
      "Basic bols & hand positioning",
      "Kaida, Rela, and Tukda compositions",
      "Exploration of various Gharanas",
      "Accompaniment techniques for Khayal & Ghazal",
      "Solo recital preparation",
    ],
    duration: "3 – 5 Years",
    level: "Beginner to Advanced",
  },
  sitar: {
    name: "Sitar",
    category: "Instrumental",
    img: imgSitar,
    description:
      "Discover the mesmerizing world of the Sitar with this structured program. Students learn the meend, gamak, and jor-jhala techniques while exploring the depth of Hindustani ragas through compositions and improvisation.",
    highlights: [
      "Right & left hand techniques",
      "Meend, Gamak, and Murki ornamentations",
      "Raga-based Gat compositions",
      "Alap, Jor, Jhala progression",
      "Raga exploration & improvisation",
    ],
    duration: "3 – 5 Years",
    level: "Beginner to Advanced",
  },
};

const ProgramDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const program = slug ? programsData[slug] : null;

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground text-lg">Program not found.</p>
        <Link to="/courses">
          <Button variant="outline">← Back to Programs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden">
        <motion.img
          src={program.img}
          alt={program.name}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.95)] via-[hsl(0_0%_0%/0.5)] to-[hsl(0_0%_0%/0.15)]" />

        <div className="relative z-10 container mx-auto px-4 pb-14 pt-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-primary-foreground/60 hover:text-primary-foreground text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Programs
            </Link>
            <span className="block text-secondary text-sm font-semibold tracking-widest uppercase mb-2">
              {program.category}
            </span>
            <h1
              className="font-serif text-5xl md:text-7xl font-extrabold text-primary-foreground mb-4"
              style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.6)" }}
            >
              {program.name}
            </h1>
            <div className="flex flex-wrap items-center gap-5 text-primary-foreground/70 text-sm">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {program.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" /> {program.level}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Content */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <h2 className="font-serif text-3xl font-bold mb-5">About this Program</h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-12">{program.description}</p>

            <h2 className="font-serif text-3xl font-bold mb-5">What You'll Learn</h2>
            <ul className="space-y-4 mb-12">
              {program.highlights.map((h, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <Music className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                  <span className="text-foreground">{h}</span>
                </motion.li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <Link to="/admissions">
                <Button size="lg" className="shadow-lg">Apply Now</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">Contact Us</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ProgramDetail;
