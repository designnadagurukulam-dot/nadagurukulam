import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Sparkles, BookOpen, IndianRupee, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const AdminApprovals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("content_reviews")
      .select("*, courses(id, title, description, price, level, instructor_name, status)")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true });
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleAction = async (review: any, action: "approved" | "rejected") => {
    try {
      await supabase.from("content_reviews").update({
        status: action,
        reviewer_id: user?.id,
        reviewed_at: new Date().toISOString(),
        feedback: feedback[review.id] || null,
      } as any).eq("id", review.id);
      await supabase.from("courses").update({
        status: action,
      } as any).eq("id", review.courses?.id);
      logActivity(`course.${action}`, "course", review.courses?.id, { title: review.courses?.title, feedback: feedback[review.id] || null });
      toast({ title: `Course ${action}!` });
      fetchReviews();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-brand-primary">Course Approvals</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          </div>
        </div>
        <p className="text-sm text-brand-warm-grey mt-2">{reviews.length} pending review{reviews.length !== 1 ? "s" : ""}</p>
      </motion.div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-brand-gold" />
          </div>
          <h3 className="font-serif text-2xl text-brand-primary mb-2">All Caught Up!</h3>
          <p className="text-sm text-brand-warm-grey">No pending course reviews at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6 space-y-4 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl text-brand-primary">{r.courses?.title}</h3>
                        <p className="text-xs text-brand-warm-grey">by {r.courses?.instructor_name || "Unknown"}</p>
                      </div>
                    </div>
                    <p className="text-sm text-brand-charcoal/80 leading-relaxed ml-[52px]">{r.courses?.description?.slice(0, 150)}</p>
                    <div className="flex items-center gap-4 mt-3 ml-[52px]">
                      <Badge className="bg-brand-gold-pale text-brand-gold-dark border border-brand-parchment gap-1">
                        <IndianRupee className="h-3 w-3" /> {r.courses?.price || 0}
                      </Badge>
                      {r.courses?.level && (
                        <Badge className="bg-brand-cream text-brand-warm-grey border border-brand-parchment">{r.courses.level}</Badge>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200 shrink-0 gap-1">
                    <Clock className="h-3 w-3" /> Pending
                  </Badge>
                </div>

                <div className="ml-[52px]">
                  <label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Feedback</label>
                  <Textarea
                    value={feedback[r.id] || ""}
                    onChange={(e) => setFeedback({ ...feedback, [r.id]: e.target.value })}
                    placeholder="Optional feedback..."
                    rows={2}
                    className="border-brand-parchment rounded-xl focus:border-brand-gold"
                  />
                </div>

                <div className="flex gap-3 ml-[52px]">
                  <Button onClick={() => handleAction(r, "approved")} className="gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl">
                    <CheckCircle className="h-4 w-4" /> Approve
                  </Button>
                  <Button onClick={() => handleAction(r, "rejected")} className="gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl">
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
