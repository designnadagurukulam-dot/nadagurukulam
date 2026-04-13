import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Plus, Clock, ExternalLink, Edit, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, subMinutes, addMinutes } from "date-fns";
import { logActivity } from "@/lib/activityLogger";

const TutorLiveClasses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", batch_id: "", date: "", time: "", duration: "60", platform: "zoom", link: "" });

  const { data: batches = [] } = useQuery({
    queryKey: ["tutor-batches", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("batches").select("id, name").eq("instructor_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["tutor-live-classes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_classes")
        .select("*, batches(name)")
        .eq("instructor_id", user!.id)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const now = new Date();
  const upcoming = classes.filter((c) => new Date(c.scheduled_at) >= now || isLive(c));
  const past = classes.filter((c) => new Date(c.scheduled_at) < now && !isLive(c));

  function isLive(cls: any) {
    const start = subMinutes(new Date(cls.scheduled_at), 10);
    const end = addMinutes(new Date(cls.scheduled_at), cls.duration_minutes || 60);
    return now >= start && now <= end;
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
      const { error } = await supabase.from("live_classes").insert({
        title: form.title,
        description: form.description || null,
        instructor_id: user!.id,
        batch_id: form.batch_id,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(form.duration) || 60,
        meeting_platform: form.platform,
        meeting_link: form.link,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutor-live-classes"] });
      logActivity("live_class.created", "live_class");
      setCreateOpen(false);
      setForm({ title: "", description: "", batch_id: "", date: "", time: "", duration: "60", platform: "zoom", link: "" });
      toast.success("Live class scheduled!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("live_classes").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutor-live-classes"] });
      toast.success("Class cancelled");
    },
  });

  const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const renderCard = (cls: any, isPast: boolean) => {
    const live = isLive(cls);
    return (
      <Card key={cls.id} className={`overflow-hidden transition-all hover:shadow-lg ${isPast ? "opacity-70" : ""} ${cls.status === "cancelled" ? "opacity-50" : ""}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-serif font-bold text-foreground">{cls.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{cls.batches?.name || "No batch"}</p>
              {cls.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cls.description}</p>}
            </div>
            {cls.status === "cancelled" && <Badge variant="destructive" className="text-xs">Cancelled</Badge>}
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-sm text-foreground">{format(new Date(cls.scheduled_at), "EEEE, dd MMMM yyyy 'at' h:mm a")}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {cls.duration_minutes || 60} minutes</p>
          </div>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Badge variant="outline" className={cls.meeting_platform === "google_meet" ? "border-green-300 text-green-700" : "border-blue-300 text-blue-700"}>
              {cls.meeting_platform === "google_meet" ? "Google Meet" : "Zoom"}
            </Badge>
            {live && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE
              </span>
            )}
            {!isPast && cls.status !== "cancelled" && (
              <>
                <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1 text-xs"><ExternalLink className="h-3 w-3" /> Open Link</Button>
                </a>
                <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={() => cancelMutation.mutate(cls.id)}>
                  <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Live Classes</h1>
          <p className="text-muted-foreground mt-1 text-sm">Schedule and manage your live sessions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Schedule Class</Button>
      </motion.div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
          ) : upcoming.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Video className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming classes. Schedule one!</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{upcoming.map((cls) => renderCard(cls, false))}</div>
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No past classes.</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{past.map((cls) => renderCard(cls, true))}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Schedule Live Class</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs uppercase tracking-widest">Title</Label><Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Class title" className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs uppercase tracking-widest">Description</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Optional description" className="mt-1 rounded-xl" /></div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Batch</Label>
              <Select value={form.batch_id} onValueChange={(v) => updateField("batch_id", v)}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs uppercase tracking-widest">Date</Label><Input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} className="mt-1 rounded-xl" /></div>
              <div><Label className="text-xs uppercase tracking-widest">Time</Label><Input type="time" value={form.time} onChange={(e) => updateField("time", e.target.value)} className="mt-1 rounded-xl" /></div>
            </div>
            <div><Label className="text-xs uppercase tracking-widest">Duration (minutes)</Label><Input type="number" value={form.duration} onChange={(e) => updateField("duration", e.target.value)} className="mt-1 rounded-xl" /></div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Platform</Label>
              <div className="flex gap-3 mt-1">
                <Button type="button" variant={form.platform === "zoom" ? "default" : "outline"} size="sm" onClick={() => updateField("platform", "zoom")} className="rounded-xl">Zoom</Button>
                <Button type="button" variant={form.platform === "google_meet" ? "default" : "outline"} size="sm" onClick={() => updateField("platform", "google_meet")} className="rounded-xl">Google Meet</Button>
              </div>
            </div>
            <div><Label className="text-xs uppercase tracking-widest">Meeting Link</Label><Input value={form.link} onChange={(e) => updateField("link", e.target.value)} placeholder="Paste Zoom/Meet invite link" className="mt-1 rounded-xl" /></div>
            <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.batch_id || !form.date || !form.time || !form.link || createMutation.isPending} className="w-full">
              {createMutation.isPending ? "Scheduling..." : "Schedule Class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorLiveClasses;
