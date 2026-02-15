import { useState } from "react";
import { motion } from "framer-motion";
import { Award, BookOpen, Calendar, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const faculty = [
  { name: "Smt. Revathi Ramachandran", spec: "Carnatic Vocal", cat: "carnatic", role: "Director & Lead Faculty", exp: "25+ years", awards: ["Sangeet Natak Akademi Award", "Kalaimamani Title"], bio: "A distinguished Carnatic vocalist and educator, Smt. Revathi has dedicated her life to preserving and propagating the rich tradition of South Indian classical music. Trained under legendary masters, she brings both depth and accessibility to her teaching.", education: ["B.A. Music — University of Madras", "M.A. Carnatic Music — Sri Venkateswara University", "Ph.D. — Musicology"] },
  { name: "Sri Raghunandan Panshikar", spec: "Hindustani Vocal", cat: "hindustani", role: "Senior Faculty", exp: "20+ years", awards: ["Kumar Gandharva Samman", "Tansen Award Nominee"], bio: "A powerful Hindustani vocalist trained in the Gwalior Gharana tradition, Sri Raghunandan brings the depth of khayal gayaki to students with clarity and passion.", education: ["Sangeet Visharad — Gandharva Mahavidyalaya", "M.A. Music — SNDT University"] },
  { name: "Ms. Manasvini Ramachandran", spec: "Bharatanatyam", cat: "bharatanatyam", role: "Lead Dance Faculty", exp: "15+ years", awards: ["Natya Shiromani Award", "Young Artist Fellowship"], bio: "A graceful and technically brilliant Bharatanatyam artist, Ms. Manasvini combines traditional Tanjore-style Bharatanatyam with contemporary choreographic sensibility.", education: ["B.F.A. Bharatanatyam — Kalakshetra", "M.A. Dance — University of Hyderabad"] },
  { name: "Sri Venkatesh Kumar", spec: "Mridangam", cat: "instrumental", role: "Percussion Faculty", exp: "18+ years", awards: ["Best Accompanist Award — Music Academy", "CCRT Fellowship"], bio: "A consummate mridangam artist known for his rhythmic precision and innovative approach. Sri Venkatesh has accompanied many leading Carnatic musicians.", education: ["Diploma in Mridangam — Karnataka College of Percussion", "M.Mus — University of Mysore"] },
  { name: "Sri Shashank Subramanyam", spec: "Flute", cat: "instrumental", role: "Flute Faculty", exp: "22+ years", awards: ["Padma Shri Nominee", "A-Grade Artist — All India Radio"], bio: "A flautist of extraordinary caliber, Sri Shashank has redefined Carnatic flute playing with his unique tonal quality and cross-genre collaborations.", education: ["Child prodigy — trained under Sri T.R. Mahalingam's lineage", "Honorary Doctorate — University of Mysore"] },
  { name: "Sri Abhishek Mishra", spec: "Tabla", cat: "instrumental", role: "Tabla Faculty", exp: "12+ years", awards: ["Ustad Bismillah Khan Yuva Puraskar"], bio: "A dynamic young tabla maestro of the Benares Gharana, Sri Abhishek brings energy and innovation to traditional tabla pedagogy.", education: ["B.Mus Tabla — Banaras Hindu University", "M.Mus — Delhi University"] },
];

const Faculty = () => {
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<typeof faculty[0] | null>(null);
  const filtered = tab === "all" ? faculty : faculty.filter((f) => f.cat === tab);

  return (
    <div>
      {/* Hero */}
      <section className="gradient-maroon py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">Meet Our Esteemed Gurus</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">Masters of their art, dedicated to nurturing the next generation.</p>
        </div>
      </section>

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
                <Card className="h-full hover:shadow-xl transition-shadow overflow-hidden group">
                  <div className="h-48 gradient-maroon flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground text-3xl font-serif font-bold">
                      {f.name.split(" ").pop()?.[0]}
                    </div>
                  </div>
                  <CardContent className="p-6">
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
