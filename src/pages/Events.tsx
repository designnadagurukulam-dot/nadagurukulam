import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isPast, isSameMonth, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionDivider from "@/components/SectionDivider";

const Events = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventDates = events.map((e: any) => new Date(e.event_date));
  const hasEvent = (day: Date) => eventDates.some(d => isSameDay(d, day));

  const displayEvents = selectedDate
    ? events.filter((e: any) => isSameDay(new Date(e.event_date), selectedDate))
    : upcomingEvents;

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <CalendarDays className="h-10 w-10 text-secondary mx-auto mb-4" />
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary-foreground mb-4">Events</h1>
            <p className="text-primary-foreground/60 max-w-2xl mx-auto text-sm md:text-base tracking-wide">
              Stay updated with our concerts, workshops, and cultural celebrations.
            </p>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Calendar + Events */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Calendar panel */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
                {/* Month header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-primary/90">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-primary-foreground transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="font-serif text-lg font-bold text-primary-foreground">{format(currentMonth, "MMMM yyyy")}</h3>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-primary-foreground transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Today button */}
                <div className="px-4 pt-3 flex justify-end">
                  <button onClick={() => { setCurrentMonth(new Date()); setSelectedDate(null); }} className="text-xs text-secondary font-semibold hover:underline">
                    Today
                  </button>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 gap-0 px-3 pb-1">
                  {weekDays.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-2">{d}</div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-0 px-3 pb-4">
                  {calendarDays.map((day, i) => {
                    const inMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const dayHasEvent = hasEvent(day);
                    return (
                      <button
                        key={i}
                        onClick={() => dayHasEvent ? setSelectedDate(isSelected ? null : day) : setSelectedDate(null)}
                        className={`relative flex flex-col items-center justify-center h-10 w-full rounded-lg text-sm transition-all ${
                          !inMonth ? "text-muted-foreground/30" :
                          isSelected ? "bg-secondary text-secondary-foreground font-bold shadow-md" :
                          isToday ? "bg-primary/10 text-primary font-bold" :
                          dayHasEvent ? "text-foreground font-medium hover:bg-secondary/10" :
                          "text-foreground/60 hover:bg-muted/50"
                        } ${dayHasEvent && !isSelected ? "cursor-pointer" : dayHasEvent ? "cursor-pointer" : "cursor-default"}`}
                      >
                        {format(day, "d")}
                        {dayHasEvent && (
                          <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-secondary-foreground" : "bg-secondary"}`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Mobile date strip */}
                <div className="lg:hidden border-t border-border/30 p-3">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {upcomingEvents.slice(0, 10).map((e: any) => {
                      const d = new Date(e.event_date);
                      const isSelected2 = selectedDate && isSameDay(d, selectedDate);
                      return (
                        <button key={e.id} onClick={() => setSelectedDate(isSelected2 ? null : d)}
                          className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border transition-all min-w-[56px] ${
                            isSelected2 ? "bg-secondary text-secondary-foreground border-secondary" : "border-border/50 hover:border-secondary/50"
                          }`}>
                          <span className="text-[10px] uppercase font-semibold">{format(d, "MMM")}</span>
                          <span className="text-lg font-bold">{format(d, "d")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Events list */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl md:text-3xl font-extrabold">
                  {selectedDate ? (
                    <>Events on <span className="text-gradient-gold">{format(selectedDate, "MMM d, yyyy")}</span></>
                  ) : (
                    <>Upcoming <span className="text-gradient-gold">Events</span></>
                  )}
                </h2>
                {selectedDate && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} className="text-sm text-muted-foreground">
                    Show All
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : displayEvents.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">{selectedDate ? "No events on this date." : "No upcoming events. Check back soon!"}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayEvents.map((event: any, i: number) => {
                    const eventDate = new Date(event.event_date);
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                      >
                        <div className="group flex flex-col sm:flex-row rounded-2xl overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all duration-500 border-l-4 border-l-secondary border border-border/50">
                          {/* Date badge */}
                          <div className="sm:w-24 flex-shrink-0 flex sm:flex-col items-center justify-center gap-2 sm:gap-0 p-4 sm:py-6 bg-gradient-to-b from-secondary/10 to-secondary/5">
                            <span className="text-3xl sm:text-4xl font-extrabold text-primary leading-none">{format(eventDate, "d")}</span>
                            <div className="sm:mt-1 text-center">
                              <span className="text-xs font-bold text-secondary uppercase tracking-wider">{format(eventDate, "MMM")}</span>
                              <span className="text-[10px] text-muted-foreground block">{format(eventDate, "yyyy")}</span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col sm:flex-row">
                            {event.image_url && (
                              <div className="sm:w-48 h-40 sm:h-auto shrink-0 overflow-hidden">
                                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                              </div>
                            )}
                            <div className="flex-1 p-5 sm:p-6">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(eventDate, "h:mm a")}
                                </span>
                                {event.end_date && (
                                  <span className="text-xs text-muted-foreground">
                                    — {format(new Date(event.end_date), "h:mm a")}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-serif text-lg sm:text-xl font-bold mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                              {event.description && (
                                <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-2">{event.description}</p>
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
                    );
                  })}
                </div>
              )}

              {/* Past Events Accordion */}
              {pastEvents.length > 0 && !selectedDate && (
                <div className="mt-12">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="past" className="border-none">
                      <AccordionTrigger className="font-serif text-xl font-bold hover:no-underline py-4 px-0">
                        Past Events ({pastEvents.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {pastEvents.map((event: any) => {
                            const eventDate = new Date(event.event_date);
                            return (
                              <div key={event.id} className="flex items-center gap-4 sm:gap-6 p-4 rounded-xl bg-card/50 border border-border/30">
                                <div className="text-center shrink-0 w-14 sm:w-16">
                                  <p className="text-xl sm:text-2xl font-bold text-primary">{format(eventDate, "d")}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase">{format(eventDate, "MMM yyyy")}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-serif font-bold text-sm sm:text-base truncate">{event.title}</h3>
                                  {event.location && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <MapPin className="h-3 w-3" /> {event.location}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Events;
