import { motion } from "framer-motion";
import { Video, Clock, ExternalLink, Camera, History } from "lucide-react";
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
        .from("live_classes").select("*").in("batch_id", batchIds).order("scheduled_at", { ascending: false });
      if (error) throw error;
      const instructorIds = [...new Set((rawData || []).map((c) => c.instructor_id))];
      let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      if (instructorIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", instructorIds);
        (profiles || []).forEach((p) => { profilesMap[p.user_id] = p; });
      }
      return (rawData || []).map((c) => ({ ...c, profiles: profilesMap[c.instructor_id] || null }));
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

  const getInitials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const renderClassCard = (cls: any, isPast: boolean) => {
    const live = isClassLive(cls);
    return (
      <Card key={cls.id} className={`bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden transition-all duration-300 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] ${isPast ? "opacity-70" : ""} ${live ? "ring-2 ring-green-400/50" : ""}`}>
        <CardContent className="p-3.5 sm:p-5">
          <div className="flex items-start gap-3">
            {/* Tutor avatar */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center text-brand-primary font-bold text-xs shrink-0 border border-brand-gold/20">
              {getInitials(cls.profiles?.display_name || "T")}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif font-bold text-brand-charcoal-mid text-sm sm:text-base">{cls.title}</h3>
              <p className="text-xs sm:text-sm text-brand-warm-grey mt-0.5">{cls.profiles?.display_name || "Tutor"}</p>
              {cls.description && <p className="text-[10px] sm:text-xs text-brand-warm-grey mt-2 line-clamp-2">{cls.description}</p>}
            </div>
            {live && (
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-green-600" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white" />
              </div>
            )}
          </div>
          <div className="mt-2.5 sm:mt-3 space-y-1 ml-13">
            <p className="text-xs sm:text-sm text-brand-charcoal-mid">
              {format(new Date(cls.scheduled_at), "EEE, dd MMM yyyy")}
              <span className="text-brand-warm-grey"> at </span>
              {format(new Date(cls.scheduled_at), "h:mm a")}
            </p>
            <p className="text-[10px] sm:text-xs text-brand-warm-grey flex items-center gap-1">
              <Clock className="h-3 w-3" /> {cls.duration_minutes || 60} min
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-4 flex-wrap">
            <Badge className={`border-0 text-[10px] sm:text-xs ${cls.meeting_platform === "google_meet" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
              {cls.meeting_platform === "google_meet" ? "🟢 Google Meet" : "🔵 Zoom"}
            </Badge>
            {isPast ? (
              <Badge className="bg-brand-cream-dark text-brand-warm-grey border-0 text-[10px] sm:text-xs">Completed</Badge>
            ) : live ? (
              <>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" /> LIVE
                </span>
                <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                  <Button size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white gap-1 rounded-xl text-xs min-h-[40px] shadow-lg">
                    <ExternalLink className="h-3 w-3" /> Join Class
                  </Button>
                </a>
              </>
            ) : (
              <Button size="sm" disabled className="gap-1 text-[10px] sm:text-xs bg-brand-cream-dark text-brand-warm-grey rounded-xl">
                Not yet live
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
          <Video className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">Live Classes</h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          <p className="text-brand-warm-grey mt-1 text-xs sm:text-sm">Join scheduled live sessions with your tutors</p>
        </div>
      </motion.div>

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-brand-cream-dark rounded-xl p-1">
          <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-xs sm:text-sm min-h-[40px] gap-1.5">
            <Video className="h-3.5 w-3.5" /> Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-xs sm:text-sm min-h-[40px] gap-1.5">
            <History className="h-3.5 w-3.5" /> Past ({past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-3 sm:mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {[1, 2].map((i) => <Skeleton key={i} className="h-44 sm:h-48 rounded-2xl" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
              <CardContent className="py-10 sm:py-12 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-3">
                  <Video className="h-6 w-6 sm:h-7 sm:w-7 text-brand-gold" />
                </div>
                <p className="font-serif text-brand-primary font-semibold text-sm sm:text-base">No upcoming live classes scheduled.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {upcoming.map((cls) => renderClassCard(cls, false))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-3 sm:mt-4">
          {past.length === 0 ? (
            <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
              <CardContent className="py-10 sm:py-12 text-center">
                <p className="font-serif text-brand-primary font-semibold text-sm sm:text-base">No past classes yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {past.map((cls) => renderClassCard(cls, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentLiveClasses;