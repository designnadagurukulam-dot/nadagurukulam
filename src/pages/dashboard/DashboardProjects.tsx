import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, Trash2, Upload, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";

interface Project { id: string; title: string; description: string | null; subject: string | null; file_url: string | null; created_at: string; }

const DashboardProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchProjects = async () => {
    if (!user) return;
    const { data } = await supabase.from("student_projects").select("*").eq("student_id", user.id).order("created_at", { ascending: false });
    setProjects((data as Project[]) || []); setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const handleCreate = async () => {
    if (!title || !user) { toast({ title: "Please enter a project title", variant: "destructive" }); return; }
    setUploading(true);
    let fileUrl: string | null = null;
    if (file) {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("student-projects").upload(filePath, file);
      if (uploadErr) { toast({ title: "File upload failed", description: uploadErr.message, variant: "destructive" }); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("student-projects").getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from("student_projects").insert({ student_id: user.id, title, description: description || null, subject: subject || null, file_url: fileUrl });
    setUploading(false);
    if (error) { toast({ title: "Failed to create project", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Project created!" }); logActivity("project.created", "student_project", undefined, { title }); setDialogOpen(false); setTitle(""); setDescription(""); setSubject(""); setFile(null); fetchProjects(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("student_projects").delete().eq("id", id);
    logActivity("project.deleted", "student_project", id); toast({ title: "Project deleted" }); fetchProjects();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-primary">My Projects</h1>
          <div className="w-12 h-0.5 bg-brand-gold mt-1" />
          <p className="text-brand-warm-grey mt-2 text-sm">Manage your personal projects and presentations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl"><Plus className="h-4 w-4" /> New Project</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-brand-parchment">
            <DialogHeader><DialogTitle className="font-serif text-brand-primary">Create New Project</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" className="border-brand-parchment rounded-xl focus:border-brand-gold" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Subject</label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Carnatic Vocal" className="border-brand-parchment rounded-xl focus:border-brand-gold" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your project..." rows={3} className="rounded-xl border-brand-parchment focus:border-brand-gold" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Attach File</label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border-brand-parchment rounded-xl" />
              </div>
              <Button onClick={handleCreate} className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl" disabled={uploading}>
                {uploading ? "Uploading..." : "Create Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {projects.length === 0 ? (
        <Card className="text-center p-12 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <div className="w-16 h-16 rounded-full bg-brand-gold-pale flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-8 w-8 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl text-brand-primary">No projects yet</h3>
          <p className="text-brand-warm-grey mt-2">Create your first project or presentation</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-brand-charcoal-mid">{p.title}</h3>
                      {p.subject && <span className="text-xs text-brand-gold font-medium">{p.subject}</span>}
                      {p.description && <p className="text-sm text-brand-warm-grey mt-2">{p.description}</p>}
                      <p className="text-xs text-brand-warm-grey mt-2">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1">
                      {p.file_url && (
                        <Button variant="ghost" size="icon" className="hover:bg-brand-gold-pale" asChild>
                          <a href={p.file_url} target="_blank" rel="noreferrer"><FileText className="h-4 w-4 text-brand-primary" /></a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="hover:bg-red-50">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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

export default DashboardProjects;
