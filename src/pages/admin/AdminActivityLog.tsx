import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const PAGE_SIZE = 25;

const actionColors: Record<string, string> = {
  login: "bg-green-50 text-green-700 border border-green-200",
  logout: "bg-gray-50 text-gray-500 border border-gray-200",
  signup: "bg-blue-50 text-blue-700 border border-blue-200",
  "course.created": "bg-[#F5E9CE] text-[#7D1E24] border border-[#EDE3CC]",
  "course.updated": "bg-[#F5E9CE] text-[#7D1E24] border border-[#EDE3CC]",
  "course.approved": "bg-green-50 text-green-700 border border-green-200",
  "course.rejected": "bg-red-50 text-red-600 border border-red-200",
  "course.deleted": "bg-red-50 text-red-600 border border-red-200",
  "course.submitted": "bg-amber-50 text-amber-700 border border-amber-200",
  "assignment.created": "bg-blue-50 text-blue-700 border border-blue-200",
  "assignment.graded": "bg-green-50 text-green-700 border border-green-200",
  "assignment.submitted": "bg-blue-50 text-blue-700 border border-blue-200",
  "assignment.deleted": "bg-red-50 text-red-600 border border-red-200",
  "enrollment.created": "bg-blue-50 text-blue-700 border border-blue-200",
  "lesson.completed": "bg-green-50 text-green-700 border border-green-200",
  "profile.updated": "bg-gray-50 text-gray-500 border border-gray-200",
  "role.changed": "bg-amber-50 text-amber-700 border border-amber-200",
  "coupon.created": "bg-blue-50 text-blue-700 border border-blue-200",
  "coupon.deleted": "bg-red-50 text-red-600 border border-red-200",
  "coupon.toggled": "bg-amber-50 text-amber-700 border border-amber-200",
  "job.created": "bg-blue-50 text-blue-700 border border-blue-200",
  "job.updated": "bg-[#F5E9CE] text-[#7D1E24] border border-[#EDE3CC]",
  "job.deleted": "bg-red-50 text-red-600 border border-red-200",
  "job.toggled": "bg-amber-50 text-amber-700 border border-amber-200",
  "event.created": "bg-blue-50 text-blue-700 border border-blue-200",
  "event.updated": "bg-[#F5E9CE] text-[#7D1E24] border border-[#EDE3CC]",
  "event.deleted": "bg-red-50 text-red-600 border border-red-200",
  "category.created": "bg-blue-50 text-blue-700 border border-blue-200",
  "category.updated": "bg-[#F5E9CE] text-[#7D1E24] border border-[#EDE3CC]",
  "category.deleted": "bg-red-50 text-red-600 border border-red-200",
  "volunteer.submitted": "bg-blue-50 text-blue-700 border border-blue-200",
  "volunteer.status_updated": "bg-amber-50 text-amber-700 border border-amber-200",
  "inquiry.submitted": "bg-blue-50 text-blue-700 border border-blue-200",
  "inquiry.status_updated": "bg-amber-50 text-amber-700 border border-amber-200",
  "inquiry.deleted": "bg-red-50 text-red-600 border border-red-200",
  "students.exported": "bg-gray-50 text-gray-500 border border-gray-200",
  "curriculum.section_added": "bg-blue-50 text-blue-700 border border-blue-200",
  "curriculum.section_deleted": "bg-red-50 text-red-600 border border-red-200",
  "schedule.created": "bg-blue-50 text-blue-700 border border-blue-200",
  "schedule.deleted": "bg-red-50 text-red-600 border border-red-200",
  "class_log.created": "bg-blue-50 text-blue-700 border border-blue-200",
  "class_log.confirmed": "bg-green-50 text-green-700 border border-green-200",
  "project.created": "bg-blue-50 text-blue-700 border border-blue-200",
  "project.deleted": "bg-red-50 text-red-600 border border-red-200",
  "certificate.uploaded": "bg-green-50 text-green-700 border border-green-200",
  "allocation.created": "bg-blue-50 text-blue-700 border border-blue-200",
  "allocation.deleted": "bg-red-50 text-red-600 border border-red-200",
};

const AdminActivityLog = () => {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["activity-logs", page, actionFilter, search],
    queryFn: async () => {
      let query = (supabase.from("activity_logs" as any) as any)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (search.trim()) query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
      const { data: logs, count, error } = await query;
      if (error) throw error;
      const userIds = (logs || []).map((l: any) => String(l.user_id)).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
        (profiles || []).forEach((p) => { profileMap[p.user_id] = p.display_name || "Unknown"; });
      }
      return { logs: (logs || []).map((l: any) => ({ ...l, display_name: profileMap[l.user_id] || "Unknown" })), total: count || 0 };
    },
  });

  const { data: actionTypes = [] } = useQuery({
    queryKey: ["activity-log-actions"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("activity_logs" as any) as any).select("action").limit(1000);
      if (error) return [];
      const actions = (data || []).map((d: any) => d.action as string);
      return [...new Set(actions)];
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6 pt-2">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F5E9CE] flex items-center justify-center">
            <Activity className="h-5 w-5 text-[#7D1E24]" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">Activity Log</h1>
            <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
          </div>
        </div>
        <p className="text-sm text-[#8C7B6B] mt-2">Track all platform activity in real-time</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C7B6B]" />
          <Input placeholder="Search actions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9 border-[#EDE3CC] rounded-xl focus:border-[#C49A3C]" />
        </div>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48 border-[#EDE3CC] rounded-xl"><SelectValue placeholder="All actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {(actionTypes as string[]).sort().map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-[#7D1E24] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.logs?.length ? (
        <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5E9CE] flex items-center justify-center mx-auto mb-4">
            <Activity className="h-7 w-7 text-[#C49A3C]" />
          </div>
          <h3 className="font-serif text-xl text-[#7D1E24]">No Activity Logs</h3>
          <p className="text-sm text-[#8C7B6B] mt-1">Activity will appear here as users interact with the platform</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#5C1219] hover:bg-[#5C1219]">
                  <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Time</TableHead>
                  <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">User</TableHead>
                  <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Action</TableHead>
                  <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Entity</TableHead>
                  <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.logs.map((log: any, i: number) => (
                  <TableRow key={log.id} className={`${i % 2 === 1 ? "bg-[#FAF6EE]" : "bg-white"} hover:bg-[#FAF6EE] transition-colors border-b border-[#EDE3CC]`}>
                    <TableCell className="text-xs text-[#8C7B6B] whitespace-nowrap">{format(new Date(log.created_at), "MMM dd, HH:mm:ss")}</TableCell>
                    <TableCell className="font-medium text-sm text-[#3D2E22]">{log.display_name}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${actionColors[log.action] || "bg-gray-50 text-gray-500 border border-gray-200"}`}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#8C7B6B]">{log.entity_type || "—"}</TableCell>
                    <TableCell className="text-xs text-[#8C7B6B] max-w-[200px] truncate">{log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-[#8C7B6B]">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.total)} of {data.total}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="border-[#EDE3CC] rounded-xl hover:bg-[#FAF6EE]">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="border-[#EDE3CC] rounded-xl hover:bg-[#FAF6EE]">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminActivityLog;
