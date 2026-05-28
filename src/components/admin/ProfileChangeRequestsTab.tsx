import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Sparkles, UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const db = supabase as any;

const FIELD_LABELS: Record<string, string> = {
  display_name: "Full Name", phone: "Phone", date_of_birth: "Date of Birth", gender: "Gender",
  blood_group: "Blood Group", address: "Address", city: "City", state: "State", pincode: "Pincode",
  emergency_contact_name: "Emergency Contact Name", emergency_contact_phone: "Emergency Contact Phone", bio: "Bio",
  father_name: "Father's Name", father_occupation: "Father's Occupation", father_email: "Father's Email", father_phone: "Father's Phone",
  mother_name: "Mother's Name", mother_occupation: "Mother's Occupation", mother_email: "Mother's Email", mother_phone: "Mother's Phone",
  family_notes: "Family Notes",
};

const ProfileChangeRequestsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    setLoading(true);
    const { data: reqs } = await db
      .from("profile_change_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const userIds = [...new Set((reqs || []).map((r: any) => r.user_id))];
    const [{ data: profs }, { data: roles }] = await Promise.all([
      userIds.length ? db.from("profiles").select("user_id, display_name, email, enrollment_id").in("user_id", userIds) : { data: [] },
      userIds.length ? db.from("user_roles").select("user_id, role").in("user_id", userIds) : { data: [] },
    ]);
    const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
    const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
    const enriched = (reqs || []).map((r: any) => ({
      ...r,
      profile: profMap.get(r.user_id) || {},
      role: roleMap.get(r.user_id) || "student",
    }));
    setRequests(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (req: any, approve: boolean) => {
    try {
      if (approve) {
        const payload = { ...req.requested_changes };
        if (payload.year_of_commencement) payload.year_of_commencement = Number(payload.year_of_commencement);
        const { error: upErr } = await db.from("profiles").update(payload).eq("user_id", req.user_id);
        if (upErr) throw upErr;
      }
      const { error } = await db.from("profile_change_requests").update({
        status: approve ? "approved" : "rejected",
        reviewer_id: user?.id,
        reviewed_at: new Date().toISOString(),
        note: notes[req.id] || null,
      }).eq("id", req.id);
      if (error) throw error;
      logActivity(approve ? "profile_change.approved" : "profile_change.rejected", "profile_change_request", req.id, {
        user_id: req.user_id, fields: Object.keys(req.requested_changes || {}),
      });
      toast({ title: approve ? "Changes applied" : "Request rejected" });
      fetchRequests();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-brand-gold" />
        </div>
        <h3 className="font-serif text-2xl text-brand-primary mb-2">All Caught Up!</h3>
        <p className="text-sm text-brand-warm-grey">No pending profile edit requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((r, i) => {
        const changes = r.requested_changes || {};
        const keys = Object.keys(changes);
        return (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                    <UserPen className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-brand-primary">{r.profile.display_name || "Unnamed"}</h3>
                    <p className="text-xs text-brand-warm-grey">
                      {r.role} · {r.profile.email || "—"}{r.profile.enrollment_id ? ` · ${r.profile.enrollment_id}` : ""}
                    </p>
                    <p className="text-[11px] text-brand-warm-grey/80 mt-0.5">Submitted {new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 shrink-0 gap-1">
                  <Clock className="h-3 w-3" /> Pending
                </Badge>
              </div>

              <div className="rounded-xl border border-brand-parchment overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-brand-cream/60 text-[11px] uppercase tracking-wide text-brand-warm-grey">
                    <tr><th className="text-left p-2">Field</th><th className="text-left p-2">New value</th></tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => (
                      <tr key={k} className="border-t border-brand-parchment/60">
                        <td className="p-2 font-medium text-brand-charcoal/80">{FIELD_LABELS[k] || k}</td>
                        <td className="p-2 break-all">{changes[k] === null || changes[k] === "" ? <span className="text-brand-warm-grey italic">cleared</span> : String(changes[k])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Note (optional)</label>
                <Textarea value={notes[r.id] || ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} rows={2} className="rounded-xl border-brand-parchment focus:border-brand-gold" />
              </div>

              <div className="flex gap-3">
                <Button onClick={() => handleAction(r, true)} className="gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl">
                  <CheckCircle className="h-4 w-4" /> Approve & Apply
                </Button>
                <Button onClick={() => handleAction(r, false)} className="gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl">
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProfileChangeRequestsTab;
