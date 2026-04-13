import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Star, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="space-y-4 pt-12 lg:pt-0">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-primary" />
          <h1 className="font-serif text-2xl text-foreground">Student Feedback</h1>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{feedback.length}</p>
            <p className="text-xs text-muted-foreground">Total Feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="text-3xl font-bold text-foreground">{avgRating}</span>
            </div>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{feedback.filter(f => f.is_anonymous).length}</p>
            <p className="text-xs text-muted-foreground">Anonymous</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map(r => <SelectItem key={r} value={r.toString()}>{r} Stars</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">No feedback found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => (
            <Card key={f.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {f.is_anonymous ? "Anonymous" : (profiles[f.student_id] || "Student")}
                      </span>
                      {f.category && <Badge variant="secondary" className="text-xs">{f.category}</Badge>}
                    </div>
                    <p className="text-sm text-foreground/80">{f.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                  {f.rating && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < f.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
