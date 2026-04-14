import { motion } from "framer-motion";
import { Video, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, subMinutes, addMinutes } from "date-fns";

const StudentLiveClasses = () => {
  const { user } = useAuth();

  const { data: batchIds = [] } = useQuery({
    queryKey: ["student-batch-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("batch_enrollments").select("batch_id").eq("student_id", user!.id);
      return (data || []).map((b) => b.batch_id);
    },
    enabled: !!user,
  });

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["student-live-classes", batchIds],
    queryFn: async () => {
      if (!batchIds.length) return [];
      const { data: rawData, error } = await supabase
        .from("live_classes")
        .select("*")
        .in("batch_id", batchIds)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      // Fetch instructor profiles for display names
      const instructorIds = [...new Set((rawData || []).map((c) => c.instructor_id))];
      let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      if (instructorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", instructorIds);
        (profiles || []).forEach((p) => { profilesMap[p.user_id] = p; });
      }
      const data = (rawData || []).map((c) => ({ ...c, profiles: profilesMap[c.instructor_id] || null }));
      if (error) throw error;
      return data || [];
    },
    enabled: batchIds.length > 0,
  });

  const now = new Date();
  const upcoming = classes.filter((c) => new Date(c.scheduled_at) >= now || isClassLive(c));
  const past = classes.filter((c) => new Date(c.scheduled_at) < now && !isClassLive(c));

  function isClassLive(cls: any) {
    const start = subMinutes(new Date(cls.scheduled_at), 10);
    const end = addMinutes(new Date(cls.scheduled_at), cls.duration_minutes || 60);
    return now >= start && now <= end;
  }

  const renderClassCard = (cls: any, isPast: boolean) => {
    const live = isClassLive(cls);
    return (
      <Card key={cls.id} className={`bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden transition-all hover:shadow-lg ${isPast ? "opacity-70" : ""}`}>
        <CardContent className="p-5">
          <h3 className="font-serif font-bold text-brand-charcoal-mid">{cls.title}</h3>
          <p className="text-sm text-brand-warm-grey mt-1">{cls.profiles?.display_name || "Tutor"}</p>
          {cls.description && <p className="text-xs text-brand-warm-grey mt-2 line-clamp-2">{cls.description}</p>}
          <div className="mt-3 space-y-1">
            <p className="text-sm text-brand-charcoal-mid">
              {format(new Date(cls.scheduled_at), "EEEE, dd MMMM yyyy 'at' h:mm a")}
            </p>
            <p className="text-xs text-brand-warm-grey flex items-center gap-1">
              <Clock className="h-3 w-3" /> {cls.duration_minutes || 60} minutes
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Badge className={`border-0 text-xs ${cls.meeting_platform === "google_meet" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
              {cls.meeting_platform === "google_meet" ? "Google Meet" : "Zoom"}
            </Badge>
            {isPast ? (
              <Badge className="bg-brand-cream-dark text-brand-warm-grey border-0">Completed</Badge>
            ) : live ? (
              <>
                <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE
                </span>
                <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-brand-gold text-brand-charcoal hover:bg-brand-gold-light gap-1 rounded-xl">
                    <ExternalLink className="h-3 w-3" /> Join Class
                  </Button>
                </a>
              </>
            ) : (
              <Button size="sm" disabled className="gap-1 text-xs bg-brand-cream-dark text-brand-warm-grey rounded-xl">
                Not yet live
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-semibold text-brand-primary">Live Classes</h1>
        <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        <p className="text-brand-warm-grey mt-2 text-sm">Join scheduled live sessions with your tutors</p>
      </motion.div>

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-brand-cream-dark rounded-xl p-1">
          <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-brand-gold-pale flex items-center justify-center mx-auto mb-3">
                  <Video className="h-6 w-6 text-brand-gold" />
                </div>
                <p className="font-serif text-brand-primary font-semibold">No upcoming live classes scheduled.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcoming.map((cls) => renderClassCard(cls, false))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
              <CardContent className="py-12 text-center">
                <p className="font-serif text-brand-primary font-semibold">No past classes yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {past.map((cls) => renderClassCard(cls, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentLiveClasses;
