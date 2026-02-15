import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const Gallery = () => {
  const [tab, setTab] = useState("all");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const filtered = tab === "all" ? images : images.filter((img) => img.cat === tab);

  return (
    <div>
      {/* Hero */}
      <section className="gradient-maroon py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">Gallery</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">Moments of artistry, devotion, and celebration from Nada Gurukulam.</p>
        </div>
      </section>

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
                className="break-inside-avoid cursor-pointer group"
                onClick={() => setLightbox(img.src)}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 text-white p-2" onClick={() => setLightbox(null)}>
              <X className="h-8 w-8" />
            </button>
            <img src={lightbox.replace("w=600", "w=1200")} alt="Gallery" className="max-w-full max-h-[90vh] rounded-lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
