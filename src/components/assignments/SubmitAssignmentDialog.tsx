import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, CloudUpload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  onSubmitted?: () => void;
}

const SubmitAssignmentDialog = ({ open, onOpenChange, assignmentId, onSubmitted }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      let file_url: string | null = null;
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-assignments"] });
      qc.invalidateQueries({ queryKey: ["assignment-detail"] });
      logActivity("assignment.submitted", "assignment", assignmentId);
      setTextContent(""); setFile(null);
      onOpenChange(false);
      onSubmitted?.();
      toast.success("Assignment submitted!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl border-brand-parchment">
        <DialogHeader>
          <DialogTitle className="font-serif text-brand-primary flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-brand-gold" /> Submit Assignment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Upload File</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 rounded-xl border-brand-parchment h-11" />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Text Response (optional)</Label>
            <Textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Your response..." rows={4} className="mt-1 rounded-xl border-brand-parchment" />
          </div>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={(!file && !textContent) || submitMutation.isPending}
            className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl min-h-[44px] gap-2"
          >
            <Upload className="h-4 w-4" />
            {submitMutation.isPending ? "Submitting..." : "Submit Assignment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitAssignmentDialog;
