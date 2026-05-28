import { useEffect, useMemo, useState } from "react";
import { addDays, endOfWeek, format, startOfWeek } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  /** controls editability & data scope */
  role: "student" | "instructor" | "admin" | "super_admin";
  userId: string;
  /** batch ids to filter on for students; ignored for instructors/admins */
  studentBatchIds?: string[];
  /** week anchor (any date within the week) */
  weekStart: Date;
}

interface Row {
  schedule_id: string;
  date: string; // yyyy-mm-dd
  day: string;
  period_label: string | null;
  period_no: number | null;
  time_label: string;
  sort_key: string;
  event_title: string;
  batch_name: string | null;
  semester: number | null;
  instructor_id: string | null;
  instructor_name: string;
  // editable fields (mirror class_logs)
  log_id?: string;
  topic: string;
  L: number;
  Th: number;
  P: number;
  remarks: string;
  dirty?: boolean;
  saving?: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function WeeklyTeachingLogGrid({ role, userId, studentBatchIds = [], weekStart }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [facultyName, setFacultyName] = useState<string>("");

  const weekMon = useMemo(() => startOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
  const weekSun = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);

  const canEdit = role === "instructor";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      // 1. schedules in week (role-filtered)
      let q = supabase
        .from("schedules")
        .select("id, event_title, start_time, end_time, instructor_id, batch_id, curriculum_module_id, period_id, user_id")
        .gte("start_time", weekMon.toISOString())
        .lte("start_time", weekSun.toISOString())
        .order("start_time", { ascending: true });

      if (role === "instructor") {
        q = q.eq("instructor_id", userId);
      } else if (role === "student") {
        if (studentBatchIds.length === 0) {
          if (!cancelled) { setRows([]); setLoading(false); }
          return;
        }
        q = q.in("batch_id", studentBatchIds);
      }

      const { data: scheds } = await q;
      const schedules = scheds || [];

      const periodIds = [...new Set(schedules.map((s: any) => s.period_id).filter(Boolean))];
      const instructorIds = [...new Set(schedules.map((s: any) => s.instructor_id).filter(Boolean))];
      const batchIds = [...new Set(schedules.map((s: any) => s.batch_id).filter(Boolean))];
      const scheduleIds = schedules.map((s: any) => s.id);

      const [periodsRes, profsRes, batchesRes, logsRes] = await Promise.all([
        periodIds.length
          ? supabase.from("periods").select("id, period_number, label, start_time, end_time").in("id", periodIds as string[])
          : Promise.resolve({ data: [] as any[] }),
        instructorIds.length
          ? supabase.from("profiles").select("user_id, display_name").in("user_id", instructorIds as string[])
          : Promise.resolve({ data: [] as any[] }),
        batchIds.length
          ? supabase.from("batches").select("id, name, semester").in("id", batchIds as string[])
          : Promise.resolve({ data: [] as any[] }),
        scheduleIds.length
          ? supabase.from("class_logs").select("id, schedule_id, topic_covered, lecture_count, theory_count, practical_count, remarks").in("schedule_id", scheduleIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const periodMap: Record<string, any> = {};
      (periodsRes.data || []).forEach((p: any) => { periodMap[p.id] = p; });
      const profMap: Record<string, string> = {};
      (profsRes.data || []).forEach((p: any) => { profMap[p.user_id] = p.display_name || "Faculty"; });
      const batchMap: Record<string, any> = {};
      (batchesRes.data || []).forEach((b: any) => { batchMap[b.id] = b; });
      const logMap: Record<string, any> = {};
      (logsRes.data || []).forEach((l: any) => { logMap[l.schedule_id] = l; });

      // current user display name for faculty header
      if (role === "instructor") {
        const me = (profsRes.data || []).find((p: any) => p.user_id === userId);
        if (me) setFacultyName(me.display_name || "Faculty");
        else {
          const { data: meProf } = await supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
          setFacultyName(meProf?.display_name || "Faculty");
        }
      } else {
        setFacultyName("");
      }

      const fmt12 = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        const hr = ((h + 11) % 12) + 1;
        const ampm = h < 12 ? "am" : "pm";
        return `${String(hr).padStart(2, "0")}:${String(m).padStart(2, "0")}${ampm}`;
      };

      const built: Row[] = schedules.map((s: any) => {
        const start = new Date(s.start_time);
        const end = new Date(s.end_time);
        const p = s.period_id ? periodMap[s.period_id] : null;
        const timeLabel = p
          ? `${fmt12(p.start_time)} to ${fmt12(p.end_time)}`
          : `${start.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })} to ${end.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}`;
        const batch = s.batch_id ? batchMap[s.batch_id] : null;
        const log = logMap[s.id] || {};
        const periodNo = p?.period_number ?? null;
        return {
          schedule_id: s.id,
          date: format(start, "yyyy-MM-dd"),
          day: DAY_NAMES[start.getDay()],
          period_label: p?.label ?? null,
          period_no: periodNo,
          time_label: timeLabel,
          sort_key: `${format(start, "yyyy-MM-dd")}-${periodNo ?? 99}-${start.getTime()}`,
          event_title: s.event_title,
          batch_name: batch?.name ?? null,
          semester: batch?.semester ?? null,
          instructor_id: s.instructor_id,
          instructor_name: s.instructor_id ? (profMap[s.instructor_id] || "Faculty") : "—",
          log_id: log.id,
          topic: log.topic_covered || "",
          L: log.lecture_count ?? 0,
          Th: log.theory_count ?? 0,
          P: log.practical_count ?? 0,
          remarks: log.remarks || "",
        };
      });
      built.sort((a, b) => a.sort_key.localeCompare(b.sort_key));

      if (!cancelled) {
        setRows(built);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, role, weekMon.getTime(), weekSun.getTime(), studentBatchIds.join(",")]);

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch, dirty: true } : r));
  };

  const saveRow = async (idx: number) => {
    const r = rows[idx];
    if (!canEdit) return;
    setRows((prev) => prev.map((x, i) => i === idx ? { ...x, saving: true } : x));
    try {
      if (r.log_id) {
        const { error } = await supabase.from("class_logs").update({
          topic_covered: r.topic,
          lecture_count: r.L,
          theory_count: r.Th,
          practical_count: r.P,
          remarks: r.remarks,
        }).eq("id", r.log_id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("class_logs").insert({
          schedule_id: r.schedule_id,
          instructor_id: userId,
          date: r.date,
          topic_covered: r.topic || "(no topic)",
          lecture_count: r.L,
          theory_count: r.Th,
          practical_count: r.P,
          remarks: r.remarks,
        }).select("id").maybeSingle();
        if (error) throw error;
        setRows((prev) => prev.map((x, i) => i === idx ? { ...x, log_id: data?.id } : x));
      }
      setRows((prev) => prev.map((x, i) => i === idx ? { ...x, dirty: false, saving: false } : x));
      toast({ title: "Saved", description: `Row ${idx + 1} updated.` });
    } catch (e: any) {
      setRows((prev) => prev.map((x, i) => i === idx ? { ...x, saving: false } : x));
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const totals = useMemo(
    () => rows.reduce((acc, r) => ({ L: acc.L + (r.L || 0), Th: acc.Th + (r.Th || 0), P: acc.P + (r.P || 0) }), { L: 0, Th: 0, P: 0 }),
    [rows]
  );

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-primary" /></div>;
  }

  return (
    <div className="rounded-2xl bg-white border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
      {/* Header band like Excel */}
      <div className="bg-brand-gold-pale/40 border-b border-brand-parchment px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-brand-primary" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-brand-warm-grey">
              {role === "instructor" ? "Name of Faculty" : role === "student" ? "Weekly Schedule" : "Teaching Log"}
            </p>
            <p className="font-serif text-lg font-semibold text-brand-primary leading-tight">
              {facultyName || `${format(weekMon, "MMM d")} – ${format(weekSun, "MMM d, yyyy")}`}
            </p>
            {facultyName && (
              <p className="text-xs text-brand-warm-grey">{format(weekMon, "MMM d")} – {format(weekSun, "MMM d, yyyy")}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-brand-warm-grey">Total</span>
          <Badge label="L" value={totals.L} />
          <Badge label="Th" value={totals.Th} />
          <Badge label="P" value={totals.P} />
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-1.5 text-[11px] text-brand-warm-grey border-b border-brand-parchment/60 bg-brand-cream/40">
        Legend: <span className="font-semibold">L</span> = Lecture · <span className="font-semibold">Th</span> = Theory · <span className="font-semibold">P</span> = Practical
      </div>

      {rows.length === 0 ? (
        <div className="text-center p-10">
          <p className="font-serif text-base text-brand-primary">No scheduled classes this week.</p>
          <p className="text-xs text-brand-warm-grey mt-1">Use the navigator above to change weeks.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="bg-brand-primary/[0.04] text-brand-primary border-b border-brand-parchment">
              <tr className="text-left">
                <Th>S.No.</Th>
                <Th>Date</Th>
                <Th>Day</Th>
                <Th>Time</Th>
                <Th>Period No.</Th>
                <Th className="min-w-[240px]">Topic</Th>
                <Th className="text-center w-14">L</Th>
                <Th className="text-center w-14">Th</Th>
                <Th className="text-center w-14">P</Th>
                <Th className="min-w-[180px]">Remarks</Th>
                {canEdit && <Th className="w-24 text-center">Action</Th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.schedule_id} className="border-b border-brand-parchment/50 hover:bg-brand-cream/30">
                  <Td>{i + 1}</Td>
                  <Td className="whitespace-nowrap">{format(new Date(r.date), "dd-MM-yyyy")}</Td>
                  <Td>{r.day}</Td>
                  <Td className="whitespace-nowrap text-xs">{r.time_label}</Td>
                  <Td className="text-xs">
                    {r.period_label ? (
                      <span>
                        {r.period_label}
                        {r.semester != null && <span className="text-brand-warm-grey"> (Sem {r.semester})</span>}
                      </span>
                    ) : (
                      <span className="text-brand-warm-grey italic">—</span>
                    )}
                  </Td>
                  <Td>
                    {canEdit ? (
                      <Input
                        value={r.topic}
                        onChange={(e) => updateRow(i, { topic: e.target.value })}
                        placeholder={r.event_title}
                        className="h-8 text-xs"
                      />
                    ) : (
                      <span className="text-xs">{r.topic || <span className="italic text-brand-warm-grey">{r.event_title}</span>}</span>
                    )}
                  </Td>
                  <Td className="text-center">
                    <NumCell value={r.L} editable={canEdit} onChange={(v) => updateRow(i, { L: v })} />
                  </Td>
                  <Td className="text-center">
                    <NumCell value={r.Th} editable={canEdit} onChange={(v) => updateRow(i, { Th: v })} />
                  </Td>
                  <Td className="text-center">
                    <NumCell value={r.P} editable={canEdit} onChange={(v) => updateRow(i, { P: v })} />
                  </Td>
                  <Td>
                    {canEdit ? (
                      <Input
                        value={r.remarks}
                        onChange={(e) => updateRow(i, { remarks: e.target.value })}
                        placeholder="—"
                        className="h-8 text-xs"
                      />
                    ) : (
                      <span className="text-xs">{r.remarks || <span className="text-brand-warm-grey">—</span>}</span>
                    )}
                  </Td>
                  {canEdit && (
                    <Td className="text-center">
                      <Button
                        size="sm"
                        variant={r.dirty ? "default" : "outline"}
                        disabled={!r.dirty || r.saving}
                        onClick={() => saveRow(i)}
                        className="h-8 px-2 text-xs"
                      >
                        {r.saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Save className="h-3 w-3 mr-1" />Save</>}
                      </Button>
                    </Td>
                  )}
                </tr>
              ))}
              <tr className="bg-brand-gold-pale/30 font-semibold text-brand-primary">
                <Td colSpan={6} className="text-right">Total</Td>
                <Td className="text-center">{totals.L}</Td>
                <Td className="text-center">{totals.Th}</Td>
                <Td className="text-center">{totals.P}</Td>
                <Td colSpan={canEdit ? 2 : 1}></Td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider ${className}`}>{children}</th>
);
const Td = ({ children, className = "", colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) => (
  <td colSpan={colSpan} className={`px-3 py-2 align-middle ${className}`}>{children}</td>
);
const Badge = ({ label, value }: { label: string; value: number }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs border border-brand-parchment">
    <span className="font-semibold text-brand-primary">{label}</span>
    <span className="text-brand-primary">{value}</span>
  </span>
);
const NumCell = ({ value, editable, onChange }: { value: number; editable: boolean; onChange: (v: number) => void }) => (
  editable ? (
    <Input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
      className="h-8 w-14 text-xs text-center px-1"
    />
  ) : (
    <span className="text-xs">{value || "-"}</span>
  )
);
