import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface CourseRow { id: string; title: string; progress: number }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courses: CourseRow[];
}

const CourseProgressDialog = ({ open, onOpenChange, courses }: Props) => {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-brand-primary">Course Progress</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {courses.length === 0 && (
            <p className="text-sm text-brand-warm-grey py-6 text-center">No enrolled courses.</p>
          )}
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => { onOpenChange(false); navigate("/dashboard/student/courses"); }}
              className="w-full text-left p-3 rounded-xl border border-brand-parchment hover:border-brand-gold/40 hover:bg-brand-cream transition-all group"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-brand-charcoal-mid truncate">{c.title}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs font-bold text-brand-primary">{c.progress}%</span>
                  <ChevronRight className="w-4 h-4 text-brand-warm-grey opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <Progress value={c.progress} className="h-2" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseProgressDialog;
