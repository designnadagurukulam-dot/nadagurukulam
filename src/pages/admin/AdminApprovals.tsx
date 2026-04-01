import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      // Update review
      await supabase.from("content_reviews").update({
        status: action,
        reviewer_id: user?.id,
        reviewed_at: new Date().toISOString(),
        feedback: feedback[review.id] || null,
      } as any).eq("id", review.id);

      // Update course status
      await supabase.from("courses").update({
        status: action,
      } as any).eq("id", review.courses?.id);

      toast({ title: `Course ${action}!` });
      fetchReviews();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl text-foreground">Course Approvals</h1>
        <p className="text-muted-foreground mt-1">{reviews.length} pending review{reviews.length !== 1 ? "s" : ""}</p>
      </motion.div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <CheckCircle className="h-12 w-12 text-green-500/50 mb-4" />
            <h3 className="font-serif text-xl text-foreground mb-2">All caught up!</h3>
            <p className="text-muted-foreground">No pending course reviews</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-xl text-foreground">{r.courses?.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{r.courses?.description?.slice(0, 150)}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>By: {r.courses?.instructor_name || "Unknown"}</span>
                        <span>Level: {r.courses?.level}</span>
                        <span>Price: ₹{r.courses?.price || 0}</span>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 shrink-0">
                      <Clock className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                  </div>

                  <Textarea
                    value={feedback[r.id] || ""}
                    onChange={(e) => setFeedback({ ...feedback, [r.id]: e.target.value })}
                    placeholder="Feedback (optional)..."
                    rows={2}
                  />

                  <div className="flex gap-3">
                    <Button onClick={() => handleAction(r, "approved")} className="gap-2 bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                    <Button variant="destructive" onClick={() => handleAction(r, "rejected")} className="gap-2">
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
