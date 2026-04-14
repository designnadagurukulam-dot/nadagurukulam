import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Star, Filter, MessageCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("feedback").select("*").order("submitted_at", { ascending: false });
      const items = data || [];
      setFeedback(items);
      const nonAnon = items.filter(f => !f.is_anonymous).map(f => f.student_id);
      if (nonAnon.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", [...new Set(nonAnon)]);
        const map: Record<string, string> = {};
        (profs || []).forEach(p => { map[p.user_id] = p.display_name || "Student"; });
        setProfiles(map);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const categories = [...new Set(feedback.map(f => f.category).filter(Boolean))];

  const filtered = feedback.filter(f => {
    if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
    if (ratingFilter !== "all" && f.rating?.toString() !== ratingFilter) return false;
    return true;
  });

  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.filter(f => f.rating).length).toFixed(1)
    : "—";

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
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-brand-primary">Student Feedback</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          </div>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
          <Filter className="h-4 w-4 text-brand-gold" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 border-brand-parchment rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-32 border-brand-parchment rounded-xl"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map(r => <SelectItem key={r} value={r.toString()}>{r} Stars</SelectItem>)}
          </SelectContent>
        </Select>
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
          {filtered.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <div className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:bg-brand-cream hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center text-brand-primary font-serif font-bold text-xs">
                        {f.is_anonymous ? "?" : (profiles[f.student_id] || "S")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-sm text-brand-charcoal">
                        {f.is_anonymous ? "Anonymous" : (profiles[f.student_id] || "Student")}
                      </span>
                      {f.category && (
                        <Badge className="bg-brand-gold-pale text-brand-gold-dark border border-brand-parchment text-[10px]">{f.category}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-brand-charcoal/80 leading-relaxed">{f.message}</p>
                    <p className="text-xs text-brand-warm-grey mt-2">
                      {f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                  {f.rating && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`h-4 w-4 ${idx < f.rating ? "text-brand-gold fill-brand-gold" : "text-brand-parchment"}`} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
