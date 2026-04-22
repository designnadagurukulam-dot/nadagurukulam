import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Trash2, FileText, PlayCircle, Headphones, Link as LinkIcon, Type, Library, Sparkles, FolderOpen } from "lucide-react";

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
  const [topicForm, setTopicForm] = useState({ title: "", type: "text", textContent: "", youtubeUrl: "", audioFile: null as File | null, pdfFile: null as File | null, linkUrl: "", rbtLevels: "", coMapping: "", hoursAllocated: "1", teachingMethodology: "" });

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
        rbt_levels: topicForm.rbtLevels || null,
        co_mapping: topicForm.coMapping || null,
        hours_allocated: Number(topicForm.hoursAllocated) || 1,
        teaching_methodology: topicForm.teachingMethodology || null,
      });
      if (error) throw error;

      if (topicForm.type === "link" && topicForm.linkUrl) {
        const { data: newSections } = await supabase.from("curriculum_sections").select("id").eq("module_id", moduleId).eq("title", topicForm.title).order("created_at", { ascending: false }).limit(1);
        if (newSections?.[0]) {
          await supabase.from("curriculum_section_links").insert({ section_id: newSections[0].id, url: topicForm.linkUrl, label: topicForm.title });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculum-sections-all"] });
      setAddTopicOpen(null);
      setTopicForm({ title: "", type: "text", textContent: "", youtubeUrl: "", audioFile: null, pdfFile: null, linkUrl: "", rbtLevels: "", coMapping: "", hoursAllocated: "1", teachingMethodology: "" });
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
      case "pdf": return <FileText className="h-4 w-4 text-primary" />;
      case "link": return <LinkIcon className="h-4 w-4 text-primary" />;
      default: return <Type className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderModuleGroup = (mods: any[], title: string, isOwn: boolean) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOwn ? <Sparkles className="h-5 w-5 text-accent" /> : <Library className="h-5 w-5 text-brand-primary" />}
          <h2 className="font-serif text-lg font-semibold text-brand-primary">{title}</h2>
        </div>
        {!isOwn && <Badge className="bg-muted text-muted-foreground border-border text-[10px] uppercase tracking-widest">View Only</Badge>}
      </div>
      {mods.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-7 w-7 text-accent" />
          </div>
          <h3 className="font-serif text-lg text-brand-primary mb-1">{isOwn ? "No Modules Yet" : "No Institution Modules"}</h3>
          <p className="text-sm text-muted-foreground">{isOwn ? "Click '+ New Module' to get started." : "No institution modules available."}</p>
        </motion.div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {mods.map((mod, idx) => {
            const modSections = getSectionsForModule(mod.id);
            return (
              <motion.div key={mod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <AccordionItem value={mod.id} className="bg-white rounded-2xl border border-border shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-accent" />
                      </div>
                      <span className="font-serif font-medium text-sm text-foreground">{mod.module_name}</span>
                      <Badge className="bg-primary/10 text-brand-primary border-0 text-[10px] font-semibold">{mod.course_code}</Badge>
                      {modSections.length > 0 && <Badge className="bg-accent/15 text-muted-foreground border-0 text-[10px]">{modSections.length} topics</Badge>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 space-y-3">
                    {mod.description && <p className="text-sm text-muted-foreground pl-11">{mod.description}</p>}
                    {modSections.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic pl-11">No content yet.</p>
                    ) : modSections.map(section => (
                      <div key={section.id} className="bg-muted rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {typeIcon(section.content_type)}
                            <span className="font-medium text-sm text-foreground">{section.title}</span>
                            <Badge className="bg-white text-muted-foreground border-border text-[10px] capitalize">{section.content_type}</Badge>
                          </div>
                          {canEditSection(section) && (
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7" onClick={() => deleteSection(section.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {section.content_type === "text" && section.text_content && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.text_content}</p>
                        )}
                        <div className="flex flex-wrap gap-1 pt-1">
                          <Badge variant="outline" className="text-[10px]">{section.rbt_levels || "RBT —"}</Badge>
                          <Badge variant="outline" className="text-[10px]">{section.co_mapping || "CO —"}</Badge>
                          <Badge variant="outline" className="text-[10px]">{section.hours_allocated || 0}h</Badge>
                          {section.teaching_methodology && <Badge variant="secondary" className="text-[10px]">{section.teaching_methodology}</Badge>}
                        </div>
                        {section.content_type === "audio" && section.audio_url && (
                          <AudioPlayer src={section.audio_url} title={section.title} />
                        )}
                        {section.pdf_url && (
                          <a href={section.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary underline flex items-center gap-1 hover:text-[#5C1219]">
                            <FileText className="h-3 w-3" /> View PDF
                          </a>
                        )}
                        {section.youtube_url && (
                          <div className="aspect-video rounded-xl overflow-hidden bg-[#EDE3CC]">
                            <iframe src={`https://www.youtube.com/embed/${section.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/)?.[1] || ""}`}
                              className="w-full h-full" allowFullScreen />
                          </div>
                        )}
                      </div>
                    ))}
                    {isOwn && (
                      <Button onClick={() => setAddTopicOpen(mod.id)} className="gap-1.5 text-xs bg-accent hover:bg-accent/90 text-foreground rounded-xl">
                        <Plus className="h-3 w-3" /> Add Topic
                      </Button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            );
          })}
        </Accordion>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-primary">Curriculum</h1>
          <div className="w-12 h-0.5 bg-accent mt-1" />
          <p className="text-muted-foreground mt-2 text-sm">Manage your teaching materials</p>
        </div>
        <Button onClick={() => setCreateModuleOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl">
          <Plus className="h-4 w-4" /> New Module
        </Button>
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
        <DialogContent className="max-w-md rounded-2xl border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary text-xl">Create Curriculum Module</DialogTitle>
            <div className="w-10 h-0.5 bg-accent" />
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Module Name</Label>
              <Input value={moduleForm.name} onChange={(e) => setModuleForm(p => ({ ...p, name: e.target.value }))} className="mt-1 rounded-xl border-border focus:border-[#C49A3C]" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Course Code</Label>
              <Input value={moduleForm.courseCode} onChange={(e) => setModuleForm(p => ({ ...p, courseCode: e.target.value }))} placeholder="Optional" className="mt-1 rounded-xl border-border focus:border-[#C49A3C]" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Tag to Batch</Label>
              <Select value={moduleForm.batchId} onValueChange={(v) => setModuleForm(p => ({ ...p, batchId: v }))}>
                <SelectTrigger className="mt-1 rounded-xl border-border"><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Description</Label>
              <Textarea value={moduleForm.description} onChange={(e) => setModuleForm(p => ({ ...p, description: e.target.value }))} className="mt-1 rounded-xl border-border focus:border-[#C49A3C]" />
            </div>
            <Button onClick={() => createModuleMutation.mutate()} disabled={!moduleForm.name || createModuleMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
              {createModuleMutation.isPending ? "Creating..." : "Create Module"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Topic Dialog */}
      <Dialog open={!!addTopicOpen} onOpenChange={() => setAddTopicOpen(null)}>
        <DialogContent className="max-w-md rounded-2xl border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary text-xl">Add Topic</DialogTitle>
            <div className="w-10 h-0.5 bg-accent" />
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Title</Label>
              <Input value={topicForm.title} onChange={(e) => setTopicForm(p => ({ ...p, title: e.target.value }))} className="mt-1 rounded-xl border-border focus:border-[#C49A3C]" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Type</Label>
              <Select value={topicForm.type} onValueChange={(v) => setTopicForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="mt-1 rounded-xl border-border"><SelectValue /></SelectTrigger>
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
              <div><Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Content</Label><Textarea value={topicForm.textContent} onChange={(e) => setTopicForm(p => ({ ...p, textContent: e.target.value }))} rows={4} className="mt-1 rounded-xl border-border focus:border-[#C49A3C]" /></div>
            )}
            {topicForm.type === "youtube" && (
              <div><Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">YouTube URL</Label><Input value={topicForm.youtubeUrl} onChange={(e) => setTopicForm(p => ({ ...p, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." className="mt-1 rounded-xl border-border focus:border-[#C49A3C]" /></div>
            )}
            {topicForm.type === "audio" && (
              <div><Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Audio File</Label><Input type="file" accept="audio/*" onChange={(e) => setTopicForm(p => ({ ...p, audioFile: e.target.files?.[0] || null }))} className="mt-1 border-border" /></div>
            )}
            {topicForm.type === "pdf" && (
              <div><Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">PDF File</Label><Input type="file" accept=".pdf" onChange={(e) => setTopicForm(p => ({ ...p, pdfFile: e.target.files?.[0] || null }))} className="mt-1 border-border" /></div>
            )}
            {topicForm.type === "link" && (
              <div><Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">URL</Label><Input value={topicForm.linkUrl} onChange={(e) => setTopicForm(p => ({ ...p, linkUrl: e.target.value }))} placeholder="https://..." className="mt-1" /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">RBT Level</Label><Input value={topicForm.rbtLevels} onChange={(e) => setTopicForm(p => ({ ...p, rbtLevels: e.target.value }))} placeholder="L1-L6" className="mt-1" /></div>
              <div><Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">CO Mapping</Label><Input value={topicForm.coMapping} onChange={(e) => setTopicForm(p => ({ ...p, coMapping: e.target.value }))} placeholder="CO1, CO2" className="mt-1" /></div>
              <div><Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Hours</Label><Input type="number" value={topicForm.hoursAllocated} onChange={(e) => setTopicForm(p => ({ ...p, hoursAllocated: e.target.value }))} className="mt-1" /></div>
              <div><Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Methodology</Label><Input value={topicForm.teachingMethodology} onChange={(e) => setTopicForm(p => ({ ...p, teachingMethodology: e.target.value }))} className="mt-1" /></div>
            </div>
            <Button onClick={() => addTopicOpen && addTopicMutation.mutate(addTopicOpen)} disabled={!topicForm.title || addTopicMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
              {addTopicMutation.isPending ? "Adding..." : "Add Topic"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorCurriculum;
