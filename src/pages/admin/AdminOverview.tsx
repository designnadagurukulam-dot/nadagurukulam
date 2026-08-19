import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Users, Clock,
  ShieldCheck, Layers,
  Sparkles, Crown, Zap, TrendingUp, ClipboardList, Mail, Star,
  Plus, X, GraduationCap, Video, Check, LayoutGrid
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import LiveClassesBlock from "@/components/overview/LiveClassesBlock";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type BlockDef = {
  id: string;
  label: string;
  group: "Stat Cards" | "Sections";
  icon: any;
};

const BLOCK_REGISTRY: BlockDef[] = [
  { id: "courses", label: "Total Courses", group: "Stat Cards", icon: BookOpen },
  { id: "students", label: "Students", group: "Stat Cards", icon: Users },
  { id: "faculty", label: "Faculty", group: "Stat Cards", icon: GraduationCap },
  { id: "liveClasses", label: "Live Classes", group: "Stat Cards", icon: Video },
  { id: "batches", label: "Active Batches", group: "Stat Cards", icon: Layers },
  { id: "pendingReviews", label: "Pending Reviews", group: "Stat Cards", icon: Clock },
  { id: "ungraded", label: "Ungraded", group: "Stat Cards", icon: ClipboardList },
  { id: "feedback", label: "Recent Feedback", group: "Stat Cards", icon: Star },
  { id: "facultyCourses", label: "Faculty's Courses", group: "Stat Cards", icon: BookOpen },
  { id: "curriculum", label: "Curriculum", group: "Stat Cards", icon: LayoutGrid },
  { id: "activity", label: "Platform Activity", group: "Sections", icon: Zap },
  { id: "quickActions", label: "Quick Actions", group: "Sections", icon: Sparkles },
  { id: "liveClassesList", label: "Live Classes (Schedule)", group: "Sections", icon: Video },
];

const DEFAULT_BLOCKS = [
  "courses", "pendingReviews", "ungraded", "feedback",
  "activity", "quickActions", "liveClassesList",
];

const DEFAULT_ACTIONS = ["verification", "assignments", "inquiries", "batches", "users", "messages"];

const storageKey = (uid?: string) => `admin-overview-blocks:${uid || "anon"}`;
const actionsStorageKey = (uid?: string) => `admin-overview-actions:${uid || "anon"}`;


const AdminOverview = () => {
  const { role, user } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    courses: 0, students: 0, instructors: 0,
    batches: 0, liveClasses: 0,
    pendingVerifications: 0,
    pendingReviews: 0,
    ungradedSubmissions: 0,
    unreadMessages: 0,
    pendingInquiries: 0,
    unreadFeedback: 0,
    curriculumModules: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<{ day: string; actions: number }[]>([]);
  const [visibleBlocks, setVisibleBlocks] = useState<string[]>(DEFAULT_BLOCKS);
  const [addOpen, setAddOpen] = useState(false);
  const [visibleActions, setVisibleActions] = useState<string[]>(DEFAULT_ACTIONS);
  const [actionsOpen, setActionsOpen] = useState(false);

  // Load persisted layout for this admin
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(storageKey(user.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setVisibleBlocks(parsed.filter((id: string) => BLOCK_REGISTRY.some(b => b.id === id)));
        }
      }
      const rawActions = localStorage.getItem(actionsStorageKey(user.id));
      if (rawActions) {
        const parsed = JSON.parse(rawActions);
        if (Array.isArray(parsed)) setVisibleActions(parsed.filter((id: unknown) => typeof id === "string"));
      }
    } catch { /* ignore malformed layout */ }
  }, [user]);

  const persist = (next: string[]) => {
    setVisibleBlocks(next);
    try {
      localStorage.setItem(storageKey(user?.id), JSON.stringify(next));
    } catch { /* storage unavailable */ }
  };

  const persistActions = (next: string[]) => {
    setVisibleActions(next);
    try {
      localStorage.setItem(actionsStorageKey(user?.id), JSON.stringify(next));
    } catch { /* storage unavailable */ }
  };

  const addAction = (id: string) => {
    if (visibleActions.includes(id)) return;
    persistActions([...visibleActions, id]);
  };
  const removeAction = (id: string) => persistActions(visibleActions.filter(a => a !== id));

  const addBlock = (id: string) => {
    if (visibleBlocks.includes(id)) return;
    persist([...visibleBlocks, id]);
  };
  const removeBlock = (id: string) => persist(visibleBlocks.filter(b => b !== id));
  const isVisible = (id: string) => visibleBlocks.includes(id);


  useEffect(() => {
    const fetchAll = async () => {
      const now = new Date();
      const dayOfWeek = (now.getDay() + 6) % 7;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);

      const [
        coursesRes, studentRes, instructorRes,
        batchRes, liveRes,
        pendingVerifRes,
        ungradedRes, unreadRes,
        pendingInquiriesRes,
        curriculumRes,
        weekActivityRes,
      ] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "instructor"),
        supabase.from("batches").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("live_classes").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", false),
        supabase.from("assignment_submissions").select("id", { count: "exact", head: true }).is("grade", null),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("program_inquiries").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("curriculum_modules").select("id", { count: "exact", head: true }),
        supabase.from("activity_logs").select("created_at").gte("created_at", weekStart.toISOString()),
      ]);

      setStats({
        courses: coursesRes.count || 0,
        students: studentRes.count || 0,
        instructors: instructorRes.count || 0,
        batches: batchRes.count || 0,
        liveClasses: liveRes.count || 0,
        pendingVerifications: pendingVerifRes.count || 0,
        pendingReviews: 0,
        ungradedSubmissions: ungradedRes.count || 0,
        unreadMessages: unreadRes.count || 0,
        pendingInquiries: pendingInquiriesRes.count || 0,
        unreadFeedback: 0,
        curriculumModules: curriculumRes.count || 0,
      });

      const dayCounts: Record<string, number> = {};
      weekDays.forEach(d => { dayCounts[d] = 0; });
      (weekActivityRes.data || []).forEach(log => {
        const d = new Date(log.created_at);
        const idx = (d.getDay() + 6) % 7;
        if (idx < 7) dayCounts[weekDays[idx]]++;
      });
      setActivityData(weekDays.map(day => ({ day, actions: dayCounts[day] })));

      setLoading(false);
    };
    fetchAll();
  }, []);

  const todayIdx = (new Date().getDay() + 6) % 7;

  // Every stat block links to its respective management page
  const allStatCards = useMemo(() => [
    { id: "courses", label: "Total Courses", value: stats.courses, icon: BookOpen, gradient: "from-brand-primary to-brand-primary-dark", to: "/dashboard/admin/curriculum" },
    { id: "students", label: "Students", value: stats.students, icon: Users, gradient: "from-blue-600 to-blue-800", to: "/dashboard/admin/students" },
    { id: "faculty", label: "Faculty", value: stats.instructors, icon: GraduationCap, gradient: "from-emerald-500 to-emerald-700", to: "/dashboard/admin/teachers" },
    { id: "liveClasses", label: "Live Classes", value: stats.liveClasses, icon: Video, gradient: "from-purple-600 to-purple-800", to: "/dashboard/admin/live-classes" },
    { id: "batches", label: "Active Batches", value: stats.batches, icon: Layers, gradient: "from-sky-600 to-sky-800", to: "/dashboard/admin/batches" },
    { id: "pendingReviews", label: "Pending Reviews", value: 0, icon: Clock, gradient: "from-amber-500 to-orange-600", to: "/dashboard/admin/approvals" },
    { id: "ungraded", label: "Ungraded", value: 0, icon: ClipboardList, gradient: "from-red-600 to-red-800", to: "/dashboard/admin/assignments" },
    { id: "feedback", label: "Recent Feedback", value: 0, icon: Star, gradient: "from-brand-gold-dark to-brand-gold", to: "/dashboard/admin/feedback" },
    { id: "facultyCourses", label: "Faculty's Courses", value: stats.courses, icon: BookOpen, gradient: "from-teal-600 to-teal-800", to: "/dashboard/admin/curriculum?tab=faculty-courses" },
    { id: "curriculum", label: "Curriculum", value: stats.curriculumModules, icon: LayoutGrid, gradient: "from-indigo-600 to-indigo-800", to: "/dashboard/admin/curriculum" },
  ], [stats]);

  const statCards = allStatCards.filter(c => isVisible(c.id));

  // Quick actions registry — counts shown only for unread/pending items
  const allQuickActions = useMemo(() => ([
    { id: "verification", label: "Verification", icon: ShieldCheck, to: "/dashboard/admin/verification", count: stats.pendingVerifications },
    { id: "assignments", label: "Assignments", icon: ClipboardList, to: "/dashboard/admin/assignments", count: stats.ungradedSubmissions },
    { id: "inquiries", label: "Inquiries", icon: Mail, to: "/dashboard/admin/inquiries", count: stats.pendingInquiries },
    { id: "batches", label: "Manage Batches", icon: Layers, to: "/dashboard/admin/batches", count: 0 },
    { id: "users", label: "Manage Users", icon: Users, to: "/dashboard/admin/students", count: 0 },
    { id: "faculty", label: "Manage Faculty", icon: GraduationCap, to: "/dashboard/admin/teachers", count: 0 },
    { id: "curriculum", label: "Manage Curriculum", icon: LayoutGrid, to: "/dashboard/admin/curriculum", count: 0 },
    { id: "liveClasses", label: "Live Classes", icon: Video, to: "/dashboard/admin/live-classes", count: 0 },
    { id: "events", label: "Events", icon: Star, to: "/dashboard/admin/events", count: 0 },
    { id: "feedback", label: "Feedback", icon: Star, to: "/dashboard/admin/feedback", count: 0 },
    { id: "approvals", label: "Review Submissions", icon: Clock, to: "/dashboard/admin/approvals", count: 0 },
    { id: "schedule", label: "Schedule", icon: Clock, to: "/dashboard/admin/schedule", count: 0 },
    ...(isSuperAdmin ? [{ id: "messages", label: "Message Monitor", icon: Mail, to: "/dashboard/admin/messages", count: stats.unreadMessages }] : []),
  ]), [stats, isSuperAdmin]);

  const quickActions = allQuickActions.filter(a => visibleActions.includes(a.id));
  const availableActions = allQuickActions.filter(a => !visibleActions.includes(a.id));


  const RemoveButton = ({ id, label }: { id: string; label: string }) => (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeBlock(id); }}
      aria-label={`Remove ${label} from Overview`}
      title={`Remove ${label} from Overview`}
      className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-white/90 border border-brand-parchment text-brand-warm-grey hover:text-brand-primary hover:border-brand-gold/60 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shadow-sm"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-6 pt-2">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const availableBlocks = BLOCK_REGISTRY.filter(b => !isVisible(b.id));

  return (
    <div className="space-y-6 pt-2">
      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-brand-primary-dark to-[#3a0a0e] p-6 md:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-gold/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-brand-gold" />
            <span className="text-brand-gold text-xs font-semibold uppercase tracking-widest">Admin Dashboard</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Welcome Back, Administrator</h1>
          <p className="text-white/70 text-sm mt-1.5 max-w-md">Monitor platform health, manage users, and oversee all institutional operations from one place.</p>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-brand-gold text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{stats.pendingVerifications} pending verification{stats.pendingVerifications !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 text-xs">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>{stats.ungradedSubmissions} ungraded</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{stats.students} total students</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Customize bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-brand-warm-grey uppercase tracking-wider">
          {visibleBlocks.length} block{visibleBlocks.length !== 1 ? "s" : ""} on your overview
        </p>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl border-brand-gold/50 text-brand-primary hover:bg-brand-cream">
              <Plus className="w-4 h-4 mr-1.5" /> Add Block
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-brand-primary">Customize Overview</DialogTitle>
              <DialogDescription>
                Add blocks to your Overview page. Removing a block only hides it here — the section stays available in the Admin panel.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {(["Stat Cards", "Sections"] as const).map(group => {
                const groupBlocks = BLOCK_REGISTRY.filter(b => b.group === group);
                if (groupBlocks.length === 0) return null;
                return (
                  <div key={group}>
                    <p className="text-[10px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-2">{group}</p>
                    <div className="space-y-1.5">
                      {groupBlocks.map(b => {
                        const added = isVisible(b.id);
                        return (
                          <div key={b.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl border border-brand-parchment">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center shrink-0">
                              <b.icon className="w-3.5 h-3.5 text-brand-gold" />
                            </div>
                            <span className="text-sm font-medium text-brand-charcoal-mid flex-1 min-w-0 truncate">{b.label}</span>
                            {added ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Added
                                </span>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-brand-warm-grey hover:text-brand-primary"
                                  onClick={() => removeBlock(b.id)}>
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" className="h-7 text-xs rounded-lg" onClick={() => addBlock(b.id)}>
                                <Plus className="w-3 h-3 mr-1" /> Add
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {availableBlocks.length === 0 && (
                <p className="text-xs text-brand-warm-grey text-center py-2">All available blocks are already on your Overview.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {visibleBlocks.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-brand-parchment p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-cream mx-auto flex items-center justify-center mb-3">
            <LayoutGrid className="w-5 h-5 text-brand-gold" />
          </div>
          <p className="font-serif text-brand-primary">Your Overview is empty</p>
          <p className="text-xs text-brand-warm-grey mt-1">Use “Add Block” to bring sections back.</p>
        </div>
      )}

      {/* Stats Grid — every card is clickable */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="relative group">
              <RemoveButton id={s.id} label={s.label} />
              <button
                type="button"
                onClick={() => navigate(s.to)}
                className="w-full text-left group relative bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                aria-label={`Open ${s.label}`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brand-gold/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <p className="font-serif text-3xl font-bold text-brand-primary mt-3">{s.value}</p>
                <p className="text-[11px] text-brand-warm-grey uppercase tracking-wider mt-1">{s.label}</p>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Middle row */}
      {(isVisible("activity") || isVisible("quickActions")) && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Platform Activity */}
          {isVisible("activity") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className={`${isVisible("quickActions") ? "lg:col-span-2" : "lg:col-span-5"} relative group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300`}>
              <RemoveButton id="activity" label="Platform Activity" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-brand-primary">Platform Activity</h3>
                </div>
                <span className="text-[11px] text-brand-warm-grey uppercase tracking-wider mr-7">This Week</span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={activityData} barCategoryGap="25%">
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8C7B6B' }} />
                  <Tooltip formatter={(v: number) => [`${v}`, 'Actions']} cursor={false}
                    contentStyle={{ borderRadius: 12, border: '1px solid #EDE3CC', fontSize: 12 }} />
                  <Bar dataKey="actions" radius={[6, 6, 0, 0]}>
                    {activityData.map((_, i) => (
                      <Cell key={i} fill={i === todayIdx ? '#7D1E24' : '#C49A3C'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Quick Actions — counts shown only for unread/pending items */}
          {isVisible("quickActions") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className={`${isVisible("activity") ? "lg:col-span-3" : "lg:col-span-5"} relative group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300`}>
              <RemoveButton id="quickActions" label="Quick Actions" />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-brand-primary">Quick Actions</h3>
                <Dialog open={actionsOpen} onOpenChange={setActionsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto mr-7 h-7 text-xs rounded-xl border-brand-gold/50 text-brand-primary hover:bg-brand-cream">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Edit Actions
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-brand-primary">Customize Quick Actions</DialogTitle>
                      <DialogDescription>
                        Choose which actions appear here. Removing an action only hides it from this block — the section stays available in the Admin panel.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1">
                      {allQuickActions.map(a => {
                        const added = visibleActions.includes(a.id);
                        return (
                          <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-brand-parchment">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center shrink-0">
                              <a.icon className="w-3.5 h-3.5 text-brand-gold" />
                            </div>
                            <span className="text-sm font-medium text-brand-charcoal-mid flex-1 min-w-0 truncate">{a.label}</span>
                            {added ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Added
                                </span>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-brand-warm-grey hover:text-brand-primary"
                                  onClick={() => removeAction(a.id)}>
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" className="h-7 text-xs rounded-lg" onClick={() => addAction(a.id)}>
                                <Plus className="w-3 h-3 mr-1" /> Add
                              </Button>
                            )}
                          </div>
                        );
                      })}
                      {availableActions.length === 0 && (
                        <p className="text-xs text-brand-warm-grey text-center py-2">All available actions are already added.</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {quickActions.map((action) => (
                  <div key={action.id} className="relative group/action">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeAction(action.id); }}
                      aria-label={`Remove ${action.label} from Quick Actions`}
                      title={`Remove ${action.label} from Quick Actions`}
                      className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-white border border-brand-parchment text-brand-warm-grey hover:text-brand-primary hover:border-brand-gold/60 flex items-center justify-center opacity-0 group-hover/action:opacity-100 focus-visible:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <Link to={action.to}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-brand-parchment hover:bg-brand-cream hover:border-brand-gold/40 hover:-translate-y-0.5 transition-all duration-200 group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center group-hover:from-brand-gold/30 group-hover:to-brand-gold/10 transition-all">
                        <action.icon className="w-3.5 h-3.5 text-brand-gold" />
                      </div>
                      <span className="text-xs font-semibold text-brand-charcoal-mid group-hover:text-brand-primary transition-colors">{action.label}</span>
                      {action.count > 0 && (
                        <span className="ml-auto text-[10px] bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-1.5 py-0.5 rounded-full font-bold">{action.count}</span>
                      )}
                    </Link>
                  </div>
                ))}
                {quickActions.length === 0 && (
                  <p className="col-span-full text-xs text-brand-warm-grey text-center py-4">No actions selected. Use “Edit Actions” to add some.</p>
                )}
              </div>

            </motion.div>
          )}
        </div>
      )}

      {/* Live Classes — All */}
      {isVisible("liveClassesList") && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="relative group">
          <RemoveButton id="liveClassesList" label="Live Classes" />
          <LiveClassesBlock scope={{ kind: "admin" }} seeAllLink="/dashboard/admin/live-classes" />
        </motion.div>
      )}
    </div>
  );
};

export default AdminOverview;
