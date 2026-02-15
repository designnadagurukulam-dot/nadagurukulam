import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionDivider from "@/components/SectionDivider";

const images = [
  { src: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=600", cat: "performances", alt: "Classical dance performance" },
  { src: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600", cat: "events", alt: "Music concert event" },
  { src: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600", cat: "workshops", alt: "Music workshop" },
  { src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600", cat: "performances", alt: "Stage performance" },
  { src: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600", cat: "campus", alt: "Music practice" },
  { src: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600", cat: "events", alt: "Cultural event" },
  { src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600", cat: "workshops", alt: "Dance workshop" },
  { src: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=600", cat: "performances", alt: "Music performance" },
  { src: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600", cat: "campus", alt: "Campus life" },
];

const videos = [
  { title: "Annual Day Carnatic Concert 2024", thumb: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500" },
  { title: "Bharatanatyam Arangetram Highlights", thumb: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=500" },
  { title: "Guru Purnima Celebrations", thumb: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500" },
];

const Gallery = () => {
  const [tab, setTab] = useState("all");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const filtered = tab === "all" ? images : images.filter((img) => img.cat === tab);

  const navigate = (dir: -1 | 1) => {
    if (lightboxIdx === null) return;
    setLightboxIdx((lightboxIdx + dir + filtered.length) % filtered.length);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[45vh] flex items-center justify-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80" alt="Gallery" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_20%/0.88)] to-[hsl(345_75%_15%/0.8)]" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">Gallery</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">Moments of artistry, devotion, and celebration from Nada Gurukulam.</p>
        </div>
      </section>

      <SectionDivider />

      {/* Filter + Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <Tabs value={tab} onValueChange={setTab} className="mb-10">
            <TabsList className="mx-auto flex w-fit">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="performances">Performances</TabsTrigger>
              <TabsTrigger value="workshops">Workshops</TabsTrigger>
              <TabsTrigger value="campus">Campus Life</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filtered.map((img, i) => (
              <motion.div
                key={img.src}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="break-inside-avoid cursor-pointer group relative img-zoom rounded-lg overflow-hidden"
                onClick={() => setLightboxIdx(i)}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full rounded-lg shadow-md"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-sm font-medium text-foreground">{img.alt}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Video Gallery */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl font-bold text-center mb-10">Video Gallery</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v) => (
              <div key={v.title} className="group cursor-pointer">
                <div className="relative rounded-lg overflow-hidden img-zoom shadow-md">
                  <img src={v.thumb} alt={v.title} className="w-full h-48 object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center group-hover:bg-primary/50 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-secondary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 text-secondary-foreground ml-0.5" />
                    </div>
                  </div>
                </div>
                <p className="mt-3 font-semibold text-sm">{v.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[hsl(0_0%_0%/0.92)] flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <button className="absolute top-4 right-4 text-primary-foreground p-2 hover:bg-primary-foreground/10 rounded-full" onClick={() => setLightboxIdx(null)}>
              <X className="h-8 w-8" />
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground p-2 hover:bg-primary-foreground/10 rounded-full"
              onClick={(e) => { e.stopPropagation(); navigate(-1); }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-foreground p-2 hover:bg-primary-foreground/10 rounded-full"
              onClick={(e) => { e.stopPropagation(); navigate(1); }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
            <img
              src={filtered[lightboxIdx].src.replace("w=600", "w=1200")}
              alt={filtered[lightboxIdx].alt}
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
