import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Lock, Send, Shield, MessageSquareHeart, Sparkles, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const categoryOptions = ["Teaching Quality", "Punctuality", "Communication", "Curriculum", "General"];

interface CategoryBlock {
  category: string;
  rating: number;
  comment: string;
}

const StudentFeedback = () => {
  const { user } = useAuth();
  const [tutorId, setTutorId] = useState("");
  const [blocks, setBlocks] = useState<CategoryBlock[]>([{ category: "General", rating: 0, comment: "" }]);
  const [hoverRatings, setHoverRatings] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data: myFeedback = [] } = useQuery({
    queryKey: ["my-feedback-with-replies", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: fb } = await supabase
        .from("feedback")
        .select("id, message, rating, category, submitted_at, instructor_id")
        .eq("student_id", user!.id)
        .order("submitted_at", { ascending: false });
      const ids = (fb || []).map((f: any) => f.id);
      if (!ids.length) return [];
      const { data: replies } = await (supabase as any)
        .from("feedback_responses")
        .select("id, feedback_id, message, created_at")
        .in("feedback_id", ids)
        .order("created_at", { ascending: true });
      return (fb || []).map((f: any) => ({
        ...f,
        replies: (replies || []).filter((r: any) => r.feedback_id === f.id),
      }));
    },
  });

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

  const addBlock = () => {
    setBlocks([...blocks, { category: "General", rating: 0, comment: "" }]);
  };

  const removeBlock = (idx: number) => {
    setBlocks(blocks.filter((_, i) => i !== idx));
  };

  const updateBlock = (idx: number, field: keyof CategoryBlock, value: any) => {
    setBlocks(blocks.map((b, i) => i === idx ? { ...b, [field]: value } : b));
  };

  const handleSubmit = async () => {
    if (!user || !tutorId) {
      toast.error("Please select a tutor.");
      return;
    }
    const invalid = blocks.some(b => b.rating === 0 || b.comment.trim().length < 20);
    if (invalid) {
      toast.error("Each category must have a rating and at least 20 characters of feedback.");
      return;
    }

    setSubmitting(true);
    const { data: enrollments } = await supabase
      .from("batch_enrollments").select("batch_id, batches(instructor_id)").eq("student_id", user.id);
    const batchId = enrollments?.find((e: any) => e.batches?.instructor_id === tutorId)?.batch_id || null;

    // Combined message for backward compat
    const combinedMessage = blocks.map(b => `[${b.category}] (${b.rating}★) ${b.comment}`).join("\n\n");
    const avgRating = Math.round(blocks.reduce((s, b) => s + b.rating, 0) / blocks.length);

    const { error } = await supabase.from("feedback").insert({
      student_id: user.id,
      instructor_id: tutorId,
      batch_id: batchId,
      rating: avgRating,
      message: combinedMessage,
      category: blocks[0].category,
      is_anonymous: true,
      categories: blocks.map(b => ({ category: b.category, rating: b.rating, comment: b.comment })),
    } as any);

    setSubmitting(false);
    if (error) { toast.error("Failed to submit feedback: " + error.message); }
    else {
      toast.success("Thank you for your feedback. It has been sent anonymously to the admin.");
      setTutorId(""); setBlocks([{ category: "General", rating: 0, comment: "" }]); setHoverRatings({});
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
          <div className="h-1.5 bg-gradient-to-r from-brand-primary via-brand-gold to-brand-primary" />
          <CardContent className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Faculty selector */}
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

            {/* Category blocks */}
            <div className="space-y-4">
              {blocks.map((block, idx) => (
                <div key={idx} className="relative bg-brand-cream/50 rounded-xl p-4 border border-brand-parchment">
                  {blocks.length > 1 && (
                    <button
                      onClick={() => removeBlock(idx)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Category</label>
                      <Select value={block.category} onValueChange={(v) => updateBlock(idx, "category", v)}>
                        <SelectTrigger className="rounded-xl h-10 border-brand-parchment focus:border-brand-gold text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button"
                            onMouseEnter={() => setHoverRatings({ ...hoverRatings, [idx]: star })}
                            onMouseLeave={() => setHoverRatings({ ...hoverRatings, [idx]: 0 })}
                            onClick={() => updateBlock(idx, "rating", star)}
                            className="p-1 transition-all hover:scale-125 duration-200">
                            <Star className={`h-6 w-6 transition-all duration-200 ${
                              star <= (hoverRatings[idx] || block.rating)
                                ? "fill-brand-gold text-brand-gold drop-shadow-[0_0_6px_rgba(196,154,60,0.5)]"
                                : "text-brand-parchment"
                            }`} />
                          </button>
                        ))}
                      </div>
                      {block.rating > 0 && (
                        <p className="text-[10px] text-brand-gold mt-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {block.rating === 5 ? "Excellent!" : block.rating === 4 ? "Great!" : block.rating === 3 ? "Good" : block.rating === 2 ? "Fair" : "Needs improvement"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Comment</label>
                      <Textarea
                        value={block.comment}
                        onChange={(e) => updateBlock(idx, "comment", e.target.value)}
                        placeholder="Share your honest feedback (min 20 characters)..."
                        rows={3}
                        className="rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20 text-sm"
                      />
                      <p className="text-[10px] text-brand-warm-grey mt-0.5">{block.comment.length}/20 min</p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addBlock}
                className="w-full py-3 border border-dashed border-brand-gold rounded-xl text-brand-gold font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-gold-pale/30 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add another category
              </button>
            </div>

            {/* Privacy badge */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-brand-cream-dark to-brand-cream p-3 sm:p-4 rounded-xl border border-brand-parchment">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-brand-gold" />
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-charcoal-mid flex items-center gap-1"><Lock className="h-3 w-3" /> Your Privacy is Protected</p>
                <p className="text-[10px] text-brand-warm-grey mt-0.5">🔒 This feedback is completely anonymous.</p>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={submitting || !tutorId || blocks.some(b => b.rating === 0 || b.comment.trim().length < 20)}
              className="w-full gap-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-brand-primary text-white rounded-xl min-h-[44px] shadow-lg">
              <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Admin replies */}
      {myFeedback.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-4 h-4 text-brand-gold" />
                <h2 className="font-serif text-lg text-brand-primary">Your Feedback History & Admin Replies</h2>
              </div>
              <div className="space-y-3">
                {myFeedback.map((f: any) => (
                  <div key={f.id} className="border border-brand-parchment rounded-xl p-3 bg-brand-cream/40">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-brand-warm-grey">{f.category}</span>
                        {f.rating && (
                          <span className="inline-flex items-center gap-0.5">
                            {Array.from({ length: f.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-brand-gold text-brand-gold" />
                            ))}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-brand-warm-grey">{format(new Date(f.submitted_at), "PP")}</span>
                    </div>
                    <p className="text-xs text-brand-charcoal/80 mt-2 whitespace-pre-wrap line-clamp-3">{f.message}</p>
                    {f.replies.length > 0 ? (
                      <div className="mt-3 space-y-2 border-l-2 border-brand-gold pl-3">
                        {f.replies.map((r: any) => (
                          <div key={r.id} className="bg-white rounded-lg p-2 border border-brand-parchment">
                            <p className="text-[10px] uppercase tracking-widest text-brand-gold font-semibold mb-1">Admin Reply · {format(new Date(r.created_at), "PP")}</p>
                            <p className="text-xs text-brand-charcoal whitespace-pre-wrap">{r.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-brand-warm-grey mt-2 italic">Awaiting admin response…</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default StudentFeedback;
