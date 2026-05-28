import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Star, Filter, MessageCircle, Eye, ChevronDown, ChevronUp, Download, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";

const RATING_OPTIONS = [
  { value: "0", label: "All Ratings" },
  { value: "1", label: "1 star rating" },
  { value: "2", label: "2 star rating" },
  { value: "3", label: "3 star rating" },
  { value: "4", label: "4 star and above" },
];

const renderStars = (rating: number, size = "h-3.5 w-3.5") => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`${size} ${i < Math.round(rating) ? "text-brand-gold fill-brand-gold" : "text-brand-parchment"}`} />
    ))}
  </div>
);

const AdminFeedback = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => {
    localStorage.setItem("lastViewed:feedback", new Date().toISOString());
    queryClient.invalidateQueries({ queryKey: ["sidebar-counts"] });
  }, [queryClient]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [instructorProfiles, setInstructorProfiles] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<Record<string, any[]>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("0");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statsOpen, setStatsOpen] = useState(false);

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

    const unreadIds = items.filter((i: any) => !i.read_by_admin).map(i => i.id);
    if (unreadIds.length) {
      await supabase.from("feedback").update({ read_by_admin: true } as any).in("id", unreadIds);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const parseCategoriesJson = (f: any): any[] | null => {
    const cats = f.categories;
    if (Array.isArray(cats) && cats.length > 0) return cats;
    return null;
  };

  // Submission-level average: average of all category ratings on that one submission
  const submissionAvg = (f: any): number => {
    const cats = parseCategoriesJson(f);
    if (cats) {
      const rs = cats.map((c: any) => Number(c.rating || 0)).filter((n: number) => n > 0);
      if (!rs.length) return 0;
      return rs.reduce((a: number, b: number) => a + b, 0) / rs.length;
    }
    return Number(f.rating || 0);
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

  // Per-category averages for the stats popup
  const categoryStats = useMemo(() => {
    const acc: Record<string, { sum: number; n: number }> = {};
    feedback.forEach(f => {
      const cats = parseCategoriesJson(f);
      if (cats) cats.forEach((c: any) => {
        const key = c.category || "General";
        const r = Number(c.rating || 0);
        if (r > 0) {
          acc[key] = acc[key] || { sum: 0, n: 0 };
          acc[key].sum += r; acc[key].n += 1;
        }
      });
      else if (f.rating) {
        const key = f.category || "General";
        acc[key] = acc[key] || { sum: 0, n: 0 };
        acc[key].sum += Number(f.rating); acc[key].n += 1;
      }
    });
    return Object.entries(acc).map(([cat, v]) => ({ cat, avg: v.sum / v.n, n: v.n })).sort((a, b) => b.avg - a.avg);
  }, [feedback]);

  // Per-instructor averages (top 5)
  const instructorStats = useMemo(() => {
    const acc: Record<string, { sum: number; n: number }> = {};
    feedback.forEach(f => {
      if (!f.instructor_id) return;
      const avg = submissionAvg(f);
      if (avg > 0) {
        acc[f.instructor_id] = acc[f.instructor_id] || { sum: 0, n: 0 };
        acc[f.instructor_id].sum += avg; acc[f.instructor_id].n += 1;
      }
    });
    return Object.entries(acc).map(([id, v]) => ({ name: instructorProfiles[id] || "Instructor", avg: v.sum / v.n, n: v.n }))
      .sort((a, b) => b.avg - a.avg).slice(0, 5);
  }, [feedback, instructorProfiles]);

  const overallStats = useMemo(() => {
    const subs = feedback.length;
    const raters = new Set(feedback.map(f => f.student_id)).size;
    const allRatings: number[] = [];
    feedback.forEach(f => {
      const cats = parseCategoriesJson(f);
      if (cats) cats.forEach((c: any) => { if (c.rating) allRatings.push(Number(c.rating)); });
      else if (f.rating) allRatings.push(Number(f.rating));
    });
    const sorted = [...allRatings].sort((a, b) => a - b);
    const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : 0;
    const pctHigh = sorted.length ? (sorted.filter(r => r >= 4).length / sorted.length) * 100 : 0;
    return { subs, raters, median: median.toFixed(1), pctHigh: pctHigh.toFixed(0) };
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
        if (minRating === 4) {
          // "4 star and above" -> any rating >= 4
          if (cats) {
            if (!cats.some((c: any) => Number(c.rating || 0) >= 4)) return false;
          } else if (Number(f.rating || 0) < 4) return false;
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
        <div className="grid grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
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

      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center shadow-lg">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-serif text-3xl font-bold text-brand-primary">{feedback.length}</p>
            <p className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Total Feedback</p>
          </div>
        </div>
        <button
          onClick={() => setStatsOpen(true)}
          className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.18)] transition-all duration-300 cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center shadow-lg">
            <Star className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-brand-gold fill-brand-gold" />
              <p className="font-serif text-3xl font-bold text-brand-primary">{avgRating}</p>
            </div>
            <p className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Average Rating · Click for details</p>
          </div>
        </button>
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

      {/* Feedback list — collapsible */}
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
            const isOpen = !!expanded[f.id];
            const avg = submissionAvg(f);
            const aboutLabel = f.instructor_id && instructorProfiles[f.instructor_id]
              ? `Feedback on: ${instructorProfiles[f.instructor_id]}`
              : "Feedback on: General";
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
                  {/* Collapsed header */}
                  <button
                    onClick={() => setExpanded({ ...expanded, [f.id]: !isOpen })}
                    className="w-full flex items-center gap-3 p-4 hover:bg-brand-cream/40 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center text-brand-primary font-serif font-bold text-xs shrink-0">
                      {submitterName[0]?.toUpperCase() || "S"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-brand-charcoal">{submitterName}</span>
                        <Badge className="bg-brand-cream-dark text-brand-charcoal-mid border-0 text-[10px]">{aboutLabel}</Badge>
                        {replies.length > 0 && <Badge className="bg-brand-gold-pale text-brand-gold-dark border-0 text-[10px]">{replies.length} reply</Badge>}
                      </div>
                      <p className="text-[11px] text-brand-warm-grey mt-1">
                        Submitted {f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {renderStars(avg)}
                      <span className="text-sm font-bold text-brand-primary tabular-nums">{avg.toFixed(1)}</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-brand-warm-grey" /> : <ChevronDown className="h-4 w-4 text-brand-warm-grey" />}
                    </div>
                  </button>

                  {/* Expanded body */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-brand-parchment/60">
                      {cats ? (
                        <div className="space-y-2.5 mt-3">
                          {cats.map((cat: any, ci: number) => (
                            <div key={ci} className="bg-brand-cream/60 rounded-xl p-3 border border-brand-parchment/50">
                              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                                <Badge className="bg-brand-gold-pale text-brand-gold-dark border border-brand-parchment text-[10px]">{cat.category}</Badge>
                                {renderStars(Number(cat.rating || 0))}
                              </div>
                              {cat.comment ? (
                                <p className="text-sm text-brand-charcoal/80 leading-relaxed">{cat.comment}</p>
                              ) : (
                                <p className="text-xs text-brand-warm-grey italic">No comment</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 bg-brand-cream/60 rounded-xl p-3 border border-brand-parchment/50">
                          {f.category && <Badge className="bg-brand-gold-pale text-brand-gold-dark border border-brand-parchment text-[10px] mb-2">{f.category}</Badge>}
                          <p className="text-sm text-brand-charcoal/80 leading-relaxed">{f.message}</p>
                        </div>
                      )}

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
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Average Rating details dialog */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-brand-primary flex items-center gap-2">
              <Star className="h-5 w-5 text-brand-gold fill-brand-gold" /> Rating Breakdown
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            {[
              { label: "Submissions", value: overallStats.subs },
              { label: "Unique Raters", value: overallStats.raters },
              { label: "Median Rating", value: overallStats.median },
              { label: "≥ 4★ Share", value: `${overallStats.pctHigh}%` },
            ].map((s) => (
              <div key={s.label} className="bg-brand-cream/60 rounded-xl p-3 border border-brand-parchment/60">
                <p className="font-serif text-xl font-bold text-brand-primary">{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-warm-grey font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <h3 className="font-serif text-base font-semibold text-brand-primary mb-2">Average Per Category</h3>
            {categoryStats.length === 0 ? (
              <p className="text-sm text-brand-warm-grey">No category ratings yet.</p>
            ) : (
              <div className="space-y-2">
                {categoryStats.map((c) => (
                  <div key={c.cat} className="flex items-center gap-3 bg-white rounded-xl border border-brand-parchment/60 p-2.5">
                    <span className="text-sm font-medium text-brand-charcoal flex-1 truncate">{c.cat}</span>
                    {renderStars(c.avg)}
                    <span className="text-sm font-bold text-brand-primary tabular-nums w-12 text-right">{c.avg.toFixed(1)}</span>
                    <span className="text-[11px] text-brand-warm-grey w-16 text-right">{c.n} rating{c.n === 1 ? "" : "s"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {instructorStats.length > 0 && (
            <div className="mt-5">
              <h3 className="font-serif text-base font-semibold text-brand-primary mb-2">Top Instructors</h3>
              <div className="space-y-2">
                {instructorStats.map((it) => (
                  <div key={it.name} className="flex items-center gap-3 bg-white rounded-xl border border-brand-parchment/60 p-2.5">
                    <span className="text-sm font-medium text-brand-charcoal flex-1 truncate">{it.name}</span>
                    {renderStars(it.avg)}
                    <span className="text-sm font-bold text-brand-primary tabular-nums w-12 text-right">{it.avg.toFixed(1)}</span>
                    <span className="text-[11px] text-brand-warm-grey w-16 text-right">{it.n} feedback</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFeedback;
