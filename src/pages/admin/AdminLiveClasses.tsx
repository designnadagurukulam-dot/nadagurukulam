import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Video, ExternalLink, Clock, Radio, Users, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getLiveClassBadgeClass, getLiveClassLabel, getLiveClassStatus, isLiveClassPast } from "@/lib/liveClassStatus";

const db = supabase as any;

const detectPlatform = (link: string | null | undefined): string => {
  if (!link) return "other";
  const l = link.toLowerCase();
  if (l.includes("zoom.")) return "zoom";
  if (l.includes("meet.google") || l.includes("g.co/meet")) return "meet";
  return "other";
};

const AdminLiveClasses = () => {
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";

  const [classes, setClasses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [batches, setBatches] = useState<Record<string, string>>({});
  const [batchList, setBatchList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [showInstructorList, setShowInstructorList] = useState(false);
  const [editInstructor, setEditInstructor] = useState<any>(null);
  const [linkForm, setLinkForm] = useState({ zoom_link: "", meet_link: "" });

  // Filters
  const [filterInstructor, setFilterInstructor] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");

  // Hours breakdown dialog
  const [hoursOpen, setHoursOpen] = useState(false);
  const [typeLabels, setTypeLabels] = useState<Record<string, string>>({});
  const facultyTypeLabel = (slug?: string | null) => typeLabels[slug || "regular"] || (slug ? slug.replace(/_/g, " ") : "Regular Staff");

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: roles }, { data: lc }] = await Promise.all([
      db.from("user_roles").select("user_id").eq("role", "instructor"),
      supabase.from("live_classes").select("*").order("scheduled_at", { ascending: false }),
    ]);
    const ids = (roles || []).map((r: any) => r.user_id);
    const [{ data: profs }, { data: bch }] = await Promise.all([
      ids.length ? db.from("profiles").select("user_id, display_name, employee_id, designation, department, instructor_type, zoom_link, meet_link").in("user_id", ids) : Promise.resolve({ data: [] }),
      supabase.from("batches").select("id, name"),
    ]);
    setInstructors(profs || []);
    setClasses(lc || []);
    const bm: Record<string, string> = {};
    (bch || []).forEach((b: any) => { bm[b.id] = b.name; });
    setBatches(bm);
    setBatchList((bch || []) as any);
    const { data: ftypes } = await db.from("faculty_types").select("slug, name");
    const tl: Record<string, string> = {};
    (ftypes || []).forEach((t: any) => { tl[t.slug] = t.name; });
    setTypeLabels(tl);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const onlineClasses = useMemo(() => classes.filter((c) => c.class_type !== "offline"), [classes]);

  const filteredOnline = useMemo(() => onlineClasses.filter((c) => {
    if (filterInstructor !== "all" && c.instructor_id !== filterInstructor) return false;
    if (filterBatch !== "all" && c.batch_id !== filterBatch) return false;
    const status = getLiveClassStatus(c);
    if (filterStatus !== "all" && status !== filterStatus) return false;
    if (filterPlatform !== "all" && detectPlatform(c.meeting_link) !== filterPlatform) return false;
    return true;
  }), [onlineClasses, filterInstructor, filterBatch, filterStatus, filterPlatform]);

  const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString();
  const onlineToday = filteredOnline.filter((c) => isToday(c.scheduled_at));
  const totalOnlineHours = filteredOnline.reduce((s, c) => s + ((c.duration_minutes || 60) / 60), 0);
  const upcoming = filteredOnline.filter((c) => !isLiveClassPast(c));
  const past = filteredOnline.filter(isLiveClassPast);

  const instructorHoursBreakdown = useMemo(() => {
    const map: Record<string, { instructor: string; classes: number; hours: number }> = {};
    onlineClasses.forEach((c) => {
      const prof = instructors.find((t) => t.user_id === c.instructor_id);
      const name = prof?.display_name || "Unknown";
      if (!map[c.instructor_id]) map[c.instructor_id] = { instructor: name, classes: 0, hours: 0 };
      map[c.instructor_id].classes += 1;
      map[c.instructor_id].hours += (c.duration_minutes || 60) / 60;
    });
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [onlineClasses, instructors]);

  const openInstructor = (t: any) => {
    setEditInstructor(t);
    setLinkForm({ zoom_link: t.zoom_link || "", meet_link: t.meet_link || "" });
  };

  const saveLinks = async () => {
    if (!editInstructor) return;
    const { error } = await db.from("profiles").update({ zoom_link: linkForm.zoom_link || null, meet_link: linkForm.meet_link || null }).eq("user_id", editInstructor.user_id);
    if (error) return toast.error(error.message);
    toast.success("Faculty meeting links saved");
    setEditInstructor(null);
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
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Faculty</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Audience</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Batch</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Date &amp; Time</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Platform</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Status</TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c, i) => {
                const prof = instructors.find((t) => t.user_id === c.instructor_id);
                const computedStatus = getLiveClassStatus(c);
                const platform = detectPlatform(c.meeting_link);
                return (
                  <TableRow key={c.id} className={`${i % 2 === 1 ? "bg-brand-cream" : "bg-white"} border-b border-brand-parchment hover:bg-brand-cream`}>
                    <TableCell className="font-medium text-brand-charcoal">{c.title}</TableCell>
                    <TableCell className="text-brand-charcoal">{prof?.display_name || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{c.audience_type === "all" ? "All Batches" : "Specific"}</Badge></TableCell>
                    <TableCell className="text-brand-warm-grey">{c.batch_id ? batches[c.batch_id] || "—" : "—"}</TableCell>
                    <TableCell className="text-sm text-brand-charcoal">{new Date(c.scheduled_at).toLocaleString()} <span className="ml-1 text-brand-warm-grey">({c.duration_minutes || 60}m)</span></TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{platform}</Badge></TableCell>
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
    { key: "instructors", label: "Faculty", value: instructors.length, icon: Users, gradient: "from-brand-gold to-brand-primary", onClick: () => setShowInstructorList((v) => !v) },
    { key: "total", label: "Total Online Classes", value: filteredOnline.length, icon: Video, gradient: "from-brand-primary to-brand-primary-dark", onClick: () => {} },
    { key: "today", label: "Online Today", value: onlineToday.length, icon: Radio, gradient: "from-red-500 to-red-700", onClick: () => {} },
    { key: "hours", label: "Total Online Hours", value: totalOnlineHours.toFixed(1), icon: Clock, gradient: "from-emerald-500 to-emerald-700", onClick: () => setHoursOpen(true) },
  ];

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark"><Video className="h-5 w-5 text-white" /></div>
          <div><h1 className="font-serif text-2xl font-semibold text-brand-primary">Live Classes</h1><div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-brand-gold to-transparent" /></div>
        </div>
        <p className="mt-2 text-sm text-brand-warm-grey">Online classes only — offline sessions are managed in the Timetable.</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((s, i) => (
          <motion.button key={s.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={s.onClick} className="group flex items-center gap-3 rounded-2xl border border-brand-parchment bg-white p-5 text-left shadow-[0_2px_24px_rgba(125,30,36,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)]">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${s.gradient} shadow-lg`}><s.icon className="h-4 w-4 text-white" /></div>
            <div><p className="font-serif text-2xl font-bold text-brand-primary">{s.value}</p><p className="text-[10px] font-semibold uppercase tracking-widest text-brand-warm-grey">{s.label}</p></div>
          </motion.button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid gap-3 rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] sm:grid-cols-2 lg:grid-cols-4">
        <Select value={filterInstructor} onValueChange={setFilterInstructor}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Faculty" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Faculty</SelectItem>{instructors.map((t) => <SelectItem key={t.user_id} value={t.user_id}>{t.display_name || "Unnamed"}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterBatch} onValueChange={setFilterBatch}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Batch" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Batches</SelectItem>{batchList.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="live">Live</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
        </Select>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Platforms</SelectItem><SelectItem value="zoom">Zoom</SelectItem><SelectItem value="meet">Google Meet</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
        </Select>
      </div>

      {showInstructorList && (
        <div className="space-y-2 rounded-2xl border border-brand-parchment bg-white p-4 shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-brand-primary">Faculty — Meeting Links</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowInstructorList(false)}><X className="h-4 w-4" /></Button>
          </div>
          {instructors.map((t) => {
            const hasLink = t.zoom_link || t.meet_link;
            return (
              <div key={t.user_id} className="flex flex-col gap-2 rounded-xl bg-brand-cream/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-brand-primary">{t.display_name || "Unnamed"}</p>
                  <p className="text-xs text-brand-warm-grey">
                    Emp ID: {t.employee_id || "—"} · {t.department || "No program"} · {t.designation || "—"} · {facultyTypeLabel(t.instructor_type)}
                  </p>
                  {!hasLink && (isAdmin
                    ? <Badge variant="outline" className="mt-1 text-[10px]">No meeting links created</Badge>
                    : <Badge variant="destructive" className="mt-1 text-[10px]">No meeting links — contact admin</Badge>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => openInstructor(t)}>{hasLink ? "Edit Links" : "Add Links"}</Button>
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

      {/* Edit instructor meeting links */}
      <Dialog open={!!editInstructor} onOpenChange={(open) => !open && setEditInstructor(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">{editInstructor?.display_name} — Meeting Links</DialogTitle></DialogHeader>
          <p className="text-xs text-brand-warm-grey">
            Emp ID: {editInstructor?.employee_id || "—"} · {editInstructor?.department || "No program"} · {editInstructor?.designation || "—"} · {facultyTypeLabel(editInstructor?.instructor_type)}
          </p>
          <div className="space-y-3">
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Zoom Link</label><Input value={linkForm.zoom_link} onChange={(e) => setLinkForm({ ...linkForm, zoom_link: e.target.value })} placeholder="https://zoom.us/j/..." /></div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Google Meet Link</label><Input value={linkForm.meet_link} onChange={(e) => setLinkForm({ ...linkForm, meet_link: e.target.value })} placeholder="https://meet.google.com/..." /></div>
            <Button onClick={saveLinks} className="w-full"><Save className="h-4 w-4" /> Save Links</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hours breakdown dialog */}
      <Dialog open={hoursOpen} onOpenChange={setHoursOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">Online Hours by Faculty</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Faculty</TableHead><TableHead className="text-right">Classes</TableHead><TableHead className="text-right">Total Hours</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {instructorHoursBreakdown.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No data</TableCell></TableRow>
                ) : instructorHoursBreakdown.map((row) => (
                  <TableRow key={row.instructor}><TableCell>{row.instructor}</TableCell><TableCell className="text-right">{row.classes}</TableCell><TableCell className="text-right font-mono">{row.hours.toFixed(1)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLiveClasses;
