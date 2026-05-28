import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Plus, FileText, Download, Video, ExternalLink, Upload, Award } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { logActivity } from "@/lib/activityLogger";

const NA = "__na__";

const InstructorAssignments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    courseId: NA,
    moduleId: NA,
    topicId: NA,
    batchId: "",
    dueDate: "",
    videoUrl: "",
    externalLink: "",
    referenceText: "",
  });
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

  // All curriculum modules allocated to this instructor (via subject_allocations) plus any tied to selected course
  const { data: modules = [] } = useQuery({
    queryKey: ["instructor-modules-all", user?.id],
    queryFn: async () => {
      const { data: alloc } = await supabase.from("subject_allocations").select("curriculum_module_id").eq("instructor_id", user!.id);
      const ids = (alloc || []).map((a: any) => a.curriculum_module_id).filter(Boolean);
      if (!ids.length) return [];
      const { data } = await supabase.from("curriculum_modules").select("id, module_name, course_code").in("id", ids);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: topics = [] } = useQuery({
    queryKey: ["module-topics", form.moduleId],
    queryFn: async () => {
      if (form.moduleId === NA) return [];
      const { data } = await supabase.from("curriculum_topics").select("id, title").eq("module_id", form.moduleId).order("sort_order");
      return data || [];
    },
    enabled: form.moduleId !== NA,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["instructor-assignments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, courses(title, category), batches(name)")
        .eq("instructor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const moduleIds = [...new Set((data || []).map((a: any) => a.curriculum_module_id).filter(Boolean))];
      const topicIds = [...new Set((data || []).map((a: any) => a.curriculum_topic_id).filter(Boolean))];
      const [{ data: mods }, { data: tps }] = await Promise.all([
        moduleIds.length ? supabase.from("curriculum_modules").select("id, module_name").in("id", moduleIds) : Promise.resolve({ data: [] }),
        topicIds.length ? supabase.from("curriculum_topics").select("id, title").in("id", topicIds) : Promise.resolve({ data: [] }),
      ]);
      const modMap = Object.fromEntries((mods || []).map((m: any) => [m.id, m.module_name]));
      const topMap = Object.fromEntries((tps || []).map((t: any) => [t.id, t.title]));
      return (data || []).map((a: any) => ({
        ...a,
        module_name: a.curriculum_module_id ? modMap[a.curriculum_module_id] : null,
        topic_name: a.curriculum_topic_id ? topMap[a.curriculum_topic_id] : null,
      }));
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

  const resetForm = () => setForm({ title: "", description: "", courseId: NA, moduleId: NA, topicId: NA, batchId: "", dueDate: "", videoUrl: "", externalLink: "", referenceText: "" });

  const createMutation = useMutation({
    mutationFn: async () => {
      let pdf_url = null;
      if (pdfFile) {
        const filePath = `assignments/${user!.id}/${Date.now()}_${pdfFile.name}`;
        const { error: uploadError } = await supabase.storage.from("assignment-files").upload(filePath, pdfFile);
        if (uploadError) throw uploadError;
        pdf_url = filePath;
      }
      const payload: any = {
        title: form.title,
        description: form.description,
        instructor_id: user!.id,
        course_id: form.courseId === NA ? null : form.courseId,
        curriculum_module_id: form.moduleId === NA ? null : form.moduleId,
        curriculum_topic_id: form.topicId === NA ? null : form.topicId,
        batch_id: form.batchId || null,
        pdf_url,
        video_url: form.videoUrl || null,
        external_link: form.externalLink || null,
        reference_text: form.referenceText || null,
        due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      };
      const { error } = await supabase.from("assignments").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-assignments"] });
      logActivity("assignment.created", "assignment");
      setCreateOpen(false);
      resetForm();
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

  const updateField = (key: string, val: string) => setForm((p) => {
    const next: any = { ...p, [key]: val };
    if (key === "moduleId") next.topicId = NA;
    return next;
  });

  const canCreate = !!form.title && !!form.batchId;

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
            <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-cream-dark">
                      <TableHead className="text-brand-primary font-semibold">Title</TableHead>
                      <TableHead className="text-brand-primary font-semibold">Course</TableHead>
                      <TableHead className="text-brand-primary font-semibold">Module</TableHead>
                      <TableHead className="text-brand-primary font-semibold">Topic</TableHead>
                      <TableHead className="text-brand-primary font-semibold">Batch</TableHead>
                      <TableHead className="text-brand-primary font-semibold">Due Date</TableHead>
                      <TableHead className="text-brand-primary font-semibold text-right">Ref</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a: any) => {
                      const isOverdue = a.due_date && new Date(a.due_date) < new Date();
                      const isSelected = selectedAssignment === a.id;
                      return (
                        <TableRow
                          key={a.id}
                          onClick={() => setSelectedAssignment(isSelected ? null : a.id)}
                          className={`cursor-pointer ${isSelected ? "bg-brand-gold-pale/40" : ""}`}
                        >
                          <TableCell className="font-medium text-brand-charcoal-mid">{a.title}</TableCell>
                          <TableCell className="text-sm text-brand-warm-grey">{a.courses?.title || "—"}</TableCell>
                          <TableCell className="text-sm text-brand-warm-grey">{a.module_name || "—"}</TableCell>
                          <TableCell className="text-sm text-brand-warm-grey">{a.topic_name || "—"}</TableCell>
                          <TableCell className="text-sm text-brand-warm-grey">{a.batches?.name || "—"}</TableCell>
                          <TableCell className={`text-sm ${isOverdue ? "text-red-600 font-semibold" : "text-brand-warm-grey"}`}>
                            {a.due_date ? format(new Date(a.due_date), "MMM dd, yyyy HH:mm") : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-1 items-center">
                              {a.pdf_url && <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); downloadFile(a.pdf_url); }} className="hover:bg-brand-gold-pale h-7 w-7 p-0"><FileText className="h-3.5 w-3.5 text-brand-primary" /></Button>}
                              {a.video_url && <Video className="h-3.5 w-3.5 text-brand-warm-grey" />}
                              {a.external_link && <ExternalLink className="h-3.5 w-3.5 text-brand-warm-grey" />}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile stacked cards */}
              <div className="md:hidden divide-y divide-brand-parchment">
                {assignments.map((a: any) => {
                  const isOverdue = a.due_date && new Date(a.due_date) < new Date();
                  return (
                    <div key={a.id} onClick={() => setSelectedAssignment(selectedAssignment === a.id ? null : a.id)} className={`p-4 cursor-pointer ${selectedAssignment === a.id ? "bg-brand-gold-pale/40" : ""}`}>
                      <div className="font-semibold text-brand-charcoal-mid text-sm">{a.title}</div>
                      <div className="text-xs text-brand-warm-grey mt-1 space-y-0.5">
                        <div>Program: {a.courses?.category || "—"}</div>
                        <div>Course: {a.courses?.title || "—"}</div>
                        <div>Module: {a.module_name || "—"} · Topic: {a.topic_name || "—"}</div>
                        <div>Batch: {a.batches?.name || "—"}</div>
                        <div className={isOverdue ? "text-red-600 font-semibold" : ""}>Due: {a.due_date ? format(new Date(a.due_date), "MMM dd, yyyy HH:mm") : "—"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
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
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Title</Label>
              <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Assignment title" className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Course</Label>
                <Select value={form.courseId} onValueChange={(v) => updateField("courseId", v)}>
                  <SelectTrigger className="mt-1 rounded-xl border-brand-parchment"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NA}>N/A</SelectItem>
                    {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Batch *</Label>
                <Select value={form.batchId} onValueChange={(v) => updateField("batchId", v)}>
                  <SelectTrigger className="mt-1 rounded-xl border-brand-parchment"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Module</Label>
                <Select value={form.moduleId} onValueChange={(v) => updateField("moduleId", v)}>
                  <SelectTrigger className="mt-1 rounded-xl border-brand-parchment"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NA}>N/A</SelectItem>
                    {modules.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.module_name}{m.course_code ? ` (${m.course_code})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Topic</Label>
                <Select value={form.topicId} onValueChange={(v) => updateField("topicId", v)} disabled={form.moduleId === NA}>
                  <SelectTrigger className="mt-1 rounded-xl border-brand-parchment"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NA}>N/A</SelectItem>
                    {topics.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Description / Instructions</Label>
              <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Detailed instructions..." rows={4} className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20" />
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Due Date &amp; Time</Label>
              <Input type="datetime-local" value={form.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold" />
            </div>

            <div className="border-t border-brand-parchment pt-3 space-y-3">
              <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Reference Files (Optional)</Label>
              <Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="border-brand-parchment rounded-xl" />
              <Input value={form.videoUrl} onChange={(e) => updateField("videoUrl", e.target.value)} placeholder="Video link (YouTube etc.)" className="rounded-xl border-brand-parchment focus:border-brand-gold" />
              <Input value={form.externalLink} onChange={(e) => updateField("externalLink", e.target.value)} placeholder="External link" className="rounded-xl border-brand-parchment focus:border-brand-gold" />
              <Textarea value={form.referenceText} onChange={(e) => updateField("referenceText", e.target.value)} placeholder="Reference notes / text" rows={2} className="rounded-xl border-brand-parchment focus:border-brand-gold" />
            </div>

            <Button onClick={() => createMutation.mutate()} disabled={!canCreate || createMutation.isPending} className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl shadow-lg">
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
              Grade &amp; Feedback
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
