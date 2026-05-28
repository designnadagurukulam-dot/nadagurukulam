import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, FileText, Video, ExternalLink, Calendar, Upload, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast } from "date-fns";
import { toast } from "sonner";
import SubmitAssignmentDialog from "@/components/assignments/SubmitAssignmentDialog";

const DashboardAssignmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitOpen, setSubmitOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["assignment-detail", id, user?.id],
    queryFn: async () => {
      const { data: a, error } = await supabase
        .from("assignments")
        .select("*, courses(title, category), batches(name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!a) return null;
      const [{ data: prof }, { data: mod }, { data: top }, { data: sub }] = await Promise.all([
        a.instructor_id ? supabase.from("profiles").select("display_name").eq("user_id", a.instructor_id).maybeSingle() : Promise.resolve({ data: null }),
        a.curriculum_module_id ? supabase.from("curriculum_modules").select("module_name").eq("id", a.curriculum_module_id).maybeSingle() : Promise.resolve({ data: null }),
        a.curriculum_topic_id ? supabase.from("curriculum_topics").select("title").eq("id", a.curriculum_topic_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("assignment_submissions").select("*").eq("assignment_id", a.id).eq("student_id", user!.id).maybeSingle(),
      ]);
      return {
        ...a,
        faculty_name: (prof as any)?.display_name || "Faculty",
        module_name: (mod as any)?.module_name || null,
        topic_name: (top as any)?.title || null,
        submission: sub,
      };
    },
    enabled: !!id && !!user,
  });

  const downloadFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("assignment-files").createSignedUrl(path, 3600);
    if (error) { toast.error("Failed to get download link"); return; }
    window.open(data.signedUrl, "_blank");
  };

  if (isLoading) {
    return <div className="space-y-3 pt-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-48 rounded-2xl" /></div>;
  }
  if (!data) {
    return <div className="pt-8 text-center text-brand-warm-grey">Assignment not found.</div>;
  }

  const a = data;
  const isOverdue = a.due_date && isPast(new Date(a.due_date));
  const canSubmit = !a.submission;

  return (
    <div className="space-y-4 sm:space-y-6 pt-2 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 text-brand-warm-grey hover:text-brand-primary -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">{a.title}</h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
        </div>
      </motion.div>

      <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Field label="Program" value={a.courses?.category || "—"} />
            <Field label="Course" value={a.courses?.title || "N/A"} />
            <Field label="Module" value={a.module_name || "N/A"} />
            <Field label="Topic" value={a.topic_name || "N/A"} />
            <Field label="Batch" value={a.batches?.name || "—"} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-warm-grey mb-1">Due Date &amp; Time</p>
              <p className={`text-sm font-medium flex items-center gap-1.5 ${isOverdue ? "text-red-600" : "text-brand-charcoal-mid"}`}>
                <Calendar className="h-3.5 w-3.5" />
                {a.due_date ? format(new Date(a.due_date), "MMM dd, yyyy HH:mm") : "—"}
              </p>
            </div>
          </div>

          {a.description && (
            <div className="bg-brand-cream rounded-xl p-3 sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-warm-grey mb-2">Description / Instructions</p>
              <p className="text-sm text-brand-charcoal-mid whitespace-pre-wrap leading-relaxed">{a.description}</p>
            </div>
          )}

          {(a.pdf_url || a.video_url || a.external_link || a.reference_text) && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-warm-grey mb-2">Reference Files</p>
              <div className="flex flex-wrap gap-2">
                {a.pdf_url && <Button variant="outline" size="sm" onClick={() => downloadFile(a.pdf_url)} className="gap-1.5 rounded-xl text-brand-primary border-brand-parchment hover:bg-brand-gold-pale"><FileText className="h-3.5 w-3.5" /> Download PDF</Button>}
                {a.video_url && <a href={a.video_url} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-brand-primary border-brand-parchment hover:bg-brand-gold-pale"><Video className="h-3.5 w-3.5" /> Watch Video</Button></a>}
                {a.external_link && <a href={a.external_link} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-brand-primary border-brand-parchment hover:bg-brand-gold-pale"><ExternalLink className="h-3.5 w-3.5" /> External Link</Button></a>}
              </div>
              {a.reference_text && <p className="text-xs text-brand-charcoal-mid mt-3 whitespace-pre-wrap bg-brand-cream rounded-xl p-3">{a.reference_text}</p>}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-brand-warm-grey border-t border-brand-parchment pt-3">
            <span>Faculty: <span className="text-brand-charcoal-mid font-medium">{a.faculty_name}</span></span>
          </div>

          {a.submission?.status === "graded" && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <span className="font-medium text-green-700 flex items-center gap-1.5 text-sm">
                <Award className="h-4 w-4" /> Grade: {a.submission.grade}
              </span>
              {a.submission.feedback && <p className="text-green-600 mt-1.5 text-sm">{a.submission.feedback}</p>}
            </div>
          )}

          {a.submission && a.submission.status !== "graded" && (
            <Badge className="bg-amber-50 text-amber-700 border-0 text-xs">Submitted on {format(new Date(a.submission.submitted_at), "MMM dd, yyyy h:mm a")} — Awaiting Grade</Badge>
          )}

          {canSubmit && (
            <Button onClick={() => setSubmitOpen(true)} className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl min-h-[44px] gap-2">
              <Upload className="h-4 w-4" /> Submit Assignment
            </Button>
          )}
        </CardContent>
      </Card>

      <SubmitAssignmentDialog open={submitOpen} onOpenChange={setSubmitOpen} assignmentId={a.id} />
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-warm-grey mb-1">{label}</p>
    <p className="text-sm font-medium text-brand-charcoal-mid">{value}</p>
  </div>
);

export default DashboardAssignmentDetail;
