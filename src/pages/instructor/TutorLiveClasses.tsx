import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Plus, Clock, ExternalLink, X, Tv, AlertTriangle, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { logActivity } from "@/lib/activityLogger";
import { getLiveClassStatus, isLiveClassPast } from "@/lib/liveClassStatus";

const TutorLiveClasses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", audience: "all_batches", batch_id: "", date: "", time: "", duration: "60", platform: "zoom" });

  // Fetch tutor profile for master links
  const { data: tutorProfile } = useQuery({
    queryKey: ["tutor-profile-links", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("zoom_link, meet_link").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: batches = [] } = useQuery({ queryKey: ["tutor-batches", user?.id], queryFn: async () => { const { data } = await supabase.from("batches").select("id, name").eq("instructor_id", user!.id); return data || []; }, enabled: !!user });

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["tutor-live-classes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("live_classes").select("*, batches(name)").eq("instructor_id", user!.id).order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const onlineUpcoming = classes.filter((c: any) => (c.class_type === "online" || !c.class_type) && !isLiveClassPast(c));
  const pastOnline = classes.filter((c: any) => isLiveClassPast(c) && (c.class_type === "online" || !c.class_type));

  const masterLink = form.platform === "zoom" ? tutorProfile?.zoom_link : tutorProfile?.meet_link;
  const hasMasterLink = !!masterLink;

  const createMutation = useMutation({
    mutationFn: async () => {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
      const isAll = form.audience === "all_batches";
      const { error } = await supabase.from("live_classes").insert({
        title: form.title,
        description: form.description || null,
        instructor_id: user!.id,
        batch_id: isAll ? null : form.batch_id,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(form.duration) || 60,
        meeting_platform: form.platform,
        meeting_link: masterLink!,
        class_type: "online",
        audience_type: isAll ? "all" : "specific",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutor-live-classes"] });
      logActivity("live_class.created", "live_class");
      setCreateOpen(false);
      setForm({ title: "", description: "", audience: "all_batches", batch_id: "", date: "", time: "", duration: "60", platform: "zoom" });
      const dur = form.duration;
      const plat = form.platform === "zoom" ? "Zoom" : "Google Meet";
      toast.success("Class Scheduled!", { description: `Your ${dur}-minute class has been scheduled. Remember: free ${plat} sessions expire at 60 minutes.` });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("live_classes").update({ status: "cancelled" }).eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tutor-live-classes"] }); toast.success("Class cancelled"); },
  });

  const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const renderOnlineCard = (cls: any, isPast: boolean) => {
    const status = getLiveClassStatus(cls);
    const live = status === "live";
    return (
      <Card key={cls.id} className={`bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden transition-all hover:shadow-lg duration-300 ${isPast ? "opacity-70" : ""} ${cls.status === "cancelled" ? "opacity-50" : ""} ${live ? "ring-2 ring-green-400/50" : ""}`}>
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
            <span className="bg-blue-50 text-blue-700 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Video className="h-2.5 w-2.5" /> ONLINE · {cls.meeting_platform === "google_meet" ? "Meet" : "Zoom"}
            </span>
            {cls.audience_type === "all" ? (
              <span className="bg-green-50 text-green-700 text-[9px] px-2 py-0.5 rounded-full font-bold">All Batches</span>
            ) : (
              <span className="bg-brand-cream text-brand-primary text-[9px] px-2 py-0.5 rounded-full font-bold border border-brand-parchment">{cls.batches?.name || "Batch"}</span>
            )}
            {cls.status === "cancelled" && <Badge className="text-xs bg-red-50 text-red-700 border-0">Cancelled</Badge>}
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


  const canSave = form.title && form.date && form.time && hasMasterLink && (form.audience === "all_batches" || form.batch_id);

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
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl shadow-lg hover:shadow-xl transition-all"><Plus className="h-4 w-4" /> Schedule Online Class</Button>
      </motion.div>

      <Tabs defaultValue="online">
        <TabsList className="bg-brand-cream-dark rounded-xl p-1">
          <TabsTrigger value="online" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5">
            <Video className="h-3.5 w-3.5" /> Online ({onlineUpcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5">
            <History className="h-3.5 w-3.5" /> Past ({pastOnline.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="online" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
          ) : onlineUpcoming.length === 0 ? (
            <Card className="bg-white rounded-2xl border border-brand-parchment"><CardContent className="py-12 text-center"><div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-3"><Video className="h-6 w-6 text-brand-gold" /></div><p className="font-serif text-brand-primary font-semibold">No upcoming online classes</p><p className="text-xs text-brand-warm-grey mt-1">Schedule one to get started!</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{onlineUpcoming.map((cls) => renderOnlineCard(cls, false))}</div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {pastOnline.length === 0 ? (
            <Card className="bg-white rounded-2xl border border-brand-parchment"><CardContent className="py-12 text-center"><p className="font-serif text-brand-primary font-semibold">No past online classes.</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastOnline.map((cls) => renderOnlineCard(cls, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>


      {/* Schedule Online Class Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl border-brand-parchment max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                <Video className="w-4 h-4 text-brand-gold" />
              </div>
              Schedule Online Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Class Title</Label><Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Class title" className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20" /></div>
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Description</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Optional description" className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold" /></div>

            {/* Audience */}
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Class Type — Audience</Label>
              <RadioGroup value={form.audience} onValueChange={(v) => updateField("audience", v)} className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_batches" id="all_batches" />
                  <Label htmlFor="all_batches" className="text-sm cursor-pointer">All My Batches (Generic)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific_batch" id="specific_batch" />
                  <Label htmlFor="specific_batch" className="text-sm cursor-pointer">Specific Batch</Label>
                </div>
              </RadioGroup>
              {form.audience === "specific_batch" && (
                <Select value={form.batch_id} onValueChange={(v) => updateField("batch_id", v)}>
                  <SelectTrigger className="mt-2 rounded-xl border-brand-parchment"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Date</Label><Input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} min={new Date().toISOString().split("T")[0]} className="mt-1 rounded-xl border-brand-parchment" /></div>
              <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Time</Label><Input type="time" value={form.time} onChange={(e) => updateField("time", e.target.value)} className="mt-1 rounded-xl border-brand-parchment" /></div>
            </div>

            {/* Duration */}
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Duration</Label>
              <Select value={form.duration} onValueChange={(v) => updateField("duration", v)}>
                <SelectTrigger className="mt-1 rounded-xl border-brand-parchment"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
              {form.duration === "60" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2 items-start mt-2">
                  <AlertTriangle size={15} className="text-amber-800 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-amber-800">
                    <strong>Free plan reminder:</strong> Zoom and Google Meet free plans expire after 60 minutes. You and your students will need to rejoin the meeting if the session continues beyond 60 minutes.
                  </p>
                </div>
              )}
            </div>

            {/* Platform */}
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Platform</Label>
              <RadioGroup value={form.platform} onValueChange={(v) => updateField("platform", v)} className="mt-2 flex gap-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zoom" id="zoom" />
                  <Label htmlFor="zoom" className="text-sm cursor-pointer">Zoom</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="google_meet" id="google_meet" />
                  <Label htmlFor="google_meet" className="text-sm cursor-pointer">Google Meet</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Master Meeting Link */}
            {hasMasterLink ? (
              <div className="bg-brand-cream border border-brand-parchment rounded-xl px-4 py-3">
                <p className="text-[10px] text-brand-warm-grey uppercase tracking-wide mb-1">Meeting Link (from your profile)</p>
                <p className="text-[13px] text-brand-charcoal break-all">{masterLink}</p>
                <p className="text-[10px] text-brand-warm-grey-light mt-1">This is your personal master link set by the admin. Contact admin to update it.</p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-[12px] text-red-800">
                No {form.platform === "zoom" ? "Zoom" : "Google Meet"} link found in your profile. Please contact the Super Admin to add your master meeting link.
              </div>
            )}

            <Button onClick={() => createMutation.mutate()} disabled={!canSave || createMutation.isPending} className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl shadow-lg">
              {createMutation.isPending ? "Scheduling..." : "Schedule Class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorLiveClasses;
