import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Plus, FileText, Download, MessageSquare, Video, ExternalLink, Upload, Award } from "lucide-react";
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
    queryFn: async () => { const { data } = await supabase.from("courses").select("id, title").eq("instructor_id", user!.id); return data || []; },
    enabled: !!user,
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["tutor-batches", user?.id],
    queryFn: async () => { const { data } = await supabase.from("batches").select("id, name").eq("instructor_id", user!.id); return data || []; },
    enabled: !!user,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["instructor-assignments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("assignments").select("*, courses(title), batches(name)").eq("instructor_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error; return data || [];
    },
    enabled: !!user,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["assignment-submissions", selectedAssignment],
    queryFn: async () => {
      const { data, error } = await supabase.from("assignment_submissions").select("*").eq("assignment_id", selectedAssignment!).order("submitted_at", { ascending: false });
      if (error) throw error;
      const studentIds = [...new Set((data || []).map((s) => s.student_id))];
      const { data: profiles } = studentIds.length > 0 ? await supabase.from("profiles").select("user_id, display_name").in("user_id", studentIds) : { data: [] };
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.display_name]));
      return (data || []).map((sub) => ({ ...sub, student_name: profileMap[sub.student_id] || "Student" }));
    },
    enabled: !!selectedAssignment,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let pdf_url = null;
      if (pdfFile) { const filePath = `assignments/${user!.id}/${Date.now()}_${pdfFile.name}`; const { error: uploadError } = await supabase.storage.from("assignment-files").upload(filePath, pdfFile); if (uploadError) throw uploadError; pdf_url = filePath; }
      const { error } = await supabase.from("assignments").insert({ title: form.title, description: form.description, course_id: form.courseId, instructor_id: user!.id, batch_id: form.batchId || null, pdf_url, video_url: form.videoUrl || null, external_link: form.externalLink || null, due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["instructor-assignments"] }); logActivity("assignment.created", "assignment"); setCreateOpen(false); setForm({ title: "", description: "", courseId: "", batchId: "", dueDate: "", videoUrl: "", externalLink: "" }); setPdfFile(null); toast.success("Assignment created!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ id, grade, feedback }: { id: string; grade: string; feedback: string }) => { const { error } = await supabase.from("assignment_submissions").update({ grade, feedback, status: "graded" }).eq("id", id); if (error) throw error; },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ["assignment-submissions"] }); logActivity("assignment.graded", "assignment_submission", vars.id); setFeedbackDialog(null); toast.success("Grade saved!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const downloadFile = async (path: string) => { const { data, error } = await supabase.storage.from("assignment-files").createSignedUrl(path, 3600); if (error) { toast.error("Failed to get download link"); return; } window.open(data.signedUrl, "_blank"); };
  const updateField = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-brand-gold" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-brand-primary">Assignments</h1>
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1 ml-10" />
          <p className="text-brand-warm-grey mt-2 text-sm ml-10">Create and manage assignments</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl shadow-lg hover:shadow-xl transition-all"><Plus className="h-4 w-4" /> Create</Button>
      </motion.div>

      <Tabs defaultValue="assignments">
        <TabsList className="bg-brand-cream-dark rounded-xl p-1">
          <TabsTrigger value="assignments" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> My Assignments ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="submissions" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5">
            <Upload className="h-3.5 w-3.5" /> Submissions {selectedAssignment ? `(${submissions.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : assignments.length === 0 ? (
            <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
              <CardContent className="py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-3"><ClipboardList className="h-6 w-6 text-brand-gold" /></div>
                <p className="font-serif text-brand-primary font-semibold">No assignments yet. Create your first one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignments.map((a: any) => {
                const isOverdue = a.due_date && new Date(a.due_date) < new Date();
                return (
                  <Card key={a.id} className={`cursor-pointer bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] hover:shadow-lg transition-all duration-300 border-l-4 ${selectedAssignment === a.id ? "ring-2 ring-brand-primary border-l-brand-primary" : isOverdue ? "border-l-red-400" : "border-l-brand-gold"}`}
                    onClick={() => setSelectedAssignment(selectedAssignment === a.id ? null : a.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5"><ClipboardList className="h-5 w-5 text-brand-primary" /></div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-brand-charcoal-mid text-sm truncate">{a.title}</h3>
                            <p className="text-xs text-brand-warm-grey truncate">{a.courses?.title}{a.batches?.name ? ` • ${a.batches.name}` : ""}{a.due_date && ` • Due: ${format(new Date(a.due_date), "MMM dd, yyyy")}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {a.pdf_url && <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); downloadFile(a.pdf_url); }} className="hover:bg-brand-gold-pale"><FileText className="h-4 w-4 text-brand-primary" /></Button>}
                          {a.video_url && <Badge className="text-xs gap-1 bg-brand-cream-dark text-brand-warm-grey border-0"><Video className="h-3 w-3" /> Video</Badge>}
                          {a.external_link && <Badge className="text-xs gap-1 bg-brand-cream-dark text-brand-warm-grey border-0"><ExternalLink className="h-3 w-3" /> Link</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          {!selectedAssignment ? (
            <Card className="bg-white rounded-2xl border border-brand-parchment"><CardContent className="py-12 text-center"><p className="text-brand-warm-grey font-serif">Select an assignment to view submissions.</p></CardContent></Card>
          ) : submissions.length === 0 ? (
            <Card className="bg-white rounded-2xl border border-brand-parchment"><CardContent className="py-12 text-center"><p className="text-brand-warm-grey font-serif">No submissions yet for this assignment.</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub: any) => (
                <Card key={sub.id} className={`bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] border-l-4 ${sub.status === "graded" ? "border-l-green-400" : "border-l-amber-400"}`}>
                  <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center text-white font-bold text-[10px]">
                          {sub.student_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                        </div>
                        <p className="text-sm font-medium text-brand-charcoal-mid">{sub.student_name}</p>
                      </div>
                      <p className="text-xs text-brand-warm-grey mt-1 ml-10">Submitted: {format(new Date(sub.submitted_at), "MMM dd, yyyy HH:mm")}</p>
                      {sub.text_content && <p className="text-xs mt-1 text-brand-warm-grey line-clamp-2 ml-10">{sub.text_content}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-xs border-0 font-semibold ${sub.status === "graded" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {sub.status === "graded" ? `Grade: ${sub.grade}` : "Pending"}
                      </Badge>
                      {sub.file_url && <Button variant="ghost" size="sm" onClick={() => downloadFile(sub.file_url)} className="hover:bg-brand-gold-pale"><Download className="h-4 w-4 text-brand-primary" /></Button>}
                      <Button size="sm" onClick={() => setFeedbackDialog({ id: sub.id, grade: sub.grade || "", feedback: sub.feedback || "" })} className="border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-gold-pale rounded-xl">
                        <Award className="h-4 w-4" />
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
        <DialogContent className="max-w-lg rounded-2xl border-brand-parchment">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                <Plus className="w-4 h-4 text-brand-gold" />
              </div>
              Create Assignment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Title</Label><Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Assignment title" className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20" /></div>
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Description / Instructions</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Detailed instructions..." rows={4} className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Course</Label><Select value={form.courseId} onValueChange={(v) => updateField("courseId", v)}><SelectTrigger className="mt-1 rounded-xl border-brand-parchment"><SelectValue placeholder="Select course" /></SelectTrigger><SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Batch (optional)</Label><Select value={form.batchId} onValueChange={(v) => updateField("batchId", v)}><SelectTrigger className="mt-1 rounded-xl border-brand-parchment"><SelectValue placeholder="Select batch" /></SelectTrigger><SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Due Date</Label><Input type="datetime-local" value={form.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold" /></div>
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">PDF Upload (optional)</Label><Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="mt-1 border-brand-parchment rounded-xl" /></div>
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Video URL (optional)</Label><Input value={form.videoUrl} onChange={(e) => updateField("videoUrl", e.target.value)} placeholder="YouTube link" className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold" /></div>
            <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">External Link (optional)</Label><Input value={form.externalLink} onChange={(e) => updateField("externalLink", e.target.value)} placeholder="Any reference URL" className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold" /></div>
            <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.courseId || createMutation.isPending} className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl shadow-lg">
              {createMutation.isPending ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={!!feedbackDialog} onOpenChange={() => setFeedbackDialog(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-brand-parchment">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                <Award className="w-4 h-4 text-brand-gold" />
              </div>
              Grade & Feedback
            </DialogTitle>
          </DialogHeader>
          {feedbackDialog && (
            <div className="space-y-4">
              <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Grade</Label><Input value={feedbackDialog.grade} onChange={(e) => setFeedbackDialog({ ...feedbackDialog, grade: e.target.value })} placeholder="e.g. A+, 95%" className="rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20" /></div>
              <div><Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Feedback</Label><Textarea value={feedbackDialog.feedback} onChange={(e) => setFeedbackDialog({ ...feedbackDialog, feedback: e.target.value })} placeholder="Your feedback..." className="rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20" /></div>
              <Button onClick={() => gradeMutation.mutate(feedbackDialog)} disabled={gradeMutation.isPending} className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl shadow-lg">
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
