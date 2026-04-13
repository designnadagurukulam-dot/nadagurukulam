import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Lock, Send } from "lucide-react";
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
    <div className="space-y-6 pt-2 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-semibold text-brand-primary">Share Anonymous Feedback</h1>
        <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        <p className="text-brand-warm-grey mt-2 text-sm">
          Your feedback goes directly to the institution admin. Your identity is kept completely private.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <CardContent className="p-6 space-y-6">
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
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)} className="p-1 transition-transform hover:scale-110">
                    <Star className={`h-7 w-7 ${star <= (hoverRating || rating) ? "fill-brand-gold text-brand-gold" : "text-brand-parchment"} transition-colors`} />
                  </button>
                ))}
              </div>
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
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share your honest feedback (minimum 20 characters)..." rows={5} className="rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20" />
              <p className="text-xs text-brand-warm-grey mt-1">{message.length}/20 min characters</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-brand-warm-grey bg-brand-cream-dark p-3 rounded-xl">
              <Lock className="h-4 w-4 text-brand-gold shrink-0" />
              <span>This feedback is completely anonymous. Only the admin team can read it.</span>
            </div>

            <Button onClick={handleSubmit} disabled={submitting || !tutorId || rating === 0 || message.trim().length < 20}
              className="w-full gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl">
              <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default StudentFeedback;
