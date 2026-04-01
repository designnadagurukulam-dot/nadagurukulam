import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Plus, FileText, Download, Calendar, Users, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<{ id: string; grade: string; feedback: string } | null>(null);

  // Fetch instructor's courses
  const { data: courses } = useQuery({
    queryKey: ["instructor-courses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("instructor_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch assignments for instructor's courses
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["instructor-assignments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, courses(title)")
        .eq("instructor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch submissions for selected assignment
  const { data: submissions } = useQuery({
    queryKey: ["assignment-submissions", selectedAssignment],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("assignment_id", selectedAssignment!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;

      // Fetch student profiles
      const studentIds = [...new Set(data.map((s) => s.student_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", studentIds);

      return data.map((sub) => ({
        ...sub,
        student_name: profiles?.find((p) => p.user_id === sub.student_id)?.display_name || "Unknown",
      }));
    },
    enabled: !!selectedAssignment,
  });

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      let pdf_url = null;
      if (pdfFile) {
        const filePath = `assignments/${user!.id}/${Date.now()}_${pdfFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(filePath, pdfFile);
        if (uploadError) throw uploadError;
        pdf_url = filePath;
      }

      const { error } = await supabase.from("assignments").insert({
        title,
        description,
        course_id: courseId,
        instructor_id: user!.id,
        pdf_url,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-assignments"] });
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setCourseId("");
      setDueDate("");
      setPdfFile(null);
      toast.success("Assignment created successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Grade/feedback mutation
  const gradeMutation = useMutation({
    mutationFn: async ({ id, grade, feedback }: { id: string; grade: string; feedback: string }) => {
      const { error } = await supabase
        .from("assignment_submissions")
        .update({ grade, feedback, status: "graded" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions"] });
      setFeedbackDialog(null);
      toast.success("Feedback saved");
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create and manage assignments for your courses</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create Assignment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instructions..." />
              </div>
              <div>
                <Label>Course</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courses?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div>
                <Label>Assignment PDF (optional)</Label>
                <Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!title || !courseId || createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Creating..." : "Create Assignment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : !assignments?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No assignments yet. Create your first one!</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a: any, i: number) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${selectedAssignment === a.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedAssignment(selectedAssignment === a.id ? null : a.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {(a as any).courses?.title}
                          {a.due_date && ` • Due: ${format(new Date(a.due_date), "MMM dd, yyyy")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.pdf_url && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); downloadFile(a.pdf_url); }}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <Badge variant="secondary" className="shrink-0">
                        <Users className="h-3 w-3 mr-1" />
                        View Submissions
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submissions panel */}
              {selectedAssignment === a.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="ml-6 mt-2">
                  <Card className="border-l-4 border-l-primary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" /> Student Submissions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {!submissions?.length ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No submissions yet</p>
                      ) : (
                        submissions.map((sub: any) => (
                          <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div>
                              <p className="text-sm font-medium text-foreground">{sub.student_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Submitted: {format(new Date(sub.submitted_at), "MMM dd, yyyy HH:mm")}
                              </p>
                              {sub.text_content && <p className="text-xs mt-1 text-muted-foreground line-clamp-2">{sub.text_content}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={sub.status === "graded" ? "default" : "secondary"} className="text-xs">
                                {sub.status === "graded" ? `Grade: ${sub.grade}` : sub.status}
                              </Badge>
                              {sub.file_url && (
                                <Button variant="ghost" size="sm" onClick={() => downloadFile(sub.file_url)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFeedbackDialog({ id: sub.id, grade: sub.grade || "", feedback: sub.feedback || "" })}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Grade/Feedback Dialog */}
      <Dialog open={!!feedbackDialog} onOpenChange={() => setFeedbackDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Grade & Feedback</DialogTitle></DialogHeader>
          {feedbackDialog && (
            <div className="space-y-4">
              <div>
                <Label>Grade</Label>
                <Input value={feedbackDialog.grade} onChange={(e) => setFeedbackDialog({ ...feedbackDialog, grade: e.target.value })} placeholder="e.g. A+, 95%" />
              </div>
              <div>
                <Label>Feedback</Label>
                <Textarea value={feedbackDialog.feedback} onChange={(e) => setFeedbackDialog({ ...feedbackDialog, feedback: e.target.value })} placeholder="Your feedback..." />
              </div>
              <Button
                onClick={() => gradeMutation.mutate(feedbackDialog)}
                disabled={gradeMutation.isPending}
                className="w-full"
              >
                {gradeMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorAssignments;
