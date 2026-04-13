import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Trash2, FileText, PlayCircle, Headphones, Link as LinkIcon, Type } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AudioPlayer from "@/components/AudioPlayer";

const TutorCurriculum = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [addTopicOpen, setAddTopicOpen] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({ name: "", courseCode: "", semester: "9", batchId: "", description: "" });
  const [topicForm, setTopicForm] = useState({ title: "", type: "text", textContent: "", youtubeUrl: "", audioFile: null as File | null, pdfFile: null as File | null, linkUrl: "" });

  const { data: batches = [] } = useQuery({
    queryKey: ["tutor-batches", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("batches").select("id, name").eq("instructor_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["curriculum-modules-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("curriculum_modules").select("*").order("semester").order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["curriculum-sections-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("curriculum_sections").select("*").order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  // Separate own modules from institution modules
  // We check created_by on sections, and for modules we check if any section was created by this tutor
  // For simplicity: modules created by admin have no created_by on their sections, tutor-created ones do
  // Actually we need a way to identify. Let's use batch_id — if module has batch_id matching tutor's batch, it's theirs
  const myBatchIds = new Set(batches.map(b => b.id));
  const myModules = modules.filter(m => m.batch_id && myBatchIds.has(m.batch_id));
  const institutionModules = modules.filter(m => !m.batch_id || !myBatchIds.has(m.batch_id));

  const getSectionsForModule = (moduleId: string) => sections.filter(s => s.module_id === moduleId);

  const createModuleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("curriculum_modules").insert({
        module_name: moduleForm.name,
        course_code: moduleForm.courseCode || "CUSTOM",
        semester: parseInt(moduleForm.semester),
        batch_id: moduleForm.batchId || null,
        description: moduleForm.description || null,
        subject_name: moduleForm.name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculum-modules-all"] });
      setCreateModuleOpen(false);
      setModuleForm({ name: "", courseCode: "", semester: "9", batchId: "", description: "" });
      toast.success("Module created!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addTopicMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      let audio_url = null, pdf_url = null;
      if (topicForm.audioFile) {
        const path = `audio/${user!.id}/${Date.now()}_${topicForm.audioFile.name}`;
        const { error } = await supabase.storage.from("curriculum-materials").upload(path, topicForm.audioFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("curriculum-materials").getPublicUrl(path);
        audio_url = urlData.publicUrl;
      }
      if (topicForm.pdfFile) {
        const path = `pdfs/${user!.id}/${Date.now()}_${topicForm.pdfFile.name}`;
        const { error } = await supabase.storage.from("curriculum-materials").upload(path, topicForm.pdfFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("curriculum-materials").getPublicUrl(path);
        pdf_url = urlData.publicUrl;
      }
      const { error } = await supabase.from("curriculum_sections").insert({
        module_id: moduleId,
        title: topicForm.title,
        content_type: topicForm.type,
        text_content: topicForm.textContent || null,
        youtube_url: topicForm.youtubeUrl || null,
        audio_url,
        pdf_url,
        created_by: user!.id,
      });
      if (error) throw error;

      // If link type, add to links table
      if (topicForm.type === "link" && topicForm.linkUrl) {
        // get the section we just created
        const { data: newSections } = await supabase.from("curriculum_sections").select("id").eq("module_id", moduleId).eq("title", topicForm.title).order("created_at", { ascending: false }).limit(1);
        if (newSections?.[0]) {
          await supabase.from("curriculum_section_links").insert({ section_id: newSections[0].id, url: topicForm.linkUrl, label: topicForm.title });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculum-sections-all"] });
      setAddTopicOpen(null);
      setTopicForm({ title: "", type: "text", textContent: "", youtubeUrl: "", audioFile: null, pdfFile: null, linkUrl: "" });
      toast.success("Topic added!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteSection = async (id: string) => {
    const { error } = await supabase.from("curriculum_sections").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { queryClient.invalidateQueries({ queryKey: ["curriculum-sections-all"] }); toast.success("Deleted"); }
  };

  const canEditSection = (section: any) => section.created_by === user?.id;

  const typeIcon = (type: string) => {
    switch (type) {
      case "youtube": return <PlayCircle className="h-4 w-4 text-red-500" />;
      case "audio": return <Headphones className="h-4 w-4 text-accent" />;
      case "pdf": return <FileText className="h-4 w-4 text-blue-500" />;
      case "link": return <LinkIcon className="h-4 w-4 text-primary" />;
      default: return <Type className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderModuleGroup = (mods: any[], title: string, isOwn: boolean) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-foreground">{title}</h2>
        {!isOwn && <Badge variant="outline" className="text-xs">View Only</Badge>}
      </div>
      {mods.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">
          {isOwn ? "No modules created yet. Click '+ New Module' to get started." : "No institution modules available."}
        </CardContent></Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {mods.map(mod => {
            const modSections = getSectionsForModule(mod.id);
            return (
              <AccordionItem key={mod.id} value={mod.id} className="border rounded-xl overflow-hidden">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-accent shrink-0" />
                    <span className="font-medium text-sm">{mod.module_name}</span>
                    <Badge variant="secondary" className="text-[10px]">{mod.course_code}</Badge>
                    {modSections.length > 0 && <Badge variant="outline" className="text-[10px]">{modSections.length} topics</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-3">
                  {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}
                  {modSections.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No content yet.</p>
                  ) : modSections.map(section => (
                    <div key={section.id} className="border rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {typeIcon(section.content_type)}
                          <span className="font-medium text-sm">{section.title}</span>
                          <Badge variant="outline" className="text-[10px] capitalize">{section.content_type}</Badge>
                        </div>
                        {canEditSection(section) && (
                          <Button variant="ghost" size="sm" className="text-destructive h-7" onClick={() => deleteSection(section.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {section.content_type === "text" && section.text_content && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.text_content}</p>
                      )}
                      {section.content_type === "audio" && section.audio_url && (
                        <AudioPlayer src={section.audio_url} title={section.title} />
                      )}
                      {section.pdf_url && (
                        <a href={section.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1">
                          <FileText className="h-3 w-3" /> View PDF
                        </a>
                      )}
                      {section.youtube_url && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <iframe src={`https://www.youtube.com/embed/${section.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/)?.[1] || ""}`}
                            className="w-full h-full" allowFullScreen />
                        </div>
                      )}
                    </div>
                  ))}
                  {isOwn && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setAddTopicOpen(mod.id)}>
                      <Plus className="h-3 w-3" /> Add Topic
                    </Button>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Curriculum</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your teaching materials</p>
        </div>
        <Button onClick={() => setCreateModuleOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> New Module</Button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-8">
          {renderModuleGroup(myModules, "My Modules", true)}
          {renderModuleGroup(institutionModules, "Institution Modules", false)}
        </div>
      )}

      {/* Create Module Dialog */}
      <Dialog open={createModuleOpen} onOpenChange={setCreateModuleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Curriculum Module</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs uppercase tracking-widest">Module Name</Label><Input value={moduleForm.name} onChange={(e) => setModuleForm(p => ({ ...p, name: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs uppercase tracking-widest">Course Code</Label><Input value={moduleForm.courseCode} onChange={(e) => setModuleForm(p => ({ ...p, courseCode: e.target.value }))} placeholder="Optional" className="mt-1 rounded-xl" /></div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Tag to Batch</Label>
              <Select value={moduleForm.batchId} onValueChange={(v) => setModuleForm(p => ({ ...p, batchId: v }))}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs uppercase tracking-widest">Description</Label><Textarea value={moduleForm.description} onChange={(e) => setModuleForm(p => ({ ...p, description: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <Button onClick={() => createModuleMutation.mutate()} disabled={!moduleForm.name || createModuleMutation.isPending} className="w-full">
              {createModuleMutation.isPending ? "Creating..." : "Create Module"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Topic Dialog */}
      <Dialog open={!!addTopicOpen} onOpenChange={() => setAddTopicOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Topic</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs uppercase tracking-widest">Title</Label><Input value={topicForm.title} onChange={(e) => setTopicForm(p => ({ ...p, title: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Type</Label>
              <Select value={topicForm.type} onValueChange={(v) => setTopicForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="youtube">YouTube Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="link">External Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {topicForm.type === "text" && (
              <div><Label className="text-xs uppercase tracking-widest">Content</Label><Textarea value={topicForm.textContent} onChange={(e) => setTopicForm(p => ({ ...p, textContent: e.target.value }))} rows={4} className="mt-1 rounded-xl" /></div>
            )}
            {topicForm.type === "youtube" && (
              <div><Label className="text-xs uppercase tracking-widest">YouTube URL</Label><Input value={topicForm.youtubeUrl} onChange={(e) => setTopicForm(p => ({ ...p, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." className="mt-1 rounded-xl" /></div>
            )}
            {topicForm.type === "audio" && (
              <div><Label className="text-xs uppercase tracking-widest">Audio File</Label><Input type="file" accept="audio/*" onChange={(e) => setTopicForm(p => ({ ...p, audioFile: e.target.files?.[0] || null }))} className="mt-1" /></div>
            )}
            {topicForm.type === "pdf" && (
              <div><Label className="text-xs uppercase tracking-widest">PDF File</Label><Input type="file" accept=".pdf" onChange={(e) => setTopicForm(p => ({ ...p, pdfFile: e.target.files?.[0] || null }))} className="mt-1" /></div>
            )}
            {topicForm.type === "link" && (
              <div><Label className="text-xs uppercase tracking-widest">URL</Label><Input value={topicForm.linkUrl} onChange={(e) => setTopicForm(p => ({ ...p, linkUrl: e.target.value }))} placeholder="https://..." className="mt-1 rounded-xl" /></div>
            )}
            <Button onClick={() => addTopicOpen && addTopicMutation.mutate(addTopicOpen)} disabled={!topicForm.title || addTopicMutation.isPending} className="w-full">
              {addTopicMutation.isPending ? "Adding..." : "Add Topic"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorCurriculum;
