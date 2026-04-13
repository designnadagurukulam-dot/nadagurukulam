import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Plus, FileText, Download, MessageSquare, Video, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { logActivity } from "@/lib/activityLogger";

const InstructorAssignments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", courseId: "", batchId: "", dueDate: "", videoUrl: "", externalLink: "" });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<{ id: string; grade: string; feedback: string } | null>(null);

  const { data: courses = [] } = useQuery({
    queryKey: ["instructor-courses", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, title").eq("instructor_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["tutor-batches", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("batches").select("id, name").eq("instructor_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["instructor-assignments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, courses(title), batches(name)")
        .eq("instructor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["assignment-submissions", selectedAssignment],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("assignment_id", selectedAssignment!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;

      const studentIds = [...new Set((data || []).map((s) => s.student_id))];
      const { data: profiles } = studentIds.length > 0
        ? await supabase.from("profiles").select("user_id, display_name").in("user_id", studentIds)
        : { data: [] };
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.display_name]));

      return (data || []).map((sub) => ({
        ...sub,
        student_name: profileMap[sub.student_id] || "Student",
      }));
    },
    enabled: !!selectedAssignment,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let pdf_url = null;
      if (pdfFile) {
        const filePath = `assignments/${user!.id}/${Date.now()}_${pdfFile.name}`;
        const { error: uploadError } = await supabase.storage.from("assignment-files").upload(filePath, pdfFile);
        if (uploadError) throw uploadError;
        pdf_url = filePath;
      }
      const { error } = await supabase.from("assignments").insert({
        title: form.title,
        description: form.description,
        course_id: form.courseId,
        instructor_id: user!.id,
        batch_id: form.batchId || null,
        pdf_url,
        video_url: form.videoUrl || null,
        external_link: form.externalLink || null,
        due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-assignments"] });
      logActivity("assignment.created", "assignment");
      setCreateOpen(false);
      setForm({ title: "", description: "", courseId: "", batchId: "", dueDate: "", videoUrl: "", externalLink: "" });
      setPdfFile(null);
      toast.success("Assignment created!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ id, grade, feedback }: { id: string; grade: string; feedback: string }) => {
      const { error } = await supabase.from("assignment_submissions").update({ grade, feedback, status: "graded" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions"] });
      logActivity("assignment.graded", "assignment_submission", vars.id);
      setFeedbackDialog(null);
      toast.success("Grade saved!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const downloadFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("assignment-files").createSignedUrl(path, 3600);
    if (error) { toast.error("Failed to get download link"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const updateField = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create and manage assignments</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Assignment</Button>
      </motion.div>

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">My Assignments ({assignments.length})</TabsTrigger>
          <TabsTrigger value="submissions">Submissions {selectedAssignment ? `(${submissions.length})` : ""}</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : assignments.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No assignments yet. Create your first one!</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {assignments.map((a: any) => (
                <Card key={a.id} className={`cursor-pointer hover:shadow-md transition-all ${selectedAssignment === a.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedAssignment(selectedAssignment === a.id ? null : a.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10"><ClipboardList className="h-5 w-5 text-primary" /></div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {a.courses?.title}{a.batches?.name ? ` • ${a.batches.name}` : ""}
                            {a.due_date && ` • Due: ${format(new Date(a.due_date), "MMM dd, yyyy")}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.pdf_url && <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); downloadFile(a.pdf_url); }}><FileText className="h-4 w-4" /></Button>}
                        {a.video_url && <Badge variant="outline" className="text-xs gap-1"><Video className="h-3 w-3" /> Video</Badge>}
                        {a.external_link && <Badge variant="outline" className="text-xs gap-1"><ExternalLink className="h-3 w-3" /> Link</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          {!selectedAssignment ? (
            <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Select an assignment from the "My Assignments" tab to view submissions.</p></CardContent></Card>
          ) : submissions.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No submissions yet for this assignment.</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub: any) => (
                <Card key={sub.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{sub.student_name}</p>
                      <p className="text-xs text-muted-foreground">Submitted: {format(new Date(sub.submitted_at), "MMM dd, yyyy HH:mm")}</p>
                      {sub.text_content && <p className="text-xs mt-1 text-muted-foreground line-clamp-2">{sub.text_content}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sub.status === "graded" ? "default" : "secondary"} className="text-xs">
                        {sub.status === "graded" ? `Grade: ${sub.grade}` : "Pending"}
                      </Badge>
                      {sub.file_url && <Button variant="ghost" size="sm" onClick={() => downloadFile(sub.file_url)}><Download className="h-4 w-4" /></Button>}
                      <Button variant="outline" size="sm" onClick={() => setFeedbackDialog({ id: sub.id, grade: sub.grade || "", feedback: sub.feedback || "" })}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Assignment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div><Label className="text-xs uppercase tracking-widest">Title</Label><Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Assignment title" className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs uppercase tracking-widest">Description / Instructions</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Detailed instructions..." rows={4} className="mt-1 rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-widest">Course</Label>
                <Select value={form.courseId} onValueChange={(v) => updateField("courseId", v)}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest">Batch (optional)</Label>
                <Select value={form.batchId} onValueChange={(v) => updateField("batchId", v)}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs uppercase tracking-widest">Due Date</Label><Input type="datetime-local" value={form.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs uppercase tracking-widest">PDF Upload (optional)</Label><Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="mt-1" /></div>
            <div><Label className="text-xs uppercase tracking-widest">Video URL (optional)</Label><Input value={form.videoUrl} onChange={(e) => updateField("videoUrl", e.target.value)} placeholder="YouTube link" className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs uppercase tracking-widest">External Link (optional)</Label><Input value={form.externalLink} onChange={(e) => updateField("externalLink", e.target.value)} placeholder="Any reference URL" className="mt-1 rounded-xl" /></div>
            <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.courseId || createMutation.isPending} className="w-full">
              {createMutation.isPending ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={!!feedbackDialog} onOpenChange={() => setFeedbackDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Grade & Feedback</DialogTitle></DialogHeader>
          {feedbackDialog && (
            <div className="space-y-4">
              <div><Label>Grade</Label><Input value={feedbackDialog.grade} onChange={(e) => setFeedbackDialog({ ...feedbackDialog, grade: e.target.value })} placeholder="e.g. A+, 95%" className="rounded-xl" /></div>
              <div><Label>Feedback</Label><Textarea value={feedbackDialog.feedback} onChange={(e) => setFeedbackDialog({ ...feedbackDialog, feedback: e.target.value })} placeholder="Your feedback..." className="rounded-xl" /></div>
              <Button onClick={() => gradeMutation.mutate(feedbackDialog)} disabled={gradeMutation.isPending} className="w-full">
                {gradeMutation.isPending ? "Saving..." : "Save Grade"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorAssignments;
