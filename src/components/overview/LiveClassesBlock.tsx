import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Video, ArrowRight, Wifi, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subMinutes, addMinutes } from "date-fns";

type Scope =
  | { kind: "instructor"; instructorId: string }
  | { kind: "student"; batchIds: string[] }
  | { kind: "admin" };

interface Props {
  scope: Scope;
  seeAllLink: string;
  /** Section title – defaults to "Live Classes" */
  title?: string;
}

interface ClassRow {
  id: string;
  title: string;
  class_type: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  batch_id: string | null;
  audience_type: string | null;
  meeting_link: string | null;
  instructor_id: string;
  facultyName?: string;
  batchName?: string;
}

const isClassLive = (scheduledAt: string, durationMin: number | null) => {
  const now = new Date();
  const start = subMinutes(new Date(scheduledAt), 10);
  const end = addMinutes(new Date(scheduledAt), durationMin || 60);
  return now >= start && now <= end;
};

const LiveClassesBlock = ({ scope, seeAllLink, title = "Live Classes" }: Props) => {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      let query = supabase
        .from("live_classes")
        .select("id, title, class_type, scheduled_at, duration_minutes, batch_id, audience_type, meeting_link, instructor_id")
        .order("scheduled_at", { ascending: true })
        .limit(50);

      if (scope.kind === "instructor") {
        query = query.eq("instructor_id", scope.instructorId);
      } else if (scope.kind === "student") {
        if (scope.batchIds.length > 0) {
          query = query.or(`batch_id.in.(${scope.batchIds.join(",")}),audience_type.eq.all`);
        } else {
          query = query.eq("audience_type", "all");
        }
      }

      const { data } = await query;
      const rows = (data || []) as ClassRow[];

      // Hydrate faculty + batch names
      const instructorIds = [...new Set(rows.map((r) => r.instructor_id).filter(Boolean))];
      const batchIds = [...new Set(rows.map((r) => r.batch_id).filter(Boolean) as string[])];
      const [profsRes, batchesRes] = await Promise.all([
        instructorIds.length
          ? supabase.from("profiles").select("user_id, display_name").in("user_id", instructorIds)
          : Promise.resolve({ data: [] as any[] }),
        batchIds.length
          ? supabase.from("batches").select("id, name").in("id", batchIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const facultyMap: Record<string, string> = {};
      (profsRes.data || []).forEach((p: any) => { facultyMap[p.user_id] = p.display_name || "Faculty"; });
      const batchMap: Record<string, string> = {};
      (batchesRes.data || []).forEach((b: any) => { batchMap[b.id] = b.name; });

      setClasses(rows.map((r) => ({
        ...r,
        facultyName: facultyMap[r.instructor_id] || "Faculty",
        batchName: r.batch_id ? batchMap[r.batch_id] : (r.audience_type === "all" ? "All" : "—"),
      })));
      setLoading(false);
    };
    run();
  }, [scope.kind, (scope as any).instructorId, JSON.stringify((scope as any).batchIds || [])]);

  const now = new Date();
  const upcoming = useMemo(
    () => classes.filter((c) => addMinutes(new Date(c.scheduled_at), c.duration_minutes || 60) >= now).slice(0, 8),
    [classes]
  );
  const past = useMemo(
    () => classes.filter((c) => addMinutes(new Date(c.scheduled_at), c.duration_minutes || 60) < now).reverse().slice(0, 8),
    [classes]
  );

  const renderRow = (cls: ClassRow, allowJoin: boolean) => {
    const live = allowJoin && isClassLive(cls.scheduled_at, cls.duration_minutes);
    const isOnline = (cls.class_type || "online") === "online";
    return (
      <div key={cls.id} className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-brand-cream transition-all duration-200 border ${live ? "border-green-200 bg-green-50/30" : "border-transparent hover:border-brand-gold/30"}`}>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${isOnline ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-brand-charcoal truncate">{cls.title}</p>
          <p className="text-[10px] sm:text-xs text-brand-warm-grey truncate">
            {cls.facultyName} · {cls.batchName}
          </p>
          <p className="text-[10px] text-brand-warm-grey">
            {format(new Date(cls.scheduled_at), "MMM dd, h:mm a")} · {cls.duration_minutes ?? 60} min
          </p>
        </div>
        {allowJoin && isOnline && (
          <div className="shrink-0">
            {live ? (
              <a href={cls.meeting_link || "#"} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg px-3">
                  Join →
                </Button>
              </a>
            ) : (
              <Button size="sm" disabled className="h-7 text-[10px] rounded-lg px-3" title="Available 10 min before start">
                Join
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderList = (rows: ClassRow[], allowJoin: boolean, emptyMsg: string) => {
    if (loading) {
      return <div className="space-y-3 pt-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;
    }
    if (rows.length === 0) {
      return (
        <div className="py-6 sm:py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto flex items-center justify-center mb-3">
            <Video className="w-6 h-6 text-brand-gold" />
          </div>
          <p className="font-serif text-brand-charcoal-mid text-sm">{emptyMsg}</p>
        </div>
      );
    }
    return <div className="space-y-2 pt-2">{rows.map((c) => renderRow(c, allowJoin))}</div>;
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
      <div className="bg-gradient-to-r from-brand-primary/5 to-brand-gold/5 px-3 sm:px-5 pt-3 sm:pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
              <Video className="w-4 h-4 text-brand-primary" />
            </div>
            <h3 className="font-serif text-base sm:text-lg font-semibold text-brand-primary">{title}</h3>
          </div>
          <Link to={seeAllLink} className="text-xs text-brand-gold hover:text-brand-primary font-semibold flex items-center gap-1">
            See All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      <div className="px-3 sm:px-5 pb-3 sm:pb-5">
        <Tabs defaultValue="upcoming">
          <TabsList className="bg-brand-cream-dark rounded-lg p-1 h-auto">
            <TabsTrigger value="upcoming" className="rounded-md data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-xs px-3 py-1.5">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="rounded-md data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-xs px-3 py-1.5">
              Past ({past.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-2">
            {renderList(upcoming, true, "No upcoming live classes")}
          </TabsContent>
          <TabsContent value="past" className="mt-2">
            {renderList(past, false, "No past live classes")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LiveClassesBlock;
