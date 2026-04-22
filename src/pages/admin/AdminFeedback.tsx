import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Star, Filter, MessageCircle, Eye, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const RATING_COLORS = ["hsl(0 72% 40%)", "hsl(24 95% 53%)", "hsl(40 75% 52%)", "hsl(84 65% 45%)", "hsl(142 71% 45%)"];

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [instructorProfiles, setInstructorProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("0");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("feedback").select("*").order("submitted_at", { ascending: false });
      const items = data || [];
      setFeedback(items);

      const nonAnon = items.filter(f => !f.is_anonymous).map(f => f.student_id);
      const instructorIds = [...new Set(items.map(f => f.instructor_id).filter(Boolean))];
      const allIds = [...new Set([...nonAnon, ...instructorIds])];
      if (allIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", allIds);
        const studentMap: Record<string, string> = {};
        const instrMap: Record<string, string> = {};
        (profs || []).forEach(p => {
          if (nonAnon.includes(p.user_id)) studentMap[p.user_id] = p.display_name || "Student";
          if (instructorIds.includes(p.user_id)) instrMap[p.user_id] = p.display_name || "Instructor";
        });
        setProfiles(studentMap);
        setInstructorProfiles(instrMap);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const parseCategoriesJson = (f: any): any[] | null => {
    try {
      const cats = f.categories;
      if (Array.isArray(cats) && cats.length > 0) return cats;
      return null;
    } catch { return null; }
  };

  // Extract all unique categories from both legacy and JSONB
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    filtered.forEach(f => {
      if (f.category) cats.add(f.category);
      const jsonCats = parseCategoriesJson(f);
      if (jsonCats) jsonCats.forEach((c: any) => { if (c.category) cats.add(c.category); });
    });
    return [...cats];
  }, [feedback]);

  // Compute average rating across all categories
  const avgRating = useMemo(() => {
    let totalRating = 0;
    let ratingCount = 0;
    feedback.forEach(f => {
      const cats = parseCategoriesJson(f);
      if (cats) {
        cats.forEach((c: any) => { if (c.rating) { totalRating += c.rating; ratingCount++; } });
      } else if (f.rating) {
        totalRating += f.rating;
        ratingCount++;
      }
    });
    return ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "—";
  }, [feedback]);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]; // 1-5 stars
    feedback.forEach(f => {
      const cats = parseCategoriesJson(f);
      if (cats) {
        cats.forEach((c: any) => { if (c.rating >= 1 && c.rating <= 5) dist[c.rating - 1]++; });
      } else if (f.rating >= 1 && f.rating <= 5) {
        dist[f.rating - 1]++;
      }
    });
    return dist.map((count, i) => ({ stars: `${i + 1}★`, count }));
  }, [feedback]);

  const clearFilters = () => {
    setInstructorFilter("all");
    setCategoryFilter("all");
    setRatingFilter("0");
    setDateFrom("");
    setDateTo("");
  };

  const filtered = useMemo(() => {
    return feedback.filter(f => {
      if (instructorFilter !== "all" && f.instructor_id !== instructorFilter) return false;
      if (categoryFilter !== "all") {
        const cats = parseCategoriesJson(f);
        const legacyMatch = f.category === categoryFilter;
        const jsonMatch = cats?.some((c: any) => c.category === categoryFilter);
        if (!legacyMatch && !jsonMatch) return false;
      }
      const minRating = Number(ratingFilter);
      if (minRating > 0) {
        const cats = parseCategoriesJson(f);
        if (cats) {
          const hasRating = cats.some((c: any) => Number(c.rating || 0) >= minRating);
          if (!hasRating) return false;
        } else if (Number(f.rating || 0) < minRating) return false;
      }
      if (dateFrom && new Date(f.submitted_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(f.submitted_at) > end) return false;
      }
      return true;
    });
  }, [feedback, instructorFilter, categoryFilter, ratingFilter, dateFrom, dateTo]);

  const exportCSV = () => {
    const rows = [["Date", "Student", "Anonymous", "Category", "Rating", "Message"]];
    feedback.forEach(f => {
      const cats = parseCategoriesJson(f);
      const name = f.is_anonymous ? "Anonymous" : (profiles[f.student_id] || "Student");
      if (cats) {
        cats.forEach((c: any) => {
          rows.push([
            f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "",
            name, f.is_anonymous ? "Yes" : "No",
            c.category || "", c.rating?.toString() || "", c.comment || "",
          ]);
        });
      } else {
        rows.push([
          f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "",
          name, f.is_anonymous ? "Yes" : "No",
          f.category || "", f.rating?.toString() || "", f.message || "",
        ]);
      }
    });
    const csv = rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const instructorOptions = Object.entries(instructorProfiles);

  if (loading) {
    return (
      <div className="space-y-6 pt-2">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-brand-primary">Student Feedback</h1>
              <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-brand-parchment rounded-xl hover:bg-brand-cream gap-1">
            <Download className="h-4 w-4 text-brand-gold" /> Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Feedback", value: feedback.length, icon: MessageSquare, gradient: "from-brand-primary to-brand-primary-dark" },
          { label: "Average Rating", value: avgRating, icon: Star, gradient: "from-brand-gold to-amber-600", isStar: true },
          { label: "Anonymous", value: feedback.filter(f => f.is_anonymous).length, icon: Eye, gradient: "from-brand-primary-dark to-rose-900" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {s.isStar && <Star className="h-4 w-4 text-brand-gold fill-brand-gold" />}
                  <p className="font-serif text-3xl font-bold text-brand-primary">{s.value}</p>
                </div>
                <p className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rating Distribution Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5">
        <h3 className="font-serif text-lg text-brand-primary mb-3">Rating Distribution</h3>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={ratingDistribution} layout="vertical" barCategoryGap="20%">
            <XAxis type="number" hide />
            <YAxis dataKey="stars" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8C7B6B' }} width={30} />
            <Tooltip formatter={(v: number) => [`${v}`, 'Ratings']} contentStyle={{ borderRadius: 12, border: '0', boxShadow: '0 2px 16px hsl(1 57% 30% / 0.08)', fontSize: 12 }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {ratingDistribution.map((_, i) => (
                <Cell key={i} fill={RATING_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
          <Filter className="h-4 w-4 text-brand-gold" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-brand-warm-grey uppercase tracking-wide font-bold">About</label>
          <Select value={instructorFilter} onValueChange={setInstructorFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Tutor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tutors</SelectItem>
              {instructorOptions.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-brand-warm-grey uppercase tracking-wide font-bold">Category</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-brand-warm-grey uppercase tracking-wide font-bold">Min Rating</label>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Rating" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Ratings</SelectItem>
              {[1, 2, 3, 4, 5].map(r => <SelectItem key={r} value={r.toString()}>{r}★ and above</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" aria-label="Date from" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" aria-label="Date to" />
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-brand-warm-grey underline">Clear filters</Button>
      </div>

      {/* Feedback List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-7 w-7 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl text-brand-primary">No Feedback Found</h3>
          <p className="text-sm text-brand-warm-grey mt-1">Adjust your filters to see results</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f, i) => {
            const cats = parseCategoriesJson(f);
            const isExpanded = expandedId === f.id;
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:bg-brand-cream hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center text-brand-primary font-serif font-bold text-xs">
                          {f.is_anonymous ? "?" : (profiles[f.student_id] || "S")[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-sm text-brand-charcoal">
                          {f.is_anonymous ? "Anonymous" : (profiles[f.student_id] || "Student")}
                        </span>
                        {f.instructor_id && instructorProfiles[f.instructor_id] && (
                          <Badge className="bg-brand-cream-dark text-brand-charcoal-mid border-0 text-[10px]">
                            → {instructorProfiles[f.instructor_id]}
                          </Badge>
                        )}
                        {f.category && !cats && (
                          <Badge className="bg-brand-gold-pale text-brand-gold-dark border border-brand-parchment text-[10px]">{f.category}</Badge>
                        )}
                      </div>

                      {cats ? (
                        <div>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : f.id)}
                            className="flex items-center gap-1.5 text-xs text-brand-primary font-semibold mb-2 hover:text-brand-gold transition-colors"
                          >
                            {cats.length} categories rated
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          {isExpanded && (
                            <div className="space-y-2.5 mt-2">
                              {cats.map((cat: any, ci: number) => (
                                <div key={ci} className="bg-brand-cream/60 rounded-xl p-3 border border-brand-parchment/50">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge className="bg-brand-gold-pale text-brand-gold-dark border border-brand-parchment text-[10px]">{cat.category}</Badge>
                                    <div className="flex items-center gap-0.5">
                                      {Array.from({ length: 5 }).map((_, si) => (
                                        <Star key={si} className={`h-3 w-3 ${si < cat.rating ? "text-brand-gold fill-brand-gold" : "text-brand-parchment"}`} />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-sm text-brand-charcoal/80 leading-relaxed">{cat.comment}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {!isExpanded && (
                            <p className="text-sm text-brand-charcoal/80 leading-relaxed line-clamp-2">{f.message}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-brand-charcoal/80 leading-relaxed">{f.message}</p>
                      )}

                      <p className="text-xs text-brand-warm-grey mt-2">
                        {f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                    {f.rating && !cats && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={`h-4 w-4 ${idx < f.rating ? "text-brand-gold fill-brand-gold" : "text-brand-parchment"}`} />
                        ))}
                      </div>
                    )}
                    {f.rating && cats && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="h-4 w-4 text-brand-gold fill-brand-gold" />
                        <span className="text-sm font-bold text-brand-primary">{f.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
