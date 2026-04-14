import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Plus, Clock, ExternalLink, X, Tv, CalendarCheck } from "lucide-react";
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

  const { data: batches = [] } = useQuery({ queryKey: ["tutor-batches", user?.id], queryFn: async () => { const { data } = await supabase.from("batches").select("id, name").eq("instructor_id", user!.id); return data || []; }, enabled: !!user });
  const { data: classes = [], isLoading } = useQuery({ queryKey: ["tutor-live-classes", user?.id], queryFn: async () => { const { data, error } = await supabase.from("live_classes").select("*, batches(name)").eq("instructor_id", user!.id).order("scheduled_at", { ascending: false }); if (error) throw error; return data || []; }, enabled: !!user });

  const now = new Date();
  const upcoming = classes.filter((c) => new Date(c.scheduled_at) >= now || isLive(c));
  const past = classes.filter((c) => new Date(c.scheduled_at) < now && !isLive(c));

  function isLive(cls: any) { const start = subMinutes(new Date(cls.scheduled_at), 10); const end = addMinutes(new Date(cls.scheduled_at), cls.duration_minutes || 60); return now >= start && now <= end; }

  const createMutation = useMutation({
    mutationFn: async () => { const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString(); const { error } = await supabase.from("live_classes").insert({ title: form.title, description: form.description || null, instructor_id: user!.id, batch_id: form.batch_id, scheduled_at: scheduledAt, duration_minutes: parseInt(form.duration) || 60, meeting_platform: form.platform, meeting_link: form.link }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tutor-live-classes"] }); logActivity("live_class.created", "live_class"); setCreateOpen(false); setForm({ title: "", description: "", batch_id: "", date: "", time: "", duration: "60", platform: "zoom", link: "" }); toast.success("Live class scheduled!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("live_classes").update({ status: "cancelled" }).eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tutor-live-classes"] }); toast.success("Class cancelled"); },
  });

  const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const renderCard = (cls: any, isPast: boolean) => {
    const live = isLive(cls);
    return (
      <Card key={cls.id} className={`bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden transition-all hover:shadow-lg duration-300 ${isPast ? "opacity-70" : ""} ${cls.status === "cancelled" ? "opacity-50" : ""} ${live ? "ring-2 ring-green-400/50" : ""}`}>
        {/* Top gradient strip */}
        <div className={`h-1 ${live ? "bg-gradient-to-r from-green-400 to-green-500" : cls.status === "cancelled" ? "bg-red-300" : "bg-gradient-to-r from-brand-gold to-brand-primary"}`} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cls.meeting_platform === "google_meet" ? "bg-green-50" : "bg-blue-50"}`}>
                <Tv className={`h-5 w-5 ${cls.meeting_platform === "google_meet" ? "text-green-600" : "text-blue-600"}`} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-brand-charcoal-mid">{cls.title}</h3>
                <p className="text-xs text-brand-warm-grey mt-1">{cls.batches?.name || "No batch"}</p>
                {cls.description && <p className="text-xs text-brand-warm-grey mt-2 line-clamp-2">{cls.description}</p>}
              </div>
            </div>
            {cls.status === "cancelled" && <Badge className="text-xs bg-red-50 text-red-700 border-0">Cancelled</Badge>}
            {live && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE
              </span>
            )}
          </div>
          <div className="mt-3 space-y-1 ml-13">
            <p className="text-sm text-brand-charcoal-mid">{format(new Date(cls.scheduled_at), "EEEE, dd MMMM yyyy 'at' h:mm a")}</p>
            <p className="text-xs text-brand-warm-grey flex items-center gap-1"><Clock className="h-3 w-3" /> {cls.duration_minutes || 60} minutes</p>
          </div>
          <div className="flex items-center gap-2 mt-4 flex-wrap ml-13">
            <Badge className={`border-0 text-xs font-semibold ${cls.meeting_platform === "google_meet" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
              {cls.meeting_platform === "google_meet" ? "Google Meet" : "Zoom"}
            </Badge>
            {!isPast && cls.status !== "cancelled" && (
              <>
                <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gap-1 text-xs bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl shadow-sm"><ExternalLink className="h-3 w-3" /> Open Link</Button>
                </a>
                <Button size="sm" variant="ghost" className="text-red-600 text-xs hover:bg-red-50 rounded-xl" onClick={() => cancelMutation.mutate(cls.id)}><X className="h-3 w-3 mr-1" /> Cancel</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
              <Video className="w-4 h-4 text-brand-gold" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-brand-primary">Live Classes</h1>
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1 ml-10" />
          <p className="text-brand-warm-grey mt-2 text-sm ml-10">Schedule and manage your live sessions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl shadow-lg hover:shadow-xl transition-all"><Plus className="h-4 w-4" /> Schedule</Button>
      </motion.div>

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-brand-cream-dark rounded-xl p-1">
          <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5" /> Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Past ({past.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
          ) : upcoming.length === 0 ? (
            <Card className="bg-white rounded-2xl border border-brand-parchment"><CardContent className="py-12 text-center"><div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-3"><Video className="h-6 w-6 text-brand-gold" /></div><p className="font-serif text-brand-primary font-semibold">No upcoming classes</p><p className="text-xs text-brand-warm-grey mt-1">Schedule one to get started!</p></CardContent></Card>
          ) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{upcoming.map((cls) => renderCard(cls, false))}</div>)}
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (<Card className="bg-white rounded-2xl border border-brand-parchment"><CardContent className="py-12 text-center"><p className="font-serif text-brand-primary font-semibold">No past classes.</p></CardContent></Card>
          ) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{past.map((cls) => renderCard(cls, true))}</div>)}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl border-brand-parchment">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                <Video className="w-4 h-4 text-brand-gold" />
              </div>
              Schedule Live Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Title</Label><Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Class title" className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20" /></div>
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Description</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Optional description" className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold" /></div>
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Batch</Label><Select value={form.batch_id} onValueChange={(v) => updateField("batch_id", v)}><SelectTrigger className="mt-1 rounded-xl border-brand-parchment"><SelectValue placeholder="Select batch" /></SelectTrigger><SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Date</Label><Input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} className="mt-1 rounded-xl border-brand-parchment" /></div>
              <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Time</Label><Input type="time" value={form.time} onChange={(e) => updateField("time", e.target.value)} className="mt-1 rounded-xl border-brand-parchment" /></div>
            </div>
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Duration (minutes)</Label><Input type="number" value={form.duration} onChange={(e) => updateField("duration", e.target.value)} className="mt-1 rounded-xl border-brand-parchment" /></div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Platform</Label>
              <div className="flex gap-3 mt-1">
                <Button type="button" size="sm" onClick={() => updateField("platform", "zoom")} className={`rounded-xl ${form.platform === "zoom" ? "bg-blue-600 text-white shadow-lg" : "border-2 border-blue-300 text-blue-600 bg-transparent hover:bg-blue-50"}`}>Zoom</Button>
                <Button type="button" size="sm" onClick={() => updateField("platform", "google_meet")} className={`rounded-xl ${form.platform === "google_meet" ? "bg-green-600 text-white shadow-lg" : "border-2 border-green-300 text-green-600 bg-transparent hover:bg-green-50"}`}>Google Meet</Button>
              </div>
            </div>
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Meeting Link</Label><Input value={form.link} onChange={(e) => updateField("link", e.target.value)} placeholder="Paste Zoom/Meet invite link" className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold" /></div>
            <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.batch_id || !form.date || !form.time || !form.link || createMutation.isPending} className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl shadow-lg">
              {createMutation.isPending ? "Scheduling..." : "Schedule Class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorLiveClasses;
