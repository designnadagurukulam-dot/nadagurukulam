import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Video, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">No classes found</p>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{profiles[c.instructor_id] || "—"}</TableCell>
                  <TableCell>{c.batch_id ? (batches[c.batch_id] || "—") : "—"}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(c.scheduled_at).toLocaleString()}
                    <span className="text-muted-foreground ml-1">({c.duration_minutes || 60}m)</span>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{c.meeting_platform || "zoom"}</Badge></TableCell>
                  <TableCell>
                    {isLive(c) ? (
                      <Badge className="bg-red-500 text-white animate-pulse">LIVE</Badge>
                    ) : (
                      <Badge variant={c.status === "completed" ? "outline" : "default"}>{c.status || "scheduled"}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild>
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
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 pt-12 lg:pt-0">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <Video className="h-7 w-7 text-primary" />
          <h1 className="font-serif text-2xl text-foreground">Live Classes</h1>
        </div>
      </motion.div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">{renderTable(upcoming)}</TabsContent>
        <TabsContent value="past" className="mt-4">{renderTable(past)}</TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLiveClasses;
