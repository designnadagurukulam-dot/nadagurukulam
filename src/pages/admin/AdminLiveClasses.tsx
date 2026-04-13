import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Video, ExternalLink, Monitor, Clock, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

const AdminLiveClasses = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
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
        instrIds.length > 0 ? supabase.from("profiles").select("user_id, display_name").in("user_id", instrIds) : { data: [] },
        batchIds.length > 0 ? supabase.from("batches").select("id, name").in("id", batchIds) : { data: [] },
      ]);

      const pm: Record<string, string> = {};
      (profRes.data || []).forEach(p => { pm[p.user_id] = p.display_name || "Tutor"; });
      setProfiles(pm);

      const bm: Record<string, string> = {};
      (batchRes.data || []).forEach(b => { bm[b.id] = b.name; });
      setBatches(bm);
      setLoading(false);
    };
    fetch();
  }, []);

  const now = new Date();
  const upcoming = classes.filter(c => new Date(c.scheduled_at) >= now);
  const past = classes.filter(c => new Date(c.scheduled_at) < now);

  const isLive = (c: any) => {
    const start = new Date(c.scheduled_at);
    const end = new Date(start.getTime() + (c.duration_minutes || 60) * 60000);
    return now >= start && now <= end;
  };

  const renderTable = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5E9CE] flex items-center justify-center mx-auto mb-4">
            <Video className="h-7 w-7 text-[#C49A3C]" />
          </div>
          <h3 className="font-serif text-xl text-[#7D1E24]">No Classes Found</h3>
          <p className="text-sm text-[#8C7B6B] mt-1">No live classes in this category</p>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#5C1219] hover:bg-[#5C1219]">
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Title</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Instructor</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Batch</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Date & Time</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Platform</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Status</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c, i) => (
                <TableRow key={c.id} className={`${i % 2 === 1 ? "bg-[#FAF6EE]" : "bg-white"} hover:bg-[#FAF6EE] transition-colors border-b border-[#EDE3CC]`}>
                  <TableCell className="font-medium text-[#3D2E22]">{c.title}</TableCell>
                  <TableCell className="text-[#3D2E22]">{profiles[c.instructor_id] || "—"}</TableCell>
                  <TableCell className="text-[#8C7B6B]">{c.batch_id ? (batches[c.batch_id] || "—") : "—"}</TableCell>
                  <TableCell className="text-sm text-[#3D2E22]">
                    {new Date(c.scheduled_at).toLocaleString()}
                    <span className="text-[#8C7B6B] ml-1">({c.duration_minutes || 60}m)</span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-[#F5E9CE] text-[#8B6914] border border-[#EDE3CC] gap-1">
                      <Monitor className="h-3 w-3" />
                      {c.meeting_platform || "zoom"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isLive(c) ? (
                      <Badge className="bg-red-500 text-white animate-pulse gap-1">
                        <Radio className="h-3 w-3" /> LIVE
                      </Badge>
                    ) : (
                      <Badge className={c.status === "completed"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-[#FAF6EE] text-[#7D1E24] border border-[#EDE3CC]"
                      }>
                        {c.status || "scheduled"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild className="hover:bg-[#F5E9CE] text-[#7D1E24]">
                      <a href={c.meeting_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F5E9CE] flex items-center justify-center">
            <Video className="h-5 w-5 text-[#7D1E24]" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">Live Classes</h1>
            <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Classes", value: classes.length, icon: Video, color: "#7D1E24" },
          { label: "Upcoming", value: upcoming.length, icon: Clock, color: "#C49A3C" },
          { label: "Completed", value: past.length, icon: Monitor, color: "#5C1219" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-[#F5E9CE] flex items-center justify-center">
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="font-serif text-3xl font-bold text-[#7D1E24]">{s.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-[#FAF6EE] border border-[#EDE3CC] rounded-xl p-1">
          <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-[#7D1E24] data-[state=active]:text-white text-[#8C7B6B]">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-[#7D1E24] data-[state=active]:text-white text-[#8C7B6B]">
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
