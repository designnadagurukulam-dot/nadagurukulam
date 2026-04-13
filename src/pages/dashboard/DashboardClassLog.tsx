import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookCheck, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";

interface ClassLogWithConfirmation {
  id: string; topic_covered: string; date: string; notes: string | null;
  status: string; instructor_id: string; confirmation_id: string | null; confirmed: boolean;
}

const DashboardClassLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ClassLogWithConfirmation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    const { data: classLogs } = await supabase.from("class_logs").select("*").order("date", { ascending: false });
    if (!classLogs || classLogs.length === 0) { setLogs([]); setLoading(false); return; }
    const { data: confirmations } = await supabase.from("class_log_confirmations").select("*").eq("student_id", user.id);
    const confirmMap = new Map((confirmations || []).map((c) => [c.class_log_id, c]));
    const combined = classLogs.map((log) => {
      const conf = confirmMap.get(log.id);
      return { id: log.id, topic_covered: log.topic_covered, date: log.date, notes: log.notes, status: log.status,
        instructor_id: log.instructor_id, confirmation_id: conf?.id || null, confirmed: conf?.confirmed || false };
    });
    setLogs(combined); setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleConfirm = async (logId: string) => {
    if (!user) return;
    const existing = logs.find((l) => l.id === logId);
    if (existing?.confirmation_id) {
      await supabase.from("class_log_confirmations").update({ confirmed: true, confirmed_at: new Date().toISOString() }).eq("id", existing.confirmation_id);
    } else {
      await supabase.from("class_log_confirmations").insert({ class_log_id: logId, student_id: user.id, confirmed: true, confirmed_at: new Date().toISOString() });
    }
    logActivity("class_log.confirmed", "class_log", logId);
    toast({ title: "Class confirmed!" }); fetchData();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-semibold text-brand-primary">Class Confirmations</h1>
        <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        <p className="text-brand-warm-grey mt-2 text-sm">Confirm topics covered in your classes</p>
      </motion.div>

      {logs.length === 0 ? (
        <Card className="text-center p-12 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <div className="w-16 h-16 rounded-full bg-brand-gold-pale flex items-center justify-center mx-auto mb-4">
            <BookCheck className="h-8 w-8 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl text-brand-primary">No class logs to confirm</h3>
          <p className="text-brand-warm-grey mt-2">Your educators will log classes here for your confirmation</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-brand-charcoal-mid">{log.topic_covered}</h3>
                      {log.notes && <p className="text-xs text-brand-warm-grey mt-1">{log.notes}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-brand-warm-grey">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{log.date}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {log.confirmed ? (
                        <Badge className="bg-green-50 text-green-700 border-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmed
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleConfirm(log.id)} className="gap-1 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardClassLog;
