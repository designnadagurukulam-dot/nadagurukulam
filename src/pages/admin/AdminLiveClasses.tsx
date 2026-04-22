import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Video, ExternalLink, Monitor, Clock, Radio, Wifi, WifiOff, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { getLiveClassBadgeClass, getLiveClassLabel, getLiveClassStatus, isLiveClassPast } from "@/lib/liveClassStatus";

const AdminLiveClasses = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [batches, setBatches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("live_classes").select("*").order("scheduled_at", { ascending: false });
      const items = data || [];
      setClasses(items);
      const instrIds = [...new Set(items.map(c => c.instructor_id))];
      const batchIds = [...new Set(items.map(c => c.batch_id).filter(Boolean))];
      const [profRes, batchRes] = await Promise.all([
        instrIds.length > 0 ? supabase.from("profiles").select("user_id, display_name, zoom_link, meet_link").in("user_id", instrIds) : { data: [] },
        batchIds.length > 0 ? supabase.from("batches").select("id, name").in("id", batchIds) : { data: [] },
      ]);
      const pm: Record<string, any> = {};
      (profRes.data || []).forEach(p => { pm[p.user_id] = p; });
      setProfiles(pm);
      const bm: Record<string, string> = {};
      (batchRes.data || []).forEach(b => { bm[b.id] = b.name; });
      setBatches(bm);
      setLoading(false);
    };
    fetch();
  }, []);

  const liveNowCount = classes.filter(c => getLiveClassStatus(c) === "live").length;
  const upcoming = classes.filter(c => !isLiveClassPast(c));
  const past = classes.filter(isLiveClassPast);
  const onlineClasses = classes.filter(c => c.class_type !== "offline");
  const offlineClasses = classes.filter(c => c.class_type === "offline");

  const renderTable = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4">
            <Video className="h-7 w-7 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl text-brand-primary">No Classes Found</h3>
          <p className="text-sm text-brand-warm-grey mt-1">No live classes in this category</p>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-brand-primary-dark to-brand-primary hover:bg-brand-primary-dark">
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold">Title</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold">Instructor</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold">Type</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold">Audience</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold">Batch</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold">Date & Time</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold">Status</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c, i) => {
                const prof = profiles[c.instructor_id];
                const computedStatus = getLiveClassStatus(c);
                return (
                  <TableRow key={c.id} className={`${i % 2 === 1 ? "bg-brand-cream" : "bg-white"} hover:bg-brand-cream transition-colors border-b border-brand-parchment`}>
                    <TableCell className="font-medium text-brand-charcoal">{c.title}</TableCell>
                    <TableCell className="text-brand-charcoal">{prof?.display_name || "—"}</TableCell>
                    <TableCell>
                      <Badge className={c.class_type === "offline"
                        ? "bg-brand-cream text-brand-charcoal-mid border border-brand-parchment gap-1"
                        : "bg-blue-50 text-blue-700 border border-blue-200 gap-1"
                      }>
                        {c.class_type === "offline" ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                        {c.class_type === "offline" ? "Offline" : "Online"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={c.audience_type === "all"
                        ? "bg-brand-gold-pale text-brand-gold-dark border border-brand-gold/30 text-[10px]"
                        : "bg-brand-cream text-brand-warm-grey border border-brand-parchment text-[10px]"
                      }>
                        {c.audience_type === "all" ? "All Batches" : "Specific Batch"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-brand-warm-grey">{c.batch_id ? (batches[c.batch_id] || "—") : "—"}</TableCell>
                    <TableCell className="text-sm text-brand-charcoal">
                      {new Date(c.scheduled_at).toLocaleString()}
                      <span className="text-brand-warm-grey ml-1">({c.duration_minutes || 60}m)</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getLiveClassBadgeClass(computedStatus)} gap-1`}>
                        {computedStatus === "live" && <Radio className="h-3 w-3" />}
                        {getLiveClassLabel(computedStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {c.class_type !== "offline" && c.meeting_link && (
                        <Button size="sm" variant="ghost" asChild className="hover:bg-brand-gold-pale text-brand-primary">
                          <a href={c.meeting_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
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
    return (
      <div className="space-y-6 pt-2">
        <Skeleton className="h-10 w-48 rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-brand-primary">Live Classes</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Classes", value: classes.length, icon: Video, gradient: "from-brand-primary to-brand-primary-dark" },
          { label: "Live Now", value: liveNowCount, icon: Radio, gradient: "from-red-500 to-red-700" },
          { label: "Online", value: onlineClasses.length, icon: Wifi, gradient: "from-blue-500 to-blue-700" },
          { label: "Offline", value: offlineClasses.length, icon: WifiOff, gradient: "from-brand-warm-grey to-brand-charcoal-mid" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                <s.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-brand-primary">{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-warm-grey font-semibold">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-brand-cream border border-brand-parchment rounded-xl p-1">
          <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">
            Past ({past.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">{renderTable(upcoming)}</TabsContent>
        <TabsContent value="past" className="mt-4">{renderTable(past)}</TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLiveClasses;
