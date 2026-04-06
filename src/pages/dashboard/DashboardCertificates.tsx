import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Download, ExternalLink, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";

interface Certificate {
  id: string;
  course_id: string;
  awarded_at: string;
  certificate_url: string | null;
  course_title?: string;
}

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
    const { data } = await supabase
      .from("certificates")
      .select("id, course_id, awarded_at, certificate_url")
      .eq("user_id", user.id)
      .order("awarded_at", { ascending: false });

    if (data && data.length > 0) {
      const courseIds = data.map((c) => c.course_id);
      const { data: courses } = await supabase.from("courses").select("id, title").in("id", courseIds);
      const courseMap = Object.fromEntries((courses || []).map((c) => [c.id, c.title]));
      setCertificates(data.map((c) => ({ ...c, course_title: courseMap[c.course_id] || "Unknown Course" })));
    } else {
      setCertificates([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCertificates(); }, [user]);

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("student-certificates").upload(filePath, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Certificate uploaded successfully" });
      logActivity("certificate.uploaded", "certificate", undefined, { filename: file.name });
      setUploadOpen(false);
      setFile(null);
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Certificates</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your earned certificates and achievements</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Upload Certificate</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload External Certificate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Upload a scanned copy of your external certificate</p>
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Button onClick={handleUpload} className="w-full" disabled={uploading || !file}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {certificates.length === 0 ? (
        <Card className="text-center p-12 border-0 shadow-md">
          <Award className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-serif text-xl text-foreground">No certificates yet</h3>
          <p className="text-muted-foreground mt-2">Complete a course to earn your first certificate!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert, i) => (
            <motion.div key={cert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-500 border-0 shadow-md group">
                <div className="relative h-44 flex items-center justify-center overflow-hidden"
                  style={{ background: "linear-gradient(135deg, hsl(358 68% 25%) 0%, hsl(358 68% 18%) 100%)" }}>
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
                  }} />
                  <div className="absolute inset-3 border-2 border-secondary/30 rounded-lg" />
                  <div className="absolute inset-5 border border-secondary/15 rounded-lg" />
                  <Award className="h-16 w-16 text-secondary group-hover:scale-110 transition-transform duration-500 drop-shadow-lg" style={{ filter: "drop-shadow(0 0 20px hsl(33 62% 58% / 0.3))" }} />
                </div>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-serif text-lg font-bold text-foreground">{cert.course_title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>Awarded: {new Date(cert.awarded_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 pt-3">
                    {cert.certificate_url && (
                      <Button size="sm" variant="outline" className="gap-1.5 border-secondary/30 hover:border-secondary hover:bg-secondary/5" asChild>
                        <a href={cert.certificate_url} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /> Download</a>
                      </Button>
                    )}
                    {cert.certificate_url && (
                      <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" asChild>
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
