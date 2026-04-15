import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, FileText, Upload, ExternalLink, Video, Award, CloudUpload, Clock, Eye, Calendar, Pencil, X, Trash2 } from "lucide-react";
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
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Edit submission state
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [editText, setEditText] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  const { data: assignmentsData = [], isLoading } = useQuery({
    queryKey: ["student-assignments", user?.id],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from("enrollments").select("course_id").eq("user_id", user!.id);
      if (!enrollments?.length) return [];
      const courseIds = enrollments.map((e) => e.course_id);
      const { data: assignments, error } = await supabase
        .from("assignments").select("*, courses(title)").in("course_id", courseIds).order("due_date", { ascending: true });
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
      setSelectedAssignment(null); setShowSubmitForm(false); setTextContent(""); setFile(null);
      toast.success("Assignment submitted!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const editMutation = useMutation({
    mutationFn: async ({ submissionId, assignmentId }: { submissionId: string; assignmentId: string }) => {
      let file_url = editingSubmission.file_url;

      if (removeExistingFile && !editFile) {
        file_url = null;
      }

      if (editFile) {
        const filePath = `submissions/${user!.id}/${Date.now()}_${editFile.name}`;
        const { error: uploadError } = await supabase.storage.from("assignment-files").upload(filePath, editFile);
        if (uploadError) throw uploadError;
        file_url = filePath;
      }

      const { error } = await supabase
        .from("assignment_submissions")
        .update({ text_content: editText || null, file_url, updated_at: new Date().toISOString() })
        .eq("id", submissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-assignments"] });
      setEditingSubmission(null); setEditText(""); setEditFile(null); setRemoveExistingFile(false);
      toast.success("Submission updated!");
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

  const getLeftBorder = (dueDate: string | null, status: string) => {
    if (status === "graded") return "border-l-green-500";
    if (status === "submitted") return "border-l-blue-500";
    if (!dueDate) return "border-l-brand-warm-grey";
    const diffDays = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return "border-l-red-500";
    if (diffDays < 2) return "border-l-amber-500";
    return "border-l-green-500";
  };

  const openDetail = (a: any) => {
    setSelectedAssignment(a);
    setShowSubmitForm(false);
    setTextContent("");
    setFile(null);
  };

  const openEditSubmission = (a: any) => {
    setEditingSubmission(a.submission);
    setEditText(a.submission?.text_content || "");
    setEditFile(null);
    setRemoveExistingFile(false);
  };

  const renderAssignment = (a: any) => (
    <Card
      key={a.id}
      onClick={() => openDetail(a)}
      className={`bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300 border-l-4 ${getLeftBorder(a.due_date, a.status)} cursor-pointer hover:-translate-y-0.5`}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-primary/15 to-brand-primary/5 flex items-center justify-center shrink-0">
                <ClipboardList className="h-3.5 w-3.5 text-brand-primary" />
              </div>
              <h3 className="font-semibold text-brand-charcoal-mid text-sm truncate">{a.title}</h3>
            </div>
            <p className="text-[10px] sm:text-xs text-brand-warm-grey mt-1 ml-9">{a.courses?.title}</p>
            {a.description && <p className="text-[10px] sm:text-xs text-brand-warm-grey mt-1 ml-9 line-clamp-2">{a.description}</p>}
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 ml-9 sm:ml-0">
            {a.due_date && (
              <Badge className={`${getDueBadgeColor(a.due_date, a.status)} border-0 text-[10px] sm:text-xs`}>
                {a.status === "overdue" ? "Overdue" : `Due ${format(new Date(a.due_date), "MMM dd")}`}
              </Badge>
            )}
            {a.status === "submitted" && <Badge className="bg-amber-50 text-amber-700 border-0 text-[10px] sm:text-xs">Awaiting Grade</Badge>}
            {a.status === "graded" && <Badge className="bg-green-50 text-green-700 border-0 text-[10px] sm:text-xs">Graded</Badge>}
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] sm:text-xs text-brand-primary hover:bg-brand-gold-pale rounded-lg" onClick={(e) => { e.stopPropagation(); openDetail(a); }}>
              <Eye className="h-3 w-3" /> View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmpty = (msg: string, icon: any) => {
    const Icon = icon;
    return (
      <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
        <CardContent className="py-10 sm:py-12 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-3">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-brand-gold" />
          </div>
          <p className="font-serif text-brand-primary font-semibold text-sm sm:text-base">{msg}</p>
        </CardContent>
      </Card>
    );
  };

  const a = selectedAssignment;

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">Assignments</h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          <p className="text-brand-warm-grey mt-1 text-xs sm:text-sm">View and submit your assignments</p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 sm:h-24 rounded-2xl" />)}</div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList className="bg-brand-cream-dark rounded-xl p-1 w-full sm:w-auto">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-[11px] sm:text-sm flex-1 sm:flex-none min-h-[40px] gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="submitted" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-[11px] sm:text-sm flex-1 sm:flex-none min-h-[40px] gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Submitted ({submitted.length})
            </TabsTrigger>
            <TabsTrigger value="graded" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-[11px] sm:text-sm flex-1 sm:flex-none min-h-[40px] gap-1.5">
              <Award className="h-3.5 w-3.5" /> Graded ({graded.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
            {pending.length === 0 ? renderEmpty("No pending assignments. You're all caught up! 🎉", ClipboardList) : pending.map(renderAssignment)}
          </TabsContent>
          <TabsContent value="submitted" className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
            {submitted.length === 0 ? renderEmpty("No submitted assignments waiting for grading.", Upload) : submitted.map(renderAssignment)}
          </TabsContent>
          <TabsContent value="graded" className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
            {graded.length === 0 ? renderEmpty("No graded assignments yet.", Award) : graded.map(renderAssignment)}
          </TabsContent>
        </Tabs>
      )}

      {/* Assignment Detail Popup */}
      <Dialog open={!!selectedAssignment} onOpenChange={(open) => { if (!open) { setSelectedAssignment(null); setShowSubmitForm(false); } }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg rounded-2xl border-brand-parchment overflow-hidden p-0 max-h-[90vh] overflow-y-auto">
          {a && (
            <>
              <div className="bg-gradient-to-r from-brand-primary to-brand-primary-dark p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ClipboardList className="w-5 h-5 text-brand-gold" />
                  </div>
                  <DialogHeader className="text-left flex-1">
                    <DialogTitle className="font-serif text-white text-lg leading-snug">{a.title}</DialogTitle>
                    <p className="text-white/60 text-xs mt-1">{a.courses?.title}</p>
                  </DialogHeader>
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {a.due_date && (
                    <Badge className={`${getDueBadgeColor(a.due_date, a.status)} border-0 text-xs gap-1`}>
                      <Calendar className="h-3 w-3" />
                      {a.status === "overdue" ? "Overdue" : `Due ${format(new Date(a.due_date), "MMM dd, yyyy")}`}
                    </Badge>
                  )}
                  {a.status === "submitted" && <Badge className="bg-amber-50 text-amber-700 border-0 text-xs">Awaiting Grade</Badge>}
                  {a.status === "graded" && <Badge className="bg-green-50 text-green-700 border-0 text-xs">Graded</Badge>}
                  {(a.status === "pending" || a.status === "overdue") && !a.submission && <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">Not Submitted</Badge>}
                </div>

                {a.description && (
                  <div className="bg-brand-cream rounded-xl p-3">
                    <p className="text-xs font-semibold text-brand-charcoal-mid mb-1 uppercase tracking-wider">Description</p>
                    <p className="text-sm text-brand-charcoal-mid leading-relaxed">{a.description}</p>
                  </div>
                )}

                {(a.pdf_url || a.video_url || a.external_link) && (
                  <div>
                    <p className="text-xs font-semibold text-brand-charcoal-mid mb-2 uppercase tracking-wider">Resources</p>
                    <div className="flex flex-wrap gap-2">
                      {a.pdf_url && (
                        <Button variant="outline" size="sm" onClick={() => downloadFile(a.pdf_url)} className="gap-1.5 text-xs text-brand-primary border-brand-parchment hover:bg-brand-gold-pale rounded-xl">
                          <FileText className="h-3.5 w-3.5" /> Download PDF
                        </Button>
                      )}
                      {a.video_url && (
                        <a href={a.video_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs text-brand-primary border-brand-parchment hover:bg-brand-gold-pale rounded-xl">
                            <Video className="h-3.5 w-3.5" /> Watch Video
                          </Button>
                        </a>
                      )}
                      {a.external_link && (
                        <a href={a.external_link} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs text-brand-primary border-brand-parchment hover:bg-brand-gold-pale rounded-xl">
                            <ExternalLink className="h-3.5 w-3.5" /> External Link
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {a.submission?.status === "graded" && (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <span className="font-medium text-green-700 flex items-center gap-1.5 text-sm">
                      <Award className="h-4 w-4" /> Grade: {a.submission.grade}
                    </span>
                    {a.submission.feedback && <p className="text-green-600 mt-1.5 text-sm">{a.submission.feedback}</p>}
                  </div>
                )}

                {!a.submission && !showSubmitForm && (
                  <Button
                    onClick={() => setShowSubmitForm(true)}
                    className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl min-h-[44px] gap-2"
                  >
                    <Upload className="h-4 w-4" /> Submit Assignment
                  </Button>
                )}

                {!a.submission && showSubmitForm && (
                  <div className="space-y-3 border-t border-brand-parchment pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CloudUpload className="w-4 h-4 text-brand-gold" />
                      <p className="text-xs font-semibold text-brand-charcoal-mid uppercase tracking-wider">Your Submission</p>
                    </div>
                    <div>
                      <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Upload File</Label>
                      <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 border-brand-parchment rounded-xl focus:border-brand-gold focus:ring-brand-gold/20 h-11" />
                    </div>
                    <div>
                      <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Text Response (optional)</Label>
                      <Textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Your response..." rows={4} className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20" />
                    </div>
                    <Button
                      onClick={() => submitMutation.mutate(a.id)}
                      disabled={(!file && !textContent) || submitMutation.isPending}
                      className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl min-h-[44px] gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {submitMutation.isPending ? "Submitting..." : "Submit Assignment"}
                    </Button>
                  </div>
                )}

                {/* Submitted — show edit option if ungraded */}
                {a.submission && a.status === "submitted" && (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                      <p className="text-sm text-amber-700 font-medium">Your submission is being reviewed</p>
                      <p className="text-xs text-amber-600 mt-1">Submitted on {format(new Date(a.submission.submitted_at), "MMM dd, yyyy h:mm a")}</p>
                    </div>
                    {!a.submission.grade ? (
                      <Button
                        variant="outline"
                        onClick={() => openEditSubmission(a)}
                        className="w-full gap-2 text-brand-primary border-brand-parchment hover:bg-brand-gold-pale rounded-xl min-h-[44px]"
                      >
                        <Pencil className="h-4 w-4" /> Edit Submission
                      </Button>
                    ) : (
                      <p className="text-xs text-brand-warm-grey text-center">Graded — cannot edit</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Submission Dialog */}
      <Dialog open={!!editingSubmission} onOpenChange={(open) => { if (!open) { setEditingSubmission(null); } }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl border-brand-parchment">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary">Edit Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Text Response</Label>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Your response..."
                rows={4}
                className="mt-1 rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20"
              />
            </div>

            {/* Existing file */}
            {editingSubmission?.file_url && !removeExistingFile && (
              <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-xs text-blue-700 flex-1 truncate">{editingSubmission.file_url.split("/").pop()}</span>
                <button
                  onClick={() => setRemoveExistingFile(true)}
                  className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </button>
              </div>
            )}

            {/* Upload new file */}
            {(removeExistingFile || !editingSubmission?.file_url) && (
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">
                  {removeExistingFile ? "Replace with new file (optional)" : "Attach File (optional)"}
                </Label>
                <Input
                  type="file"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className="mt-1 border-brand-parchment rounded-xl focus:border-brand-gold focus:ring-brand-gold/20 h-11"
                />
              </div>
            )}

            <Button
              onClick={() => editMutation.mutate({ submissionId: editingSubmission.id, assignmentId: editingSubmission.assignment_id })}
              disabled={editMutation.isPending}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl min-h-[44px] gap-2"
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardAssignments;
