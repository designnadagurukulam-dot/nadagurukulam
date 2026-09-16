import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const getLastViewed = (key: string) => {
  if (typeof window === "undefined") return "1970-01-01T00:00:00Z";
  return localStorage.getItem(`lastViewed:${key}`) || "1970-01-01T00:00:00Z";
};

export const useDashboardCounts = () => {
  const { role, user } = useAuth();

  return useQuery({
    queryKey: ["sidebar-counts", role, user?.id],
    enabled: !!role,
    refetchInterval: 30000,
    queryFn: async () => {
      const next: Record<string, number> = {};
      if (role === "admin" || role === "super_admin") {
        const usersSince = getLastViewed("users");
        const assignSince = getLastViewed("assignments");
        const feedbackSince = getLastViewed("feedback");
        const profilesP = supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", false).gt("created_at", usersSince);
        const reviewsP = supabase.from("content_reviews").select("id", { count: "exact", head: true }).eq("status", "pending");
        const submissionsP = supabase.from("assignment_submissions").select("id", { count: "exact", head: true }).is("grade", null).gt("submitted_at", assignSince);
        const messagesP = supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false);
        const feedbackP = (supabase.from("feedback") as any).select("id", { count: "exact", head: true }).eq("read_by_admin", false).gt("created_at", feedbackSince);
        const [profiles, reviews, submissions, messages, feedback] = await Promise.all([profilesP, reviewsP, submissionsP, messagesP, feedbackP]);
        next["Users"] = profiles.count || 0;
        next["Course Approvals"] = reviews.count || 0;
        next["Assignments"] = submissions.count || 0;
        next[role === "super_admin" ? "Message Monitor" : "Messages"] = messages.count || 0;
        next["Feedback"] = (feedback as any).count || 0;
      } else if (user?.id) {
        const [messages, submissions] = await Promise.all([
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
          role === "student" ? supabase.from("assignment_submissions").select("id", { count: "exact", head: true }).eq("student_id", user.id).eq("status", "submitted") : Promise.resolve({ count: 0 }),
        ]);
        next["Reach Out"] = messages.count || 0;
        next["Assignments"] = submissions.count || 0;
      }
      return next;
    },
  });
};
