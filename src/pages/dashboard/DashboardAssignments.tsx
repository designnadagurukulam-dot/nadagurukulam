import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Clock, CheckCircle2, AlertCircle, FileText, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, isPast } from "date-fns";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, bg: "bg-secondary/15 text-secondary-foreground", dot: "bg-secondary" },
  overdue: { label: "Overdue", icon: AlertCircle, bg: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
  submitted: { label: "Submitted", icon: CheckCircle2, bg: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  graded: { label: "Graded", icon: CheckCircle2, bg: "bg-green-100 text-green-700", dot: "bg-green-500" },
  late: { label: "Late", icon: AlertCircle, bg: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
};

const DashboardAssignments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitDialog, setSubmitDialog] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Fetch assignments for enrolled courses
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ["student-assignments", user?.id],
    queryFn: async () => {
      // Get enrolled course ids
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user!.id);

      if (!enrollments?.length) return [];

      const courseIds = enrollments.map((e) => e.course_id);

      const { data: assignments, error } = await supabase
        .from("assignments")
        .select("*, courses(title)")
        .in("course_id", courseIds)
        .order("due_date", { ascending: true });
      if (error) throw error;

      // Get my submissions
      const assignmentIds = assignments.map((a) => a.id);
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("student_id", user!.id)
        .in("assignment_id", assignmentIds);

      return assignments.map((a: any) => {
        const sub = submissions?.find((s) => s.assignment_id === a.id);
        let status = "pending";
        if (sub) {
          status = sub.status;
        } else if (a.due_date && isPast(new Date(a.due_date))) {
          status = "overdue";
        }
        return { ...a, submission: sub || null, status };
      });
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      let file_url = null;
      if (file) {
        const filePath = `submissions/${user!.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        file_url = filePath;
      }

      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId,
        student_id: user!.id,
        file_url,
        text_content: textContent || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-assignments"] });
      setSubmitDialog(null);
      setTextContent("");
      setFile(null);
      toast.success("Assignment submitted!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const downloadFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("assignment-files").createSignedUrl(path, 3600);
    if (error) { toast.error("Failed to get download link"); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl font-bold text-foreground">Assignments</h1>
        <p className="text-muted-foreground mt-1 text-sm">View and submit your assignments</p>
      </motion.div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : !assignmentsData?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No assignments found for your enrolled courses.</CardContent></Card>
      ) : (
        <div className="relative">
          <div className="absolute left-[23px] top-4 bottom-4 w-[2px] hidden md:block" style={{ background: "linear-gradient(180deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.1))" }} />
          <div className="space-y-3">
            {assignmentsData.map((a: any, i: number) => {
              const cfg = statusConfig[a.status as keyof typeof statusConfig] || statusConfig.pending;
              return (
                <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="flex items-start gap-4">
                    <div className="hidden md:flex shrink-0 w-12 items-center justify-center relative z-10">
                      <div className={`w-3 h-3 rounded-full ${cfg.dot} shadow-sm`} />
                    </div>
                    <Card className="flex-1 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                              <ClipboardList className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {a.courses?.title}
                                {a.due_date && ` • Due: ${format(new Date(a.due_date), "MMM dd, yyyy")}`}
                              </p>
                              {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                              {a.submission?.status === "graded" && (
                                <div className="mt-2 text-xs">
                                  <span className="font-medium text-green-700">Grade: {a.submission.grade}</span>
                                  {a.submission.feedback && <p className="text-muted-foreground mt-0.5">{a.submission.feedback}</p>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {a.pdf_url && (
                              <Button variant="ghost" size="sm" onClick={() => downloadFile(a.pdf_url)} title="Download assignment PDF">
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                            <Badge variant="secondary" className={`${cfg.bg} border-0`}>
                              <cfg.icon className="h-3 w-3 mr-1" />
                              {cfg.label}
                            </Badge>
                            {!a.submission && a.status !== "graded" && (
                              <Button size="sm" variant="outline" onClick={() => setSubmitDialog(a.id)} className="gap-1">
                                <Upload className="h-3 w-3" /> Submit
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={!!submitDialog} onOpenChange={() => setSubmitDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Submit Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Upload File (PDF)</Label>
              <Input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Text Response (optional)</Label>
              <Textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Your response..." rows={4} />
            </div>
            <Button
              onClick={() => submitDialog && submitMutation.mutate(submitDialog)}
              disabled={(!file && !textContent) || submitMutation.isPending}
              className="w-full"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardAssignments;
