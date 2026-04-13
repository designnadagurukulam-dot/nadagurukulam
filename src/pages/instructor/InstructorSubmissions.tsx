import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Clock, XCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const statusMap: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-amber-50 text-amber-700", label: "Pending Review" },
  approved: { icon: CheckCircle, color: "bg-green-50 text-green-700", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-red-50 text-red-700", label: "Rejected" },
};

const InstructorSubmissions = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("content_reviews").select("*, courses(title, status)").order("submitted_at", { ascending: false }).then(({ data }) => { setReviews(data || []); setLoading(false); });
  }, [user]);

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-semibold text-brand-primary">Submissions</h1>
        <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        <p className="text-brand-warm-grey mt-2 text-sm">Track your course review status</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : reviews.length === 0 ? (
        <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <CardContent className="flex flex-col items-center py-16">
            <div className="w-16 h-16 rounded-full bg-brand-gold-pale flex items-center justify-center mb-4"><CheckSquare className="h-8 w-8 text-brand-gold" /></div>
            <h3 className="font-serif text-xl text-brand-primary mb-2">No submissions yet</h3>
            <p className="text-brand-warm-grey">Submit a course for review to see it here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => {
            const status = statusMap[r.status] || statusMap.pending;
            const StatusIcon = status.icon;
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <StatusIcon className="h-5 w-5 text-brand-warm-grey" />
                      <div>
                        <p className="font-medium text-brand-charcoal-mid">{(r as any).courses?.title || "Unknown Course"}</p>
                        <p className="text-xs text-brand-warm-grey">Submitted {new Date(r.submitted_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${status.color} border-0`}>{status.label}</Badge>
                      {r.feedback && <p className="text-sm text-brand-warm-grey max-w-xs truncate">{r.feedback}</p>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InstructorSubmissions;
