import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, Clock, AlertTriangle, ChevronDown, ChevronUp,
  FileText, Star, PlayCircle, Calendar, User, BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const AdminAssignments = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    localStorage.setItem("lastViewed:assignments", new Date().toISOString());
    queryClient.invalidateQueries({ queryKey: ["sidebar-counts"] });
  }, [queryClient]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [courses, setCourses] = useState<Record<string, string>>({});
  const [batches, setBatches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [aRes, sRes, cRes, bRes] = await Promise.all([
        supabase.from("assignments").select("*").order("created_at", { ascending: false }),
        supabase.from("assignment_submissions").select("*").order("submitted_at", { ascending: false }),
        supabase.from("courses").select("id, title"),
        supabase.from("batches").select("id, name"),
      ]);

      const items = aRes.data || [];
      const subs = sRes.data || [];
      setAssignments(items);
      setSubmissions(subs);

      const cm: Record<string, string> = {};
      (cRes.data || []).forEach(c => { cm[c.id] = c.title; });
      setCourses(cm);

      const bm: Record<string, string> = {};
      (bRes.data || []).forEach(b => { bm[b.id] = b.name; });
      setBatches(bm);

      // Fetch instructor and student profiles
      const allIds = new Set<string>();
      items.forEach(a => { if (a.instructor_id) allIds.add(a.instructor_id); });
      subs.forEach(s => { allIds.add(s.student_id); });

      if (allIds.size > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", [...allIds]);
        const pm: Record<string, string> = {};
        (profs || []).forEach(p => { pm[p.user_id] = p.display_name || "User"; });
        setProfiles(pm);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const now = new Date();
  const totalSubs = submissions.length;
  const ungradedCount = submissions.filter(s => !s.grade).length;
  const gradedCount = submissions.filter(s => s.grade).length;
  const overdueAssignments = assignments.filter(a => a.due_date && new Date(a.due_date) < now);
  const inProgressAssignments = assignments.filter(a => {
    if (!a.due_date) return false;
    const due = new Date(a.due_date);
    return new Date(a.created_at) <= now && due >= now;
  });

  const getSubsForAssignment = (id: string) => submissions.filter(s => s.assignment_id === id);

  const filterAssignments = (tab: string) => {
    switch (tab) {
      case "in_progress": return inProgressAssignments;
      case "pending": return assignments.filter(a => getSubsForAssignment(a.id).some(s => !s.grade));
      case "graded": return assignments.filter(a => getSubsForAssignment(a.id).length > 0 && getSubsForAssignment(a.id).every(s => s.grade));
      case "overdue": return overdueAssignments;
      default: return assignments;
    }
  };

  const renderAssignmentList = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="h-7 w-7 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl text-brand-primary">No Assignments Found</h3>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((a, i) => {
          const subs = getSubsForAssignment(a.id);
          const isExpanded = expandedId === a.id;
          const isOverdue = a.due_date && new Date(a.due_date) < now;
          const ungradedHere = subs.filter(s => !s.grade).length;

          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-brand-charcoal truncate">{a.title}</h3>
                      {isOverdue && (
                        <Badge className="bg-red-50 text-red-600 border border-red-200 text-[10px]">
                          <AlertTriangle className="h-3 w-3 mr-0.5" /> Overdue
                        </Badge>
                      )}
                      {ungradedHere > 0 && (
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
                          {ungradedHere} ungraded
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-brand-warm-grey flex-wrap">
                      <span>{courses[a.course_id] || "—"}</span>
                      {a.batch_id && <span>• {batches[a.batch_id] || "—"}</span>}
                      <span>• {profiles[a.instructor_id] || "—"}</span>
                      {a.due_date && <span>• Due: {new Date(a.due_date).toLocaleDateString()}</span>}
                      <span>• {subs.length} submission{subs.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-brand-warm-grey shrink-0" /> : <ChevronDown className="h-4 w-4 text-brand-warm-grey shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-brand-parchment px-5 pb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
                      <div className="flex items-start gap-2 text-xs">
                        <BookOpen className="h-3.5 w-3.5 text-brand-gold mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold uppercase tracking-widest text-brand-warm-grey text-[10px]">Course / Topic</p>
                          <p className="text-brand-charcoal mt-0.5">{courses[a.course_id] || "Other / Standalone"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <User className="h-3.5 w-3.5 text-brand-gold mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold uppercase tracking-widest text-brand-warm-grey text-[10px]">Tutor</p>
                          <p className="text-brand-charcoal mt-0.5">{profiles[a.instructor_id] || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-brand-gold mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold uppercase tracking-widest text-brand-warm-grey text-[10px]">Created</p>
                          <p className="text-brand-charcoal mt-0.5">{new Date(a.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <Clock className="h-3.5 w-3.5 text-brand-gold mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold uppercase tracking-widest text-brand-warm-grey text-[10px]">Due Date</p>
                          <p className="text-brand-charcoal mt-0.5">{a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}</p>
                        </div>
                      </div>
                    </div>
                    {a.description && <p className="text-sm text-brand-charcoal/80 pb-3">{a.description}</p>}
                    {a.pdf_url && (
                      <a href={a.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-primary hover:text-brand-gold mb-3">
                        <FileText className="h-3 w-3" /> View PDF Instructions
                      </a>
                    )}
                    {subs.length === 0 ? (
                      <p className="text-sm text-brand-warm-grey py-4 text-center">No submissions yet</p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        <div className="grid grid-cols-4 gap-2 text-[10px] uppercase tracking-widest text-brand-warm-grey font-semibold px-3">
                          <span>Student</span>
                          <span>Submitted</span>
                          <span>Status</span>
                          <span>Grade</span>
                        </div>
                        {subs.map(s => (
                          <div key={s.id} className="grid grid-cols-4 gap-2 items-center p-3 rounded-xl bg-brand-cream/50 text-sm">
                            <span className="text-brand-charcoal truncate">{profiles[s.student_id] || s.student_id.slice(0, 8)}</span>
                            <span className="text-brand-warm-grey text-xs">{new Date(s.submitted_at).toLocaleDateString()}</span>
                            <Badge className={s.grade
                              ? "bg-green-50 text-green-700 border border-green-200 text-[10px]"
                              : "bg-amber-50 text-amber-700 border border-amber-200 text-[10px]"
                            }>
                              {s.grade ? "Graded" : "Pending"}
                            </Badge>
                            <span className="text-brand-charcoal font-medium">
                              {s.grade ? (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-brand-gold fill-brand-gold" />
                                  {s.grade}
                                </span>
                              ) : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-2">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  const statCards = [
    { label: "Total Assignments", value: assignments.length, icon: ClipboardList, gradient: "from-brand-primary to-brand-primary-dark" },
    { label: "In Progress", value: inProgressAssignments.length, icon: PlayCircle, gradient: "from-blue-500 to-blue-700" },
    { label: "Total Submissions", value: totalSubs, icon: FileText, gradient: "from-brand-gold to-amber-600" },
    { label: "Ungraded", value: ungradedCount, icon: Clock, gradient: "from-amber-500 to-orange-600" },
    { label: "Overdue", value: overdueAssignments.length, icon: AlertTriangle, gradient: "from-red-600 to-red-800" },
  ];

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-brand-primary">Assignments</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className="font-serif text-3xl font-bold text-brand-primary mt-3">{s.value}</p>
              <p className="text-[11px] text-brand-warm-grey uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="bg-brand-cream border border-brand-parchment rounded-xl p-1 flex-wrap h-auto">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">
            All ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">
            In Progress ({inProgressAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">
            Pending ({ungradedCount})
          </TabsTrigger>
          <TabsTrigger value="graded" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">
            Graded ({gradedCount})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">
            Overdue ({overdueAssignments.length})
          </TabsTrigger>
        </TabsList>
        {["all", "in_progress", "pending", "graded", "overdue"].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {renderAssignmentList(filterAssignments(tab))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminAssignments;
