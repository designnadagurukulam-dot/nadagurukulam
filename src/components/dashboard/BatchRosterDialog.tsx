import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  batchId: string | null;
  batchName: string;
}

interface Row {
  user_id: string;
  display_name: string | null;
  enrollment_id: string | null;
  course_name: string | null;
  semester: number | null;
}

const BatchRosterDialog = ({ open, onOpenChange, batchId, batchName }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !batchId) return;
    setLoading(true);
    (async () => {
      const { data: batch } = await supabase.from("batches").select("semester").eq("id", batchId).maybeSingle();
      const { data: enrolls } = await supabase
        .from("batch_enrollments")
        .select("student_id")
        .eq("batch_id", batchId);
      const ids = (enrolls || []).map((e: any) => e.student_id);
      if (ids.length === 0) { setRows([]); setLoading(false); return; }
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, enrollment_id, course_name")
        .in("user_id", ids);
      setRows((profs || []).map((p: any) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        enrollment_id: p.enrollment_id,
        course_name: p.course_name,
        semester: batch?.semester ?? null,
      })));
      setLoading(false);
    })();
  }, [open, batchId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-brand-primary">{batchName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-brand-warm-grey py-6 text-center">No students in this batch.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Registered No.</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Program</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.user_id}>
                  <TableCell className="font-medium">{r.display_name || "—"}</TableCell>
                  <TableCell>{r.enrollment_id || "—"}</TableCell>
                  <TableCell>{r.semester ?? "—"}</TableCell>
                  <TableCell>{r.course_name || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BatchRosterDialog;
