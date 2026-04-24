import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Star, Filter, MessageCircle, Eye, ChevronDown, ChevronUp, Download, Send, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";

const RATING_COLORS = ["hsl(0 72% 40%)", "hsl(24 95% 53%)", "hsl(40 75% 52%)", "hsl(84 65% 45%)", "hsl(142 71% 45%)"];

const RATING_OPTIONS = [
  { value: "0", label: "All Ratings" },
  { value: "1", label: "1 star rating" },
  { value: "2", label: "2 star rating" },
  { value: "3", label: "3 star rating" },
  { value: "4", label: "Above 4 star rating" },
  { value: "5", label: "5 star rating" },
];

const AdminFeedback = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [instructorProfiles, setInstructorProfiles] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<Record<string, any[]>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("0");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [chartCollapsed, setChartCollapsed] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from("feedback").select("*").order("submitted_at", { ascending: false });
    const items = data || [];
    setFeedback(items);

    const studentIds = items.map(f => f.student_id);
    const instructorIds = [...new Set(items.map(f => f.instructor_id).filter(Boolean))];
    const allIds = [...new Set([...studentIds, ...instructorIds])];
    if (allIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", allIds);
      const studentMap: Record<string, string> = {};
      const instrMap: Record<string, string> = {};
      (profs || []).forEach(p => {
        if (studentIds.includes(p.user_id)) studentMap[p.user_id] = p.display_name || "Student";
        if (instructorIds.includes(p.user_id)) instrMap[p.user_id] = p.display_name || "Instructor";
      });
      setProfiles(studentMap);
      setInstructorProfiles(instrMap);
    }

    // Fetch all responses
    const ids = items.map(i => i.id);
    if (ids.length) {
      const { data: resps } = await supabase.from("feedback_responses" as any).select("*").in("feedback_id", ids).order("created_at", { ascending: true });
      const map: Record<string, any[]> = {};
      ((resps as any[]) || []).forEach(r => {
        if (!map[r.feedback_id]) map[r.feedback_id] = [];
        map[r.feedback_id].push(r);
      });
      setResponses(map);
    }

    // Mark unread feedback as read for the admin badge
    const unreadIds = items.filter((i: any) => !i.read_by_admin).map(i => i.id);
    if (unreadIds.length) {
      await supabase.from("feedback").update({ read_by_admin: true } as any).in("id", unreadIds);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const parseCategoriesJson = (f: any): any[] | null => {
    try {
      const cats = f.categories;
      if (Array.isArray(cats) && cats.length > 0) return cats;
      return null;
    } catch { return null; }
  };

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    feedback.forEach(f => {
      if (f.category) cats.add(f.category);
      const jsonCats = parseCategoriesJson(f);
      if (jsonCats) jsonCats.forEach((c: any) => { if (c.category) cats.add(c.category); });
    });
    return [...cats].sort();
  }, [feedback]);

  const avgRating = useMemo(() => {
    let totalRating = 0, ratingCount = 0;
    feedback.forEach(f => {
      const cats = parseCategoriesJson(f);
      if (cats) cats.forEach((c: any) => { if (c.rating) { totalRating += c.rating; ratingCount++; } });
      else if (f.rating) { totalRating += f.rating; ratingCount++; }
    });
    return ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "—";
  }, [feedback]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    feedback.forEach(f => {
      const cats = parseCategoriesJson(f);
      if (cats) cats.forEach((c: any) => { if (c.rating >= 1 && c.rating <= 5) dist[c.rating - 1]++; });
      else if (f.rating >= 1 && f.rating <= 5) dist[f.rating - 1]++;
    });
    return dist.map((count, i) => ({ stars: `${i + 1}★`, count }));
  }, [feedback]);

  const clearFilters = () => {
    setInstructorFilter("all"); setCategoryFilter("all"); setRatingFilter("0"); setDateFrom(""); setDateTo("");
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
        // For "Above 4 star rating" we want rating > 4 (i.e., 5). For others, exact rating match.
        if (minRating === 4) {
          // "Above 4 star rating" -> rating must be strictly > 4
          if (cats) {
            if (!cats.some((c: any) => Number(c.rating || 0) > 4)) return false;
          } else if (Number(f.rating || 0) <= 4) return false;
        } else {
          if (cats) {
            if (!cats.some((c: any) => Number(c.rating || 0) === minRating)) return false;
          } else if (Number(f.rating || 0) !== minRating) return false;
        }
      }
      if (dateFrom && new Date(f.submitted_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo); end.setHours(23, 59, 59, 999);
        if (new Date(f.submitted_at) > end) return false;
      }
      return true;
    });
  }, [feedback, instructorFilter, categoryFilter, ratingFilter, dateFrom, dateTo]);

  const exportCSV = () => {
    const rows = [["Date", "Student", "Category", "Rating", "Message"]];
    feedback.forEach(f => {
      const cats = parseCategoriesJson(f);
      const name = profiles[f.student_id] || "Student";
      if (cats) {
        cats.forEach((c: any) => rows.push([
          f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "",
          name, c.category || "", c.rating?.toString() || "", c.comment || "",
        ]));
      } else {
        rows.push([
          f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "",
          name, f.category || "", f.rating?.toString() || "", f.message || "",
        ]);
      }
    });
    const csv = rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `feedback_export_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const sendReply = async (feedbackId: string) => {
    const message = replyDrafts[feedbackId]?.trim();
    if (!message || !user) return;
    const { error } = await supabase.from("feedback_responses" as any).insert({
      feedback_id: feedbackId,
      responder_id: user.id,
      message,
    });
    if (error) return toast.error(error.message);
    logActivity("feedback.replied", "feedback", feedbackId);
    toast.success("Reply sent");
    setReplyDrafts({ ...replyDrafts, [feedbackId]: "" });
    fetchData();
  };

  const instructorOptions = Object.entries(instructorProfiles).sort(([, a], [, b]) => a.localeCompare(b));

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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
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

      {/* Summary tiles: Total, Avg, Compact Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Feedback", value: feedback.length, icon: MessageSquare, gradient: "from-brand-primary to-brand-primary-dark" },
          { label: "Average Rating", value: avgRating, icon: Star, gradient: "from-brand-gold to-amber-600", isStar: true },
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
        {/* Compact rating distribution tile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5 text-brand-gold" /> Rating Distribution
            </p>
            <button onClick={() => setChartCollapsed(!chartCollapsed)} className="text-brand-warm-grey hover:text-brand-primary">
              {chartCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </button>
          </div>
          {!chartCollapsed && (
            <ResponsiveContainer width="100%" height={70}>
              <BarChart data={ratingDistribution} layout="vertical" barCategoryGap="20%">
                <XAxis type="number" hide />
                <YAxis dataKey="stars" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8C7B6B' }} width={26} />
                <Tooltip formatter={(v: number) => [`${v}`, 'Ratings']} contentStyle={{ borderRadius: 12, border: '0', boxShadow: '0 2px 16px hsl(1 57% 30% / 0.08)', fontSize: 11 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {ratingDistribution.map((_, i) => <Cell key={i} fill={RATING_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center self-end">
          <Filter className="h-4 w-4 text-brand-gold" />
        </div>
        <div>
          <label className="text-[10px] text-brand-warm-grey uppercase tracking-wide font-bold block mb-1">About Tutor</label>
          <Select value={instructorFilter} onValueChange={setInstructorFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Tutor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tutors</SelectItem>
              {instructorOptions.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-brand-warm-grey uppercase tracking-wide font-bold block mb-1">Category</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-brand-warm-grey uppercase tracking-wide font-bold block mb-1">Rating</label>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Rating" /></SelectTrigger>
            <SelectContent>
              {RATING_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-brand-warm-grey uppercase tracking-wide font-bold block mb-1">From date</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="text-[10px] text-brand-warm-grey uppercase tracking-wide font-bold block mb-1">To date</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-brand-warm-grey underline self-end">Clear filters</Button>
      </div>

      {/* Feedback list */}
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
            const replies = responses[f.id] || [];
            const submitterName = profiles[f.student_id] || "Student";
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center text-brand-primary font-serif font-bold text-xs">
                          {submitterName[0]?.toUpperCase() || "S"}
                        </div>
                        <span className="font-medium text-sm text-brand-charcoal">{submitterName}</span>
                        {f.instructor_id && instructorProfiles[f.instructor_id] && (
                          <Badge className="bg-brand-cream-dark text-brand-charcoal-mid border-0 text-[10px]">
                            → {instructorProfiles[f.instructor_id]}
                          </Badge>
                        )}
                        {f.category && !cats && (
                          <Badge className="bg-brand-gold-pale text-brand-gold-dark border border-brand-parchment text-[10px]">{f.category}</Badge>
                        )}
                        <span className="ml-auto text-xs text-brand-warm-grey">{f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : ""}</span>
                      </div>

                      {/* Categories or single comment — always visible */}
                      {cats ? (
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
                      ) : (
                        <p className="text-sm text-brand-charcoal/80 leading-relaxed">{f.message}</p>
                      )}

                      {/* Existing replies */}
                      {replies.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {replies.map((r: any) => (
                            <div key={r.id} className="bg-brand-gold-pale/50 border border-brand-parchment rounded-xl p-3">
                              <div className="flex items-center gap-2 text-[11px] text-brand-warm-grey mb-1">
                                <Eye className="h-3 w-3" /> Admin Reply · {new Date(r.created_at).toLocaleString()}
                              </div>
                              <p className="text-sm text-brand-charcoal/90">{r.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply form */}
                      <div className="mt-3 flex gap-2 items-start">
                        <Textarea
                          placeholder="Reply to this feedback…"
                          rows={2}
                          value={replyDrafts[f.id] || ""}
                          onChange={(e) => setReplyDrafts({ ...replyDrafts, [f.id]: e.target.value })}
                          className="flex-1 text-sm"
                        />
                        <Button onClick={() => sendReply(f.id)} disabled={!replyDrafts[f.id]?.trim()} className="gap-1 bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark">
                          <Send className="h-3.5 w-3.5" /> Send
                        </Button>
                      </div>
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
