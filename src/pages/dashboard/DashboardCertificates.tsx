import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Download, ExternalLink, Upload, Trophy, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";

interface Certificate { id: string; course_id: string; awarded_at: string; certificate_url: string | null; course_title?: string; }

const DashboardCertificates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const fetchCertificates = async () => {
    if (!user) return;
    const { data } = await supabase.from("certificates").select("id, course_id, awarded_at, certificate_url").eq("user_id", user.id).order("awarded_at", { ascending: false });
    if (data && data.length > 0) {
      const courseIds = data.map((c) => c.course_id);
      const { data: courses } = await supabase.from("courses").select("id, title").in("id", courseIds);
      const courseMap = Object.fromEntries((courses || []).map((c) => [c.id, c.title]));
      setCertificates(data.map((c) => ({ ...c, course_title: courseMap[c.course_id] || "Unknown Course" })));
    } else { setCertificates([]); }
    setLoading(false);
  };

  useEffect(() => { fetchCertificates(); }, [user]);

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("student-certificates").upload(filePath, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Certificate uploaded successfully" }); logActivity("certificate.uploaded", "certificate", undefined, { filename: file.name }); setUploadOpen(false); setFile(null); }
    setUploading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">Certificates</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
            <p className="text-brand-warm-grey mt-1 text-xs sm:text-sm">Your earned certificates and achievements</p>
          </div>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-gold-pale rounded-xl w-full sm:w-auto min-h-[44px]"><Upload className="h-4 w-4" /> Upload</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-brand-parchment max-w-[95vw] sm:max-w-md">
            <DialogHeader><DialogTitle className="font-serif text-brand-primary">Upload External Certificate</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-brand-warm-grey">Upload a scanned copy of your external certificate</p>
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border-brand-parchment rounded-xl h-11" />
              <Button onClick={handleUpload} className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl min-h-[44px]" disabled={uploading || !file}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {certificates.length === 0 ? (
        <Card className="text-center p-8 sm:p-12 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-brand-gold" />
          </div>
          <h3 className="font-serif text-lg sm:text-xl text-brand-primary">No certificates yet</h3>
          <p className="text-brand-warm-grey mt-2 text-xs sm:text-sm">Complete a course to earn your first certificate! 🏆</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {certificates.map((cert, i) => (
            <motion.div key={cert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="overflow-hidden hover:shadow-[0_8px_40px_rgba(196,154,60,0.2)] transition-all duration-500 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] group">
                <div className="relative h-36 sm:h-44 flex items-center justify-center overflow-hidden bg-gradient-to-br from-brand-primary to-brand-primary-dark">
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
                  }} />
                  {/* Golden ribbon */}
                  <div className="absolute top-0 right-6 w-10 h-16 bg-gradient-to-b from-brand-gold to-brand-gold-light" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)" }} />
                  <div className="absolute inset-3 border-2 border-brand-gold/30 rounded-lg" />
                  <div className="absolute inset-5 border border-brand-gold/15 rounded-lg" />
                  <Award className="h-14 w-14 sm:h-16 sm:w-16 text-brand-gold group-hover:scale-110 transition-transform duration-500 drop-shadow-lg animate-pulse" style={{ animationDuration: "3s" }} />
                </div>
                <CardContent className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-brand-charcoal-mid">{cert.course_title}</h3>
                  <div className="text-[10px] sm:text-xs text-brand-warm-grey flex items-center gap-1.5">
                    <Award className="h-3 w-3 text-brand-gold" />
                    <span>Awarded: {new Date(cert.awarded_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 pt-2 sm:pt-3 flex-wrap">
                    {cert.certificate_url && (
                      <Button size="sm" className="gap-1.5 bg-gradient-to-r from-brand-gold to-brand-gold-light text-brand-charcoal hover:from-brand-gold-light hover:to-brand-gold rounded-xl flex-1 sm:flex-none min-h-[40px] text-xs font-bold" asChild>
                        <a href={cert.certificate_url} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /> Download</a>
                      </Button>
                    )}
                    {cert.certificate_url && (
                      <Button size="sm" variant="ghost" className="gap-1.5 text-brand-warm-grey hover:bg-brand-cream rounded-xl flex-1 sm:flex-none min-h-[40px] text-xs" asChild>
                        <a href={cert.certificate_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /> View</a>
                      </Button>
                    )}
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

export default DashboardCertificates;