import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Award, Calendar, GraduationCap, Briefcase, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { facultyMembers } from "@/data/facultyData";
import SectionDivider from "@/components/SectionDivider";

const GoldDivider = () => (
  <div className="flex items-center gap-3">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
    <div className="w-2 h-2 rounded-full bg-secondary/40" />
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
  </div>
);

const FacultyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const faculty = facultyMembers.find((f) => f.id === id);

  if (!faculty) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="font-serif text-3xl font-bold">Faculty Not Found</h1>
        <Button asChild variant="outline">
          <Link to="/faculty"><ArrowLeft className="h-4 w-4 mr-2" />Back to Faculty</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden grain-overlay">
        <motion.img
          src={faculty.image}
          alt={faculty.name}
          className="absolute inset-0 w-full h-full object-cover object-[center_15%]"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_69%_10%/0.97)] via-[hsl(0_0%_0%/0.4)] to-[hsl(0_0%_0%/0.1)]" />
        <div className="relative z-10 container mx-auto px-4 pb-12 pt-28">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Button asChild variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-6">
              <Link to="/faculty"><ArrowLeft className="h-4 w-4 mr-2" />Back to Faculty</Link>
            </Button>
            <div className="w-14 h-0.5 bg-secondary rounded-full mb-4" />
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-primary-foreground mb-2" style={{ textShadow: "0 4px 20px hsl(0 0% 0% / 0.5)" }}>
              {faculty.name}
            </h1>
            <p className="text-secondary text-lg font-semibold mb-1">{faculty.specialization}</p>
            <p className="text-primary-foreground/50 text-sm">{faculty.title}</p>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Detail Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-10">
            {/* Left — Photo + Quick Info */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="md:col-span-1">
              <div className="relative vignette-gold">
                <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-secondary/15 mb-6">
                  <img src={faculty.image} alt={faculty.name} className="w-full aspect-[3/4] object-cover object-[center_15%]" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="text-muted-foreground">{faculty.experience} of experience</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="text-muted-foreground">{faculty.specialization}</span>
                </div>
              </div>
            </motion.div>

            {/* Right — Bio, Education, Experience, Specialities, Awards */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="md:col-span-2 space-y-10">
              {/* About */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                    <BookOpen className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-serif text-xl font-bold">About</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">{faculty.bio}</p>
              </div>

              <GoldDivider />

              {/* Education */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-md">
                    <GraduationCap className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <h2 className="font-serif text-xl font-bold">Education</h2>
                </div>
                <ul className="space-y-3">
                  {faculty.education.map((edu) => (
                    <li key={edu} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2 shrink-0" />
                      <span className="text-muted-foreground">{edu}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Experience */}
              {faculty.experienceDetails.length > 0 && (
                <>
                  <GoldDivider />
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                        <Briefcase className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <h2 className="font-serif text-xl font-bold">Experience</h2>
                    </div>
                    <ul className="space-y-4">
                      {faculty.experienceDetails.map((exp, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-secondary mt-2 shrink-0" />
                          <span className="text-muted-foreground leading-relaxed">{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Specialities */}
              {faculty.specialities.length > 0 && (
                <>
                  <GoldDivider />
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-md">
                        <Sparkles className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <h2 className="font-serif text-xl font-bold">Specialities</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {faculty.specialities.map((spec) => (
                        <span key={spec} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/15 transition-colors">
                          <Sparkles className="h-3.5 w-3.5" />
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Awards */}
              {faculty.awards.length > 0 && (
                <>
                  <GoldDivider />
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                        <Award className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <h2 className="font-serif text-xl font-bold">Awards & Recognition</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {faculty.awards.map((award) => (
                        <span key={award} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/15 transition-colors">
                          <Award className="h-3.5 w-3.5" />
                          {award}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FacultyDetail;
