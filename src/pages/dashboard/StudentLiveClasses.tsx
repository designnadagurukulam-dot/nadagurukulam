
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
      const { data } = await supabase
        .from("batch_enrollments")
        .select("batch_id")
        .eq("student_id", user!.id);
      return (data || []).map((b) => b.batch_id);
    },
    enabled: !!user,
  });

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["student-live-classes", batchIds],
    queryFn: async () => {
      if (!batchIds.length) return [];
      const { data, error } = await supabase
        .from("live_classes")
        .select("*, profiles!live_classes_instructor_id_fkey(display_name, avatar_url)")
        .in("batch_id", batchIds)
        .order("scheduled_at", { ascending: false });
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
      <Card key={cls.id} className={`overflow-hidden transition-all hover:shadow-lg ${isPast ? "opacity-70" : ""}`}>
        <CardContent className="p-5">
          <h3 className="font-serif font-bold text-foreground">{cls.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{cls.profiles?.display_name || "Tutor"}</p>
          {cls.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cls.description}</p>}
          <div className="mt-3 space-y-1">
            <p className="text-sm text-foreground">
              {format(new Date(cls.scheduled_at), "EEEE, dd MMMM yyyy 'at' h:mm a")}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {cls.duration_minutes || 60} minutes
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Badge variant="outline" className={cls.meeting_platform === "google_meet" ? "border-green-300 text-green-700" : "border-blue-300 text-blue-700"}>
              {cls.meeting_platform === "google_meet" ? "Google Meet" : "Zoom"}
            </Badge>
            {isPast ? (
              <Badge variant="secondary">Completed</Badge>
            ) : live ? (
              <>
                <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE
                </span>
                <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1">
                    <ExternalLink className="h-3 w-3" /> Join Class
                  </Button>
                </a>
              </>
            ) : (
              <Button size="sm" variant="secondary" disabled className="gap-1 text-xs">
                Not yet live
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl font-bold text-foreground">Live Classes</h1>
        <p className="text-muted-foreground mt-1 text-sm">Join scheduled live sessions with your tutors</p>
      </motion.div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming live classes scheduled.</p>
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
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No past classes yet.</p>
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
