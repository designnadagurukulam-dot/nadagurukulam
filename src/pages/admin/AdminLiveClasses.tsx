import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Video, ExternalLink, Clock, Radio, Wifi, Users, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getLiveClassBadgeClass, getLiveClassLabel, getLiveClassStatus, isLiveClassPast } from "@/lib/liveClassStatus";

const db = supabase as any;

const AdminLiveClasses = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [batches, setBatches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showTutorList, setShowTutorList] = useState(false);
  const [editTutor, setEditTutor] = useState<any>(null);
  const [linkForm, setLinkForm] = useState({ zoom_link: "", meet_link: "" });

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: roles }, { data: lc }, { data: alloc }, { data: mods }] = await Promise.all([
      db.from("user_roles").select("user_id").eq("role", "instructor"),
      supabase.from("live_classes").select("*").order("scheduled_at", { ascending: false }),
      db.from("subject_allocations").select("*"),
      db.from("curriculum_modules").select("id, subject_name, course_code"),
    ]);
    const ids = (roles || []).map((r: any) => r.user_id);
    const [{ data: profs }, { data: bch }] = await Promise.all([
      ids.length ? db.from("profiles").select("user_id, display_name, employee_id, designation, zoom_link, meet_link").in("user_id", ids) : Promise.resolve({ data: [] }),
      supabase.from("batches").select("id, name"),
    ]);
    setTutors(profs || []);
    setClasses(lc || []);
    setAllocations(alloc || []);
    setModules(mods || []);
    const bm: Record<string, string> = {};
    (bch || []).forEach((b: any) => { bm[b.id] = b.name; });
    setBatches(bm);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Restrict to online classes only — offline lives in Schedule
  const onlineClasses = classes.filter((c) => c.class_type !== "offline");

  const isToday = (d: string) => {
    const dt = new Date(d);
    const now = new Date();
    return dt.toDateString() === now.toDateString();
  };
  const onlineToday = onlineClasses.filter((c) => isToday(c.scheduled_at));
  const totalOnlineHours = onlineClasses.reduce((sum, c) => sum + ((c.duration_minutes || 60) / 60), 0);
  const upcoming = onlineClasses.filter((c) => !isLiveClassPast(c));
  const past = onlineClasses.filter(isLiveClassPast);

  const getCoursesForTutor = (uid: string) => {
    const moduleIds = allocations.filter((a) => a.instructor_id === uid).map((a) => a.curriculum_module_id);
    return modules.filter((m) => moduleIds.includes(m.id));
  };

  const openTutor = (tutor: any) => {
    setEditTutor(tutor);
    setLinkForm({ zoom_link: tutor.zoom_link || "", meet_link: tutor.meet_link || "" });
  };

  const saveLinks = async () => {
    if (!editTutor) return;
    const { error } = await db.from("profiles").update({ zoom_link: linkForm.zoom_link || null, meet_link: linkForm.meet_link || null }).eq("user_id", editTutor.user_id);
    if (error) return toast.error(error.message);
    toast.success("Tutor meeting links saved");
    setEditTutor(null);
    fetchAll();
  };

  const renderTable = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="rounded-2xl border border-brand-parchment bg-white py-16 text-center shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <Video className="mx-auto mb-3 h-7 w-7 text-brand-gold" />
          <h3 className="font-serif text-xl text-brand-primary">No Online Classes</h3>
        </div>
      );
    }
    return (
      <div className="overflow-hidden rounded-2xl border border-brand-parchment bg-white shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-brand-primary-dark to-brand-primary hover:bg-brand-primary-dark">
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Title</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Tutor</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Audience</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Batch</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Date & Time</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Status</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c, i) => {
                const prof = tutors.find((t) => t.user_id === c.instructor_id);
                const computedStatus = getLiveClassStatus(c);
                return (
                  <TableRow key={c.id} className={`${i % 2 === 1 ? "bg-brand-cream" : "bg-white"} border-b border-brand-parchment hover:bg-brand-cream`}>
                    <TableCell className="font-medium text-brand-charcoal">{c.title}</TableCell>
                    <TableCell className="text-brand-charcoal">{prof?.display_name || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{c.audience_type === "all" ? "All Batches" : "Specific"}</Badge></TableCell>
                    <TableCell className="text-brand-warm-grey">{c.batch_id ? batches[c.batch_id] || "—" : "—"}</TableCell>
                    <TableCell className="text-sm text-brand-charcoal">{new Date(c.scheduled_at).toLocaleString()} <span className="ml-1 text-brand-warm-grey">({c.duration_minutes || 60}m)</span></TableCell>
                    <TableCell><Badge className={`${getLiveClassBadgeClass(computedStatus)} gap-1`}>{computedStatus === "live" && <Radio className="h-3 w-3" />}{getLiveClassLabel(computedStatus)}</Badge></TableCell>
                    <TableCell className="text-right">
                      {c.meeting_link && <Button size="sm" variant="ghost" asChild className="text-brand-primary hover:bg-brand-gold-pale"><a href={c.meeting_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="space-y-6 pt-2"><Skeleton className="h-10 w-48 rounded-xl" />{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  }

  const tiles = [
    { key: "tutors", label: "Tutors", value: tutors.length, icon: Users, gradient: "from-brand-gold to-brand-primary", onClick: () => setShowTutorList((v) => !v) },
    { key: "total", label: "Total Classes", value: onlineClasses.length, icon: Video, gradient: "from-brand-primary to-brand-primary-dark", onClick: () => {} },
    { key: "today", label: "Online Today", value: onlineToday.length, icon: Radio, gradient: "from-red-500 to-red-700", onClick: () => {} },
    { key: "alltime", label: "All-time Online", value: onlineClasses.length, icon: Wifi, gradient: "from-blue-500 to-blue-700", onClick: () => {} },
    { key: "hours", label: "Online Hours", value: totalOnlineHours.toFixed(1), icon: Clock, gradient: "from-emerald-500 to-emerald-700", onClick: () => {} },
  ];

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark"><Video className="h-5 w-5 text-white" /></div>
          <div><h1 className="font-serif text-2xl font-semibold text-brand-primary">Live Classes</h1><div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-brand-gold to-transparent" /></div>
        </div>
        <p className="mt-2 text-sm text-brand-warm-grey">Online classes only — offline sessions are managed in the Schedule.</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((s, i) => (
          <motion.button key={s.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={s.onClick} className="group flex items-center gap-3 rounded-2xl border border-brand-parchment bg-white p-5 text-left shadow-[0_2px_24px_rgba(125,30,36,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)]">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${s.gradient} shadow-lg`}><s.icon className="h-4 w-4 text-white" /></div>
            <div><p className="font-serif text-2xl font-bold text-brand-primary">{s.value}</p><p className="text-[10px] font-semibold uppercase tracking-widest text-brand-warm-grey">{s.label}</p></div>
          </motion.button>
        ))}
      </div>

      {showTutorList && (
        <div className="space-y-2 rounded-2xl border border-brand-parchment bg-white p-4 shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-brand-primary">Tutors — Meeting Links</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowTutorList(false)}><X className="h-4 w-4" /></Button>
          </div>
          {tutors.map((t) => {
            const courses = getCoursesForTutor(t.user_id);
            const hasLink = t.zoom_link || t.meet_link;
            return (
              <div key={t.user_id} className="flex flex-col gap-2 rounded-xl bg-brand-cream/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-brand-primary">{t.display_name || "Unnamed"} {t.employee_id && <span className="text-xs text-brand-warm-grey">· {t.employee_id}</span>}</p>
                  <p className="text-xs text-brand-warm-grey">{t.designation || "—"} · {courses.length} course(s) allocated</p>
                  {!hasLink && <Badge variant="destructive" className="mt-1 text-[10px]">No meeting links — contact admin</Badge>}
                </div>
                <Button size="sm" variant="outline" onClick={() => openTutor(t)}>{hasLink ? "Edit Links" : "Add Links"}</Button>
              </div>
            );
          })}
        </div>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList className="rounded-xl border border-brand-parchment bg-brand-cream p-1">
          <TabsTrigger value="upcoming" className="rounded-lg text-brand-warm-grey data-[state=active]:bg-brand-primary data-[state=active]:text-white">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg text-brand-warm-grey data-[state=active]:bg-brand-primary data-[state=active]:text-white">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">{renderTable(upcoming)}</TabsContent>
        <TabsContent value="past" className="mt-4">{renderTable(past)}</TabsContent>
      </Tabs>

      <Dialog open={!!editTutor} onOpenChange={(open) => !open && setEditTutor(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">{editTutor?.display_name} — Meeting Links</DialogTitle></DialogHeader>
          <p className="text-xs text-brand-warm-grey">Courses allocated: {getCoursesForTutor(editTutor?.user_id || "").map((c) => c.subject_name).join(", ") || "—"}</p>
          <div className="space-y-3">
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Zoom Link</label><Input value={linkForm.zoom_link} onChange={(e) => setLinkForm({ ...linkForm, zoom_link: e.target.value })} placeholder="https://zoom.us/j/..." /></div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Google Meet Link</label><Input value={linkForm.meet_link} onChange={(e) => setLinkForm({ ...linkForm, meet_link: e.target.value })} placeholder="https://meet.google.com/..." /></div>
            <Button onClick={saveLinks} className="w-full"><Save className="h-4 w-4" /> Save Links</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLiveClasses;
