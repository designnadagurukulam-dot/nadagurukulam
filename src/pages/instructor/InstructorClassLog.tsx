import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookCheck, Plus, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";

interface ClassLog { id: string; topic_covered: string; date: string; notes: string | null; status: string; schedule_id: string | null; curriculum_section_id: string | null; created_at: string; }

const InstructorClassLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ClassLog[]>([]);
  const [sections, setSections] = useState<{ id: string; title: string; module_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [topicCovered, setTopicCovered] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [{ data: logData }, { data: secData }] = await Promise.all([
      supabase.from("class_logs").select("*").eq("instructor_id", user.id).order("date", { ascending: false }),
      supabase.from("curriculum_sections").select("id, title, module_id").then(async (res) => {
        if (!res.data) return { data: [] };
        const moduleIds = [...new Set(res.data.map((s) => s.module_id))];
        const { data: modules } = await supabase.from("curriculum_modules").select("id, module_name").in("id", moduleIds);
        const moduleMap = Object.fromEntries((modules || []).map((m) => [m.id, m.module_name]));
        return { data: res.data.map((s) => ({ id: s.id, title: s.title, module_name: moduleMap[s.module_id] || "" })) };
      }),
    ]);
    setLogs((logData as ClassLog[]) || []); setSections(secData || []); setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreate = async () => {
    if (!topicCovered || !user) { toast({ title: "Please enter the topic covered", variant: "destructive" }); return; }
    const { error } = await supabase.from("class_logs").insert({ instructor_id: user.id, topic_covered: topicCovered, curriculum_section_id: sectionId || null, date, notes: notes || null, status: "pending_confirmation" });
    if (error) { toast({ title: "Failed to log class", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Class logged successfully" }); logActivity("class_log.created", "class_log", undefined, { topic: topicCovered, date }); setDialogOpen(false); setTopicCovered(""); setSectionId(""); setNotes(""); setDate(new Date().toISOString().split("T")[0]); fetchData(); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-primary">Daily Class Log</h1>
          <div className="w-12 h-0.5 bg-brand-gold mt-1" />
          <p className="text-brand-warm-grey mt-2 text-sm">Log topics covered after each class session</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl"><Plus className="h-4 w-4" /> Log Class</Button></DialogTrigger>
          <DialogContent className="rounded-2xl border-brand-parchment">
            <DialogHeader><DialogTitle className="font-serif text-brand-primary">Log Class Completion</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Topic Covered *</label><Input value={topicCovered} onChange={(e) => setTopicCovered(e.target.value)} placeholder="What topic did you cover today?" className="rounded-xl border-brand-parchment focus:border-brand-gold" /></div>
              <div><label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Link to Curriculum Section</label><Select value={sectionId} onValueChange={setSectionId}><SelectTrigger className="rounded-xl border-brand-parchment"><SelectValue placeholder="Select curriculum topic" /></SelectTrigger><SelectContent>{sections.map((s) => (<SelectItem key={s.id} value={s.id}>{s.module_name} → {s.title}</SelectItem>))}</SelectContent></Select></div>
              <div><label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Date</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border-brand-parchment" /></div>
              <div><label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Notes</label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." rows={3} className="rounded-xl border-brand-parchment focus:border-brand-gold" /></div>
              <Button onClick={handleCreate} className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl">Submit Class Log</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {logs.length === 0 ? (
        <Card className="text-center p-12 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <div className="w-16 h-16 rounded-full bg-brand-gold-pale flex items-center justify-center mx-auto mb-4"><BookCheck className="h-8 w-8 text-brand-gold" /></div>
          <h3 className="font-serif text-xl text-brand-primary">No class logs yet</h3>
          <p className="text-brand-warm-grey mt-2">Log your first class session to start tracking</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-brand-charcoal-mid">{log.topic_covered}</h3>
                      {log.notes && <p className="text-xs text-brand-warm-grey mt-1">{log.notes}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-brand-warm-grey"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{log.date}</span></div>
                    </div>
                    <Badge className={`shrink-0 border-0 text-xs ${log.status === "confirmed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {log.status === "confirmed" ? (<span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Confirmed</span>) : (<span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorClassLog;
