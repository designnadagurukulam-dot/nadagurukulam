import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ClassRow {
  id: string;
  title: string;
  class_type: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: ClassRow[];
}

const TodayClassesDialog = ({ open, onOpenChange, classes }: Props) => {
  // sort: offline first then online; then by time
  const sorted = [...classes].sort((a, b) => {
    const ao = a.class_type === "offline" ? 0 : 1;
    const bo = b.class_type === "offline" ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-brand-primary">Today's Classes</DialogTitle>
        </DialogHeader>
        {sorted.length === 0 ? (
          <p className="text-sm text-brand-warm-grey py-6 text-center">No classes scheduled for today.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>
                    <Badge variant={c.class_type === "offline" ? "secondary" : "default"} className="capitalize">
                      {c.class_type || "online"}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(c.scheduled_at), "h:mm a")}</TableCell>
                  <TableCell>{c.duration_minutes ?? 60} min</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TodayClassesDialog;
