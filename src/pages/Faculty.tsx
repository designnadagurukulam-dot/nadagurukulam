import { useState } from "react";
import { motion } from "framer-motion";
import { Award, BookOpen, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionDivider from "@/components/SectionDivider";

import imgVocal from "@/assets/gallery/NGZ6R_1512_R.webp";
import imgPercussion from "@/assets/gallery/NGZ6R_6439_R.webp";
import imgSitar from "@/assets/gallery/NGMUSIC-2.webp";
import imgGuruShishya from "@/assets/gallery/NGDANCE-3.webp";
import imgMaleChorus from "@/assets/gallery/NGDSC_8160.webp";
import imgVocalClose from "@/assets/gallery/NGIMG_2141.webp";
import imgDanceRed from "@/assets/gallery/NGDSC_0608_R.webp";

const faculty = [
  { name: "Smt. Revathi Ramachandran", spec: "Carnatic Vocal", cat: "carnatic", role: "Director & Lead Faculty", exp: "25+ years", img: imgVocal, awards: ["Sangeet Natak Akademi Award", "Kalaimamani Title"], bio: "A distinguished Carnatic vocalist and educator, Smt. Revathi has dedicated her life to preserving and propagating the rich tradition of South Indian classical music.", education: ["B.A. Music — University of Madras", "M.A. Carnatic Music — Sri Venkateswara University", "Ph.D. — Musicology"] },
  { name: "Sri Raghunandan Panshikar", spec: "Hindustani Vocal", cat: "hindustani", role: "Senior Faculty", exp: "20+ years", img: imgMaleChorus, awards: ["Kumar Gandharva Samman", "Tansen Award Nominee"], bio: "A powerful Hindustani vocalist trained in the Gwalior Gharana tradition, bringing depth of khayal gayaki to students with clarity and passion.", education: ["Sangeet Visharad — Gandharva Mahavidyalaya", "M.A. Music — SNDT University"] },
  { name: "Ms. Manasvini Ramachandran", spec: "Bharatanatyam", cat: "bharatanatyam", role: "Lead Dance Faculty", exp: "15+ years", img: imgGuruShishya, awards: ["Natya Shiromani Award", "Young Artist Fellowship"], bio: "A graceful and technically brilliant Bharatanatyam artist, combining traditional Tanjore-style Bharatanatyam with contemporary choreographic sensibility.", education: ["B.F.A. Bharatanatyam — Kalakshetra", "M.A. Dance — University of Hyderabad"] },
  { name: "Sri Venkatesh Kumar", spec: "Mridangam", cat: "instrumental", role: "Percussion Faculty", exp: "18+ years", img: imgPercussion, awards: ["Best Accompanist Award — Music Academy", "CCRT Fellowship"], bio: "A consummate mridangam artist known for rhythmic precision and innovative approach. Has accompanied many leading Carnatic musicians.", education: ["Diploma in Mridangam — Karnataka College of Percussion", "M.Mus — University of Mysore"] },
  { name: "Sri Shashank Subramanyam", spec: "Sitar", cat: "instrumental", role: "Sitar Faculty", exp: "22+ years", img: imgSitar, awards: ["Padma Shri Nominee", "A-Grade Artist — All India Radio"], bio: "A sitarist of extraordinary caliber who has redefined classical sitar playing with unique tonal quality and cross-genre collaborations.", education: ["Trained under legendary sitar lineage", "Honorary Doctorate — University of Mysore"] },
  { name: "Sri Abhishek Mishra", spec: "Tabla", cat: "instrumental", role: "Tabla Faculty", exp: "12+ years", img: imgVocalClose, awards: ["Ustad Bismillah Khan Yuva Puraskar"], bio: "A dynamic young tabla maestro of the Benares Gharana, bringing energy and innovation to traditional tabla pedagogy.", education: ["B.Mus Tabla — Banaras Hindu University", "M.Mus — Delhi University"] },
];

const Faculty = () => {
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<typeof faculty[0] | null>(null);
  const filtered = tab === "all" ? faculty : faculty.filter((f) => f.cat === tab);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[45vh] flex items-center justify-center overflow-hidden">
        <img src={imgDanceRed} alt="Faculty" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_20%/0.88)] to-[hsl(345_75%_15%/0.8)]" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">Meet Our Esteemed Gurus</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">Masters of their art, dedicated to nurturing the next generation.</p>
        </div>
      </section>

      <SectionDivider />

      {/* Filter + Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <Tabs value={tab} onValueChange={setTab} className="mb-10">
            <TabsList className="mx-auto flex w-fit">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="carnatic">Carnatic</TabsTrigger>
              <TabsTrigger value="hindustani">Hindustani</TabsTrigger>
              <TabsTrigger value="bharatanatyam">Bharatanatyam</TabsTrigger>
              <TabsTrigger value="instrumental">Instrumental</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((f, i) => (
              <motion.div key={f.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}>
                <Card className="h-full hover:shadow-xl transition-all overflow-hidden group hover:border-secondary/50">
                  <div className="h-52 img-zoom relative">
                    <img src={f.img} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent" />
                  </div>
                  <CardContent className="p-6 -mt-4 relative z-10">
                    <h3 className="font-serif text-lg font-semibold">{f.name}</h3>
                    <p className="text-secondary text-sm font-medium">{f.spec}</p>
                    <p className="text-xs text-muted-foreground mt-1">{f.role} · {f.exp}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {f.awards.slice(0, 2).map((a) => (
                        <span key={a} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary-foreground">
                          <Award className="h-2.5 w-2.5" /> {a}
                        </span>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setSelected(f)}>View Profile</Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Profile Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <div className="w-full h-48 -mt-6 -mx-6 mb-4 overflow-hidden rounded-t-lg" style={{ width: "calc(100% + 3rem)" }}>
                <img src={selected.img} alt={selected.name} className="w-full h-full object-cover" />
              </div>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">{selected.name}</DialogTitle>
                <p className="text-secondary font-medium text-sm">{selected.spec} · {selected.role}</p>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.bio}</p>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-1 mb-2"><BookOpen className="h-4 w-4" /> Education</h4>
                  <ul className="space-y-1">
                    {selected.education.map((e) => <li key={e} className="text-xs text-muted-foreground">• {e}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-1 mb-2"><Award className="h-4 w-4" /> Awards & Accolades</h4>
                  <ul className="space-y-1">
                    {selected.awards.map((a) => <li key={a} className="text-xs text-muted-foreground">• {a}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-1 mb-2"><Calendar className="h-4 w-4" /> Experience</h4>
                  <p className="text-xs text-muted-foreground">{selected.exp} of teaching and performance</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Faculty;
