import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const PAGE_SIZE = 25;

const actionColors: Record<string, string> = {
  login: "bg-green-100 text-green-700",
  logout: "bg-muted text-muted-foreground",
  signup: "bg-blue-100 text-blue-700",
  "course.created": "bg-primary/10 text-primary",
  "course.updated": "bg-primary/10 text-primary",
  "course.approved": "bg-green-100 text-green-700",
  "course.rejected": "bg-destructive/10 text-destructive",
  "assignment.created": "bg-secondary/10 text-secondary-foreground",
  "assignment.graded": "bg-green-100 text-green-700",
  "assignment.submitted": "bg-blue-100 text-blue-700",
  "enrollment.created": "bg-blue-100 text-blue-700",
  "lesson.completed": "bg-green-100 text-green-700",
  "profile.updated": "bg-muted text-muted-foreground",
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

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }
      if (search.trim()) {
        query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
      }

      const { data: logs, count, error } = await query;
      if (error) throw error;

      // Fetch display names for user_ids
      const userIds = [...new Set((logs || []).map((l: any) => l.user_id))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        (profiles || []).forEach((p) => {
          profileMap[p.user_id] = p.display_name || "Unknown";
        });
      }

      return {
        logs: (logs || []).map((l: any) => ({ ...l, display_name: profileMap[l.user_id] || "Unknown" })),
        total: count || 0,
      };
    },
  });

  // Get unique actions for filter
  const { data: actionTypes = [] } = useQuery({
    queryKey: ["activity-log-actions"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("activity_logs" as any) as any)
        .select("action")
        .limit(1000);
      if (error) return [];
      return [...new Set((data || []).map((d: any) => d.action))] as string[];
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <Activity className="h-6 w-6" /> Activity Log
        </h1>
        <p className="text-muted-foreground text-sm">Track all platform activity in real-time</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {(actionTypes as string[]).sort().map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.logs?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No activity logs found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM dd, HH:mm:ss")}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.entity_type || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
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
