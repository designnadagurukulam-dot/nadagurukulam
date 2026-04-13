import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, FileText, Upload, ExternalLink, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import { logActivity } from "@/lib/activityLogger";

const DashboardAssignments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitDialog, setSubmitDialog] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: assignmentsData = [], isLoading } = useQuery({
    queryKey: ["student-assignments", user?.id],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from("enrollments").select("course_id").eq("user_id", user!.id);
      if (!enrollments?.length) return [];

      const courseIds = enrollments.map((e) => e.course_id);
      const { data: assignments, error } = await supabase
        .from("assignments")
        .select("*, courses(title)")
        .in("course_id", courseIds)
        .order("due_date", { ascending: true });
      if (error) throw error;

      const assignmentIds = (assignments || []).map((a) => a.id);
      const { data: submissions } = assignmentIds.length > 0
        ? await supabase.from("assignment_submissions").select("*").eq("student_id", user!.id).in("assignment_id", assignmentIds)
        : { data: [] };

      return (assignments || []).map((a: any) => {
        const sub = (submissions || []).find((s) => s.assignment_id === a.id);
        let status = "pending";
        if (sub) status = sub.status;
        else if (a.due_date && isPast(new Date(a.due_date))) status = "overdue";
        return { ...a, submission: sub || null, status };
      });
    },
    enabled: !!user,
  });

  const pending = assignmentsData.filter((a: any) => a.status === "pending" || a.status === "overdue");
  const submitted = assignmentsData.filter((a: any) => a.status === "submitted");
  const graded = assignmentsData.filter((a: any) => a.status === "graded");

  const submitMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      let file_url = null;
      if (file) {
        const filePath = `submissions/${user!.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("assignment-files").upload(filePath, file);
        if (uploadError) throw uploadError;
        file_url = filePath;
      }
      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId, student_id: user!.id, file_url, text_content: textContent || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ["student-assignments"] });
      logActivity("assignment.submitted", "assignment", assignmentId);
      setSubmitDialog(null); setTextContent(""); setFile(null);
      toast.success("Assignment submitted!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const downloadFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("assignment-files").createSignedUrl(path, 3600);
    if (error) { toast.error("Failed to get download link"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const getDueBadgeColor = (dueDate: string | null, status: string) => {
    if (status !== "pending" && status !== "overdue") return "bg-muted text-muted-foreground";
    if (!dueDate) return "bg-muted text-muted-foreground";
    const diffDays = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return "bg-red-50 text-red-700";
    if (diffDays < 2) return "bg-amber-50 text-amber-700";
    return "bg-green-50 text-green-700";
  };

  const renderAssignment = (a: any) => (
    <Card key={a.id} className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-brand-charcoal-mid text-sm">{a.title}</h3>
            <p className="text-xs text-brand-warm-grey mt-0.5">{a.courses?.title}</p>
            {a.description && <p className="text-xs text-brand-warm-grey mt-1 line-clamp-2">{a.description}</p>}

            <div className="flex gap-2 mt-2 flex-wrap">
              {a.pdf_url && (
                <Button variant="ghost" size="sm" onClick={() => downloadFile(a.pdf_url)} className="h-7 gap-1 text-xs text-brand-primary hover:bg-brand-gold-pale">
                  <FileText className="h-3 w-3" /> PDF
                </Button>
              )}
              {a.video_url && (
                <a href={a.video_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-brand-primary hover:bg-brand-gold-pale">
                    <Video className="h-3 w-3" /> Video
                  </Button>
                </a>
              )}
              {a.external_link && (
                <a href={a.external_link} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-brand-primary hover:bg-brand-gold-pale">
                    <ExternalLink className="h-3 w-3" /> Link
                  </Button>
                </a>
              )}
            </div>

            {a.submission?.status === "graded" && (
              <div className="mt-3 p-3 bg-green-50 rounded-xl text-xs">
                <span className="font-medium text-green-700">Grade: {a.submission.grade}</span>
                {a.submission.feedback && <p className="text-green-600 mt-1">{a.submission.feedback}</p>}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {a.due_date && (
              <Badge className={`${getDueBadgeColor(a.due_date, a.status)} border-0 text-xs`}>
                {a.status === "overdue" ? "Overdue" : `Due ${format(new Date(a.due_date), "MMM dd")}`}
              </Badge>
            )}
            {!a.submission && (
              <Button size="sm" onClick={() => setSubmitDialog(a.id)} className="gap-1 text-xs bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl">
                <Upload className="h-3 w-3" /> Submit
              </Button>
            )}
            {a.status === "submitted" && <Badge className="bg-amber-50 text-amber-700 border-0 text-xs">Awaiting Grade</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmpty = (msg: string) => (
    <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
      <CardContent className="py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-gold-pale flex items-center justify-center mx-auto mb-3">
          <ClipboardList className="h-6 w-6 text-brand-gold" />
        </div>
        <p className="font-serif text-brand-primary font-semibold">{msg}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-semibold text-brand-primary">Assignments</h1>
        <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        <p className="text-brand-warm-grey mt-2 text-sm">View and submit your assignments</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList className="bg-brand-cream-dark rounded-xl p-1">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="submitted" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">Submitted ({submitted.length})</TabsTrigger>
            <TabsTrigger value="graded" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">Graded ({graded.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4 space-y-3">
            {pending.length === 0 ? renderEmpty("No pending assignments. You're all caught up!") : pending.map(renderAssignment)}
          </TabsContent>
          <TabsContent value="submitted" className="mt-4 space-y-3">
            {submitted.length === 0 ? renderEmpty("No submitted assignments waiting for grading.") : submitted.map(renderAssignment)}
          </TabsContent>
          <TabsContent value="graded" className="mt-4 space-y-3">
            {graded.length === 0 ? renderEmpty("No graded assignments yet.") : graded.map(renderAssignment)}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!submitDialog} onOpenChange={() => setSubmitDialog(null)}>
        <DialogContent className="max-w-md rounded-2xl border-brand-parchment">
          <DialogHeader><DialogTitle className="font-serif text-brand-primary">Submit Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Upload File</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 border-brand-parchment rounded-xl focus:border-brand-gold focus:ring-brand-gold/20" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Text Response (optional)</Label>
              <Textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Your response..." rows={4} className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20" />
            </div>
            <Button
              onClick={() => submitDialog && submitMutation.mutate(submitDialog)}
              disabled={(!file && !textContent) || submitMutation.isPending}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl"
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
