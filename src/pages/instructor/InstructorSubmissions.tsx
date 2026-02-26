import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Clock, XCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const statusMap: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "Pending Review" },
  approved: { icon: CheckCircle, color: "bg-green-100 text-green-800", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-red-100 text-red-800", label: "Rejected" },
};

const InstructorSubmissions = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("content_reviews")
        .select("*, courses(title, status)")
        .order("submitted_at", { ascending: false });
      setReviews(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl text-foreground">Submissions</h1>
        <p className="text-muted-foreground mt-1">Track your course review status</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <CheckSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-serif text-xl text-foreground mb-2">No submissions yet</h3>
            <p className="text-muted-foreground">Submit a course for review to see it here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => {
            const status = statusMap[r.status] || statusMap.pending;
            const StatusIcon = status.icon;
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{(r as any).courses?.title || "Unknown Course"}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(r.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={status.color}>{status.label}</Badge>
                      {r.feedback && (
                        <p className="text-sm text-muted-foreground max-w-xs truncate">{r.feedback}</p>
                      )}
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
