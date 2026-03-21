import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Clock, BarChart3, IndianRupee, Sparkles } from "lucide-react";
import { getCourseImage } from "@/lib/courseImages";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SectionDivider from "@/components/SectionDivider";

const CourseCatalog = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["catalog-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, categories(name)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || c.category_id === categoryFilter;
      const matchesLevel = levelFilter === "all" || c.level === levelFilter;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, search, categoryFilter, levelFilter]);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden section-dark grain-overlay pattern-overlay">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 80%, hsl(33 62% 58% / 0.08) 0%, transparent 60%)" }} />
        <div className="relative z-10 container mx-auto px-4 text-center py-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="font-serif text-5xl md:text-7xl font-extrabold text-primary-foreground mb-4" style={{ textShadow: "0 4px 40px hsl(0 0% 0% / 0.5)" }}>
              Course Catalog
            </h1>
            <p className="text-primary-foreground/60 max-w-2xl mx-auto text-lg mb-4">
              Explore our approved courses and begin your learning journey.
            </p>
            <span className="badge-gold inline-flex items-center gap-1.5 text-xs">
              <Sparkles className="h-3 w-3" /> {filtered.length} Courses Available
            </span>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Filters */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 mb-12 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <BarChart3 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[360px] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No courses found matching your criteria.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${search}-${categoryFilter}-${levelFilter}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
              >
                {filtered.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <Link to={`/course/${course.id}`} className="group block">
                      <div className="relative h-[360px] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 card-premium hover-magnetic border border-border">
                        {(course.thumbnail_url?.startsWith("http") || course.image_url?.startsWith("http")) ? (
                          <img
                            src={course.thumbnail_url || course.image_url || ""}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            loading="lazy"
                          />
                        ) : (
                          <img
                            src={getCourseImage(course)}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            loading="lazy"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.9)] via-[hsl(0_0%_0%/0.3)] to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex gap-2">
                          {course.level && (
                            <Badge variant="secondary" className="text-xs capitalize">{course.level}</Badge>
                          )}
                          {(course as any).categories?.name && (
                            <Badge variant="outline" className="text-xs bg-background/80">{(course as any).categories.name}</Badge>
                          )}
                        </div>

                        {/* Price */}
                        <div className="absolute top-4 right-4">
                          {course.price > 0 ? (
                            <div className="badge-gold flex items-center gap-0.5">
                              <IndianRupee className="h-3 w-3" />
                              {course.discount_price ? (
                                <>
                                  <span>{course.discount_price}</span>
                                  <span className="line-through opacity-60 ml-1">{course.price}</span>
                                </>
                              ) : (
                                <span>{course.price}</span>
                              )}
                            </div>
                          ) : (
                            <span className="badge-gold">Free</span>
                          )}
                        </div>

                        {/* Bottom info */}
                        <div className="absolute bottom-0 inset-x-0 p-6">
                          <div className="w-10 h-0.5 bg-secondary rounded-full mb-3 group-hover:w-16 transition-all duration-500" />
                          <h3 className="font-serif text-2xl font-bold text-primary-foreground leading-tight mb-2" style={{ textShadow: "0 2px 16px hsl(0 0% 0% / 0.7)" }}>
                            {course.title}
                          </h3>
                          {course.duration && (
                            <div className="flex items-center gap-1.5 text-primary-foreground/60 text-sm">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{course.duration}</span>
                            </div>
                          )}
                          {course.instructor_name && (
                            <p className="text-primary-foreground/50 text-sm mt-1">by {course.instructor_name}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
};

export default CourseCatalog;
