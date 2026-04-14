import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Lock, Send, Shield, MessageSquareHeart, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const categories = ["Teaching Quality", "Punctuality", "Communication", "Curriculum", "General"];

const StudentFeedback = () => {
  const { user } = useAuth();
  const [tutorId, setTutorId] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: tutors = [] } = useQuery({
    queryKey: ["feedback-tutors", user?.id],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from("batch_enrollments").select("batch_id, batches(instructor_id)").eq("student_id", user!.id);
      const instructorIds = [...new Set((enrollments || []).map((e: any) => e.batches?.instructor_id).filter(Boolean))];
      if (!instructorIds.length) return [];
      const { data } = await supabase.from("profiles").select("user_id, display_name").in("user_id", instructorIds);
      return data || [];
    },
    enabled: !!user,
  });

  const handleSubmit = async () => {
    if (!user || !tutorId || !message.trim() || message.trim().length < 20) {
      toast.error("Please fill all fields. Feedback must be at least 20 characters.");
      return;
    }
    if (rating === 0) { toast.error("Please select a rating."); return; }
    setSubmitting(true);
    const { data: enrollments } = await supabase
      .from("batch_enrollments").select("batch_id, batches(instructor_id)").eq("student_id", user.id);
    const batchId = enrollments?.find((e: any) => e.batches?.instructor_id === tutorId)?.batch_id || null;
    const { error } = await supabase.from("feedback").insert({
      student_id: user.id, instructor_id: tutorId, batch_id: batchId, rating, message: message.trim(), category, is_anonymous: true,
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to submit feedback: " + error.message); }
    else {
      toast.success("Thank you for your feedback. It has been sent anonymously to the admin.");
      setTutorId(""); setRating(0); setCategory("General"); setMessage("");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pt-2 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
          <MessageSquareHeart className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">Share Anonymous Feedback</h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          <p className="text-brand-warm-grey mt-1 text-xs sm:text-sm">
            Your feedback goes directly to the institution admin. Your identity is kept completely private.
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
          {/* Gradient header strip */}
          <div className="h-1.5 bg-gradient-to-r from-brand-primary via-brand-gold to-brand-primary" />
          <CardContent className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div>
              <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-2 block">Which tutor is this about?</label>
              <Select value={tutorId} onValueChange={setTutorId}>
                <SelectTrigger className="rounded-xl h-11 border-brand-parchment focus:border-brand-gold">
                  <SelectValue placeholder="Select a tutor..." />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((t: any) => (<SelectItem key={t.user_id} value={t.user_id}>{t.display_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-2 block">Rating</label>
              <div className="flex gap-1.5 sm:gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}
                    className="p-1.5 sm:p-1 transition-all hover:scale-125 duration-200">
                    <Star className={`h-8 w-8 sm:h-7 sm:w-7 transition-all duration-200 ${
                      star <= (hoverRating || rating)
                        ? "fill-brand-gold text-brand-gold drop-shadow-[0_0_6px_rgba(196,154,60,0.5)]"
                        : "text-brand-parchment"
                    }`} />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-[10px] text-brand-gold mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {rating === 5 ? "Excellent!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Needs improvement"}
                </p>
              )}
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-2 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl h-11 border-brand-parchment focus:border-brand-gold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-2 block">Your Feedback</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share your honest feedback (minimum 20 characters)..." rows={4} className="rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20" />
              <p className="text-[10px] sm:text-xs text-brand-warm-grey mt-1">{message.length}/20 min characters</p>
            </div>

            {/* Privacy badge — gradient card */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-brand-cream-dark to-brand-cream p-3 sm:p-4 rounded-xl border border-brand-parchment">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-brand-gold" />
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-charcoal-mid flex items-center gap-1"><Lock className="h-3 w-3" /> Your Privacy is Protected</p>
                <p className="text-[10px] text-brand-warm-grey mt-0.5">This feedback is completely anonymous. Only the admin team can read it.</p>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={submitting || !tutorId || rating === 0 || message.trim().length < 20}
              className="w-full gap-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-brand-primary text-white rounded-xl min-h-[44px] shadow-lg">
              <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default StudentFeedback;