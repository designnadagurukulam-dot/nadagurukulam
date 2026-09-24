import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Music, Clock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionDivider from "@/components/SectionDivider";
import InquiryFormDialog from "@/components/InquiryFormDialog";
import { getCourseImage } from "@/lib/courseImages";

// Static highlights data keyed by slug (enriches DB data)
const programHighlights: Record<string, string[]> = {
  "carnatic-vocal": [
    "Sarali Varisai to Varnam progression",
    "Raga Alapana & Niraval techniques",
    "Compositions by Trinity of Carnatic Music",
    "Manodharma Sangeetam (improvisation)",
    "Concert preparation & stage performance",
  ],
  "hindustani-vocal": [
    "Alankar & Paltas for voice training",
    "Raga-based Khayal rendition",
    "Bandish learning in Vilambit & Drut",
    "Taan and Bol-Taan techniques",
    "Light classical forms: Thumri, Bhajan",
  ],
  bharatanatyam: [
    "Basic Adavus & Aramandi techniques",
    "Jathis and Korvais",
    "Abhinaya (expressive storytelling)",
    "Full Margam performance training",
    "Arangetram preparation",
  ],
  mridangam: [
    "Basic strokes & finger techniques",
    "Solkattu and rhythmic exercises",
    "Tala patterns: Adi, Rupaka, Misra Chapu",
    "Accompaniment for vocal & instrumental concerts",
    "Solo Tani Avartanam",
  ],
  tabla: [
    "Basic bols & hand positioning",
    "Kaida, Rela, and Tukda compositions",
    "Exploration of various Gharanas",
    "Accompaniment techniques for Khayal & Ghazal",
    "Solo recital preparation",
  ],
  sitar: [
    "Right & left hand techniques",
    "Meend, Gamak, and Murki ornamentations",
    "Raga-based Gat compositions",
    "Alap, Jor, Jhala progression",
    "Raga exploration & improvisation",
  ],
};

const isUuid = (val?: string) => !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const ProgramDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const { data: program, isLoading } = useQuery({
    queryKey: ["program-detail", slug],
    queryFn: async () => {
      let query = supabase
        .from("courses")
        .select("*")
        .eq("status", "approved")
        .is("archived_at", null);

      if (isUuid(slug)) {
        query = query.eq("id", slug!);
      } else {
        query = query.eq("slug", slug!);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground text-lg">Course not found.</p>
        <Link to="/courses">
          <Button variant="outline">← Back to Courses</Button>
        </Link>
      </div>
    );
  }

  const highlights = (program?.slug && programHighlights[program.slug]) || (slug && programHighlights[slug]) || [];
  const image = getCourseImage(program);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden">
        <motion.img
          src={image}
          alt={program.title}
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
              <ArrowLeft className="h-4 w-4" /> Back to Courses
            </Link>
            {program.category && (
              <span className="block text-secondary text-sm font-semibold tracking-widest uppercase mb-2">
                {program.category}
              </span>
            )}
            <h1
              className="font-serif text-5xl md:text-7xl font-extrabold text-primary-foreground mb-4"
              style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.6)" }}
            >
              {program.title}
            </h1>
            <div className="flex flex-wrap items-center gap-5 text-primary-foreground/70 text-sm">
              {program.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {program.duration}
                </span>
              )}
              {program.level && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" /> {program.level}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Content */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            {program.description && (
              <>
                <h2 className="font-serif text-3xl font-bold mb-5">About this Program</h2>
                <p className="text-muted-foreground leading-relaxed text-lg mb-12">{program.description}</p>
              </>
            )}

            {highlights.length > 0 && (
              <>
                <h2 className="font-serif text-3xl font-bold mb-5">What You'll Learn</h2>
                <ul className="space-y-4 mb-12">
                  {highlights.map((h, i) => (
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
              </>
            )}

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="shadow-lg" onClick={() => setInquiryOpen(true)}>
                Apply Now
              </Button>
              <Link to="/contact">
                <Button size="lg" variant="outline">Contact Us</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <InquiryFormDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        programSlug={slug || ""}
        programName={program.title}
      />
    </div>
  );
};

export default ProgramDetail;
