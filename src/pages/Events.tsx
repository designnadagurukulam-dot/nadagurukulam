import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, ArrowRight } from "lucide-react";
import { format, isPast } from "date-fns";
import SectionDivider from "@/components/SectionDivider";

const Events = () => {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const upcomingEvents = events.filter((e: any) => !isPast(new Date(e.event_date)));
  const pastEvents = events.filter((e: any) => isPast(new Date(e.event_date)));

  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <CalendarDays className="h-10 w-10 text-secondary mx-auto mb-4" />
            <h1 className="font-serif text-5xl md:text-6xl font-extrabold text-primary-foreground mb-4">Events</h1>
            <p className="text-primary-foreground/60 max-w-2xl mx-auto text-sm md:text-base tracking-wide">
              Stay updated with our concerts, workshops, and cultural celebrations.
            </p>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Upcoming Events */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold mb-10">
            Upcoming <span className="text-gradient-gold">Events</span>
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No upcoming events at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {upcomingEvents.map((event: any, i: number) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <div className="group rounded-2xl overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all duration-500 border border-border/50">
                    <div className="flex flex-col md:flex-row">
                      {event.image_url && (
                        <div className="md:w-72 h-48 md:h-auto shrink-0 overflow-hidden">
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      )}
                      <div className="flex-1 p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                            <CalendarDays className="h-3 w-3" />
                            {format(new Date(event.event_date), "MMM d, yyyy")}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.event_date), "h:mm a")}
                          </span>
                        </div>
                        <h3 className="font-serif text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                        {event.description && (
                          <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-3">{event.description}</p>
                        )}
                        {event.location && (
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-secondary" /> {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <>
          <SectionDivider />
          <section className="py-20 section-glass">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="font-serif text-3xl md:text-4xl font-extrabold mb-10">Past Events</h2>
              <div className="grid gap-4">
                {pastEvents.map((event: any, i: number) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-6 p-5 rounded-xl bg-card/50 border border-border/30"
                  >
                    <div className="text-center shrink-0 w-16">
                      <p className="text-2xl font-bold text-primary">{format(new Date(event.event_date), "d")}</p>
                      <p className="text-xs text-muted-foreground uppercase">{format(new Date(event.event_date), "MMM yyyy")}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-bold truncate">{event.title}</h3>
                      {event.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {event.location}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Events;
