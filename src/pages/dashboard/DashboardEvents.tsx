import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isPast, isSameDay } from "date-fns";
import { CalendarDays, MapPin, Plus, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props { roleType: "student" | "instructor"; }

const DashboardEvents = ({ roleType }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", event_date: "", end_date: "", location: "", event_type: "Class Activity" });
  const [overlapWarning, setOverlapWarning] = useState<{ msg: string; payload: any } | null>(null);

  const { data: events = [] } = useQuery({
    queryKey: ["dash-events", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: types = [] } = useQuery({
    queryKey: ["event-types-public"],
    queryFn: async () => {
      const { data } = await supabase.from("event_types" as any).select("*").order("name");
      return (data as any[]) || [];
    },
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["overlap-schedules"],
    queryFn: async () => {
      const { data } = await supabase.from("schedules").select("event_title, start_time, end_time");
      return data || [];
    },
  });

  const createEvent = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("events").insert({
        ...payload,
        created_by: user!.id,
        is_internal: true,
        approval_status: "pending",
        is_active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-events"] });
      toast.success("Event submitted for admin approval");
      setOpen(false);
      setForm({ title: "", description: "", event_date: "", end_date: "", location: "", event_type: "Class Activity" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dash-events"] }); toast.success("Event removed"); },
    onError: (e: any) => toast.error(e.message),
  });

  const checkOverlapAndSubmit = () => {
    if (!form.title || !form.event_date) return toast.error("Title and start date are required");
    const start = new Date(form.event_date).getTime();
    const end = form.end_date ? new Date(form.end_date).getTime() : start + 60 * 60 * 1000;
    const conflict = schedules.find((s: any) => {
      const ss = new Date(s.start_time).getTime();
      const se = new Date(s.end_time).getTime();
      return start < se && end > ss;
    });
    const payload = {
      title: form.title,
      description: form.description || null,
      event_date: form.event_date,
      end_date: form.end_date || null,
      location: form.location || null,
      event_type: form.event_type,
    };
    if (conflict) {
      setOverlapWarning({ msg: `This time overlaps with "${conflict.event_title}" in the institutional timetable.`, payload });
      return;
    }
    createEvent.mutate(payload);
  };

  const upcoming = events.filter((e: any) => !isPast(new Date(e.event_date)));
  const past = events.filter((e: any) => isPast(new Date(e.event_date)));

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-brand-primary flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-brand-primary">Events</h1>
            <p className="text-xs text-brand-warm-grey">Approved events appear here. You may submit your own (admin approval needed).</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark"><Plus className="h-4 w-4" /> Suggest Event</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader><DialogTitle className="font-serif text-brand-primary">Suggest an Internal Event</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey">Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey">Description</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey">Start *</Label>
                  <Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey">End</Label>
                  <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey">Type</Label>
                <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {types.map((t: any) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey">Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <Button onClick={checkOverlapAndSubmit} disabled={createEvent.isPending} className="w-full bg-brand-primary text-primary-foreground">
                {createEvent.isPending ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!overlapWarning} onOpenChange={(o) => !o && setOverlapWarning(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-destructive">Schedule Overlap</DialogTitle></DialogHeader>
          <p className="text-sm text-brand-charcoal">{overlapWarning?.msg}</p>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setOverlapWarning(null)}>Cancel</Button>
            <Button onClick={() => { if (overlapWarning) { createEvent.mutate(overlapWarning.payload); setOverlapWarning(null); } }} className="bg-brand-primary text-primary-foreground">Create Anyway</Button>
          </div>
        </DialogContent>
      </Dialog>

      <section>
        <h2 className="font-serif text-lg text-brand-primary mb-2">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center text-brand-warm-grey">No upcoming events</div>
        ) : (
          <div className="grid gap-3">
            {upcoming.map((e: any) => (
              <div key={e.id} className="bg-card rounded-2xl p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-brand-primary">{e.title}</h3>
                      {e.approval_status === "pending" && <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">Pending Approval</Badge>}
                      {e.is_internal && <Badge className="bg-brand-cream-dark text-brand-charcoal-mid border-0 text-[10px]">Internal</Badge>}
                    </div>
                    <p className="text-xs text-brand-warm-grey mt-1 flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(e.event_date), "PPp")}</span>
                      {e.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>}
                    </p>
                    {e.description && <p className="text-sm text-brand-charcoal/80 mt-2">{e.description}</p>}
                  </div>
                  {e.created_by === user?.id && e.approval_status === "pending" && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteEvent.mutate(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="font-serif text-lg text-brand-primary mb-2">Past</h2>
          <div className="grid gap-2">
            {past.slice(0, 10).map((e: any) => (
              <div key={e.id} className="bg-card rounded-2xl p-3 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif text-sm text-brand-primary">{e.title}</p>
                    <p className="text-xs text-brand-warm-grey">{format(new Date(e.event_date), "PP")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default DashboardEvents;
