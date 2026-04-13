import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Plus, Trash2, PlayCircle, Type, X, Save, Link as LinkIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/);
  return match?.[1] ?? null;
};

interface LinkEntry {
  url: string;
  label: string;
}

const AdminCurriculum = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [contentType, setContentType] = useState<"youtube" | "text">("youtube");
  const [links, setLinks] = useState<LinkEntry[]>([{ url: "", label: "" }]);
  const [textContent, setTextContent] = useState("");

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["curriculum-modules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("curriculum_modules").select("*").order("semester").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["curriculum-sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("curriculum_sections").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: sectionLinks = [] } = useQuery({
    queryKey: ["curriculum-section-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("curriculum_section_links").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addSection = useMutation({
    mutationFn: async (moduleId: string) => {
      const modSections = sections.filter((s) => s.module_id === moduleId);
      const validLinks = links.filter((l) => l.url.trim());
      const { data: newSection, error } = await supabase.from("curriculum_sections").insert({
        module_id: moduleId, title: sectionTitle, content_type: contentType,
        youtube_url: contentType === "youtube" && validLinks.length > 0 ? validLinks[0].url : null,
        text_content: contentType === "text" ? textContent : null,
        sort_order: modSections.length + 1, created_by: user?.id,
      }).select().single();
      if (error) throw error;
      if (contentType === "youtube" && validLinks.length > 0) {
        const linkRows = validLinks.map((l, i) => ({ section_id: newSection.id, url: l.url.trim(), label: l.label.trim() || null, sort_order: i }));
        const { error: linkErr } = await supabase.from("curriculum_section_links").insert(linkRows);
        if (linkErr) throw linkErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculum-sections"] });
      queryClient.invalidateQueries({ queryKey: ["curriculum-section-links"] });
      logActivity("curriculum.section_added", "curriculum_section", undefined, { title: sectionTitle });
      toast({ title: "Section added successfully" });
      resetForm();
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const deleteSection = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase.from("curriculum_sections").delete().eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: (_, sectionId) => {
      queryClient.invalidateQueries({ queryKey: ["curriculum-sections"] });
      queryClient.invalidateQueries({ queryKey: ["curriculum-section-links"] });
      logActivity("curriculum.section_deleted", "curriculum_section", sectionId);
      toast({ title: "Section deleted" });
    },
  });

  const resetForm = () => { setAddingTo(null); setSectionTitle(""); setContentType("youtube"); setLinks([{ url: "", label: "" }]); setTextContent(""); };
  const addLinkField = () => { setLinks([...links, { url: "", label: "" }]); };
  const removeLinkField = (index: number) => { if (links.length <= 1) return; setLinks(links.filter((_, i) => i !== index)); };
  const updateLink = (index: number, field: "url" | "label", value: string) => { const updated = [...links]; updated[index] = { ...updated[index], [field]: value }; setLinks(updated); };
  const getLinksForSection = (sectionId: string) => sectionLinks.filter((l) => l.section_id === sectionId);

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const hasAdditional = modules.some((m) => m.semester === 9);

  const getSubjectsForSemester = (sem: number) => {
    const semModules = modules.filter((m) => m.semester === sem);
    const subjects: Record<string, typeof semModules> = {};
    semModules.forEach((m) => { const key = `${m.course_code}-${m.subject_name}`; if (!subjects[key]) subjects[key] = []; subjects[key].push(m); });
    return Object.entries(subjects).map(([, mods]) => ({
      courseCode: mods[0].course_code, subjectName: mods[0].subject_name, modules: mods,
      totalHours: mods.reduce((sum, m) => sum + (m.hours || 0), 0),
    }));
  };

  const getSectionsForModule = (moduleId: string) => sections.filter((s) => s.module_id === moduleId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#7D1E24] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">Curriculum Management</h1>
        <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
        <p className="text-sm text-[#8C7B6B] mt-2">Add sections and embed YouTube videos into curriculum modules.</p>
      </div>

      <Tabs defaultValue="1" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-[#FAF6EE] border border-[#EDE3CC] p-1.5 rounded-xl mb-6">
          {semesters.map((s) => (
            <TabsTrigger key={s} value={String(s)} className="px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-[#7D1E24] data-[state=active]:text-white text-[#8C7B6B]">
              Sem {s}
            </TabsTrigger>
          ))}
          {hasAdditional && (
            <TabsTrigger value="9" className="px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-[#7D1E24] data-[state=active]:text-white text-[#8C7B6B]">
              Additional
            </TabsTrigger>
          )}
        </TabsList>

        {[...semesters, ...(hasAdditional ? [9] : [])].map((sem) => (
          <TabsContent key={sem} value={String(sem)} className="space-y-6">
            {getSubjectsForSemester(sem).map((subject) => (
              <div key={subject.courseCode} className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-serif text-lg text-[#7D1E24]">{subject.subjectName}</h3>
                      <Badge className="bg-[#F5E9CE] text-[#8B6914] border border-[#EDE3CC] mt-1">{subject.courseCode}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-[#8C7B6B]">
                      <Clock className="h-4 w-4 text-[#C49A3C]" /> {subject.totalHours}h
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <Accordion type="multiple" className="w-full">
                    {subject.modules.map((mod) => {
                      const modSections = getSectionsForModule(mod.id);
                      return (
                        <AccordionItem key={mod.id} value={mod.id} className="border-[#EDE3CC]">
                          <AccordionTrigger className="text-left hover:no-underline hover:bg-[#FAF6EE] px-3 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-[#F5E9CE] flex items-center justify-center">
                                <BookOpen className="h-3.5 w-3.5 text-[#C49A3C]" />
                              </div>
                              <span className="font-medium text-[#3D2E22]">{mod.module_name}</span>
                              <Badge className="bg-[#FAF6EE] text-[#8C7B6B] border border-[#EDE3CC] text-xs">
                                {modSections.length} section{modSections.length !== 1 ? "s" : ""}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pl-7 space-y-4 pt-2">
                            {mod.description && <p className="text-sm text-[#8C7B6B]">{mod.description}</p>}

                            {modSections.map((section) => {
                              const secLinks = getLinksForSection(section.id);
                              const displayLinks = secLinks.length > 0 ? secLinks
                                : section.content_type === "youtube" && section.youtube_url
                                  ? [{ id: "legacy", section_id: section.id, url: section.youtube_url, label: null, sort_order: 0, created_at: "" }]
                                  : [];
                              return (
                                <div key={section.id} className="border border-[#EDE3CC] rounded-xl p-4 space-y-3 bg-[#FAF6EE]/50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {section.content_type === "youtube" ? <PlayCircle className="h-4 w-4 text-red-500" /> : <Type className="h-4 w-4 text-[#8C7B6B]" />}
                                      <span className="font-medium text-sm text-[#3D2E22]">{section.title}</span>
                                      {displayLinks.length > 1 && <Badge className="bg-[#F5E9CE] text-[#8B6914] border border-[#EDE3CC] text-xs">{displayLinks.length} links</Badge>}
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 text-red-500" onClick={() => deleteSection.mutate(section.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {displayLinks.map((link, idx) => (
                                    <div key={link.id || idx} className="space-y-1">
                                      {link.label && <p className="text-xs font-medium text-[#8C7B6B]">{link.label}</p>}
                                      {getYouTubeId(link.url) ? (
                                        <div className="aspect-video rounded-xl overflow-hidden bg-[#EDE3CC]">
                                          <iframe src={`https://www.youtube.com/embed/${getYouTubeId(link.url)}`} className="w-full h-full" allowFullScreen />
                                        </div>
                                      ) : (
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#7D1E24] underline flex items-center gap-1">
                                          <LinkIcon className="h-3 w-3" /> {link.label || link.url}
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                  {section.content_type === "text" && section.text_content && (
                                    <p className="text-sm text-[#8C7B6B] whitespace-pre-wrap">{section.text_content}</p>
                                  )}
                                </div>
                              );
                            })}

                            {addingTo === mod.id ? (
                              <div className="border border-dashed border-[#C49A3C] rounded-xl p-4 space-y-3 bg-[#FAF6EE]">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm text-[#7D1E24]">New Section</span>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}><X className="h-4 w-4" /></Button>
                                </div>
                                <Input placeholder="Section title" value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} className="border-[#EDE3CC] rounded-xl focus:border-[#C49A3C]" />
                                <Select value={contentType} onValueChange={(v) => setContentType(v as "youtube" | "text")}>
                                  <SelectTrigger className="border-[#EDE3CC] rounded-xl"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="youtube">YouTube / Links</SelectItem>
                                    <SelectItem value="text">Text Content</SelectItem>
                                  </SelectContent>
                                </Select>
                                {contentType === "youtube" ? (
                                  <div className="space-y-3">
                                    {links.map((link, idx) => (
                                      <div key={idx} className="space-y-2 p-3 border border-[#EDE3CC] rounded-xl bg-white">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold">Link {idx + 1}</span>
                                          {links.length > 1 && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLinkField(idx)}><X className="h-3 w-3" /></Button>}
                                        </div>
                                        <Input placeholder="Label (optional)" value={link.label} onChange={(e) => updateLink(idx, "label", e.target.value)} className="border-[#EDE3CC] rounded-xl" />
                                        <Input placeholder="URL (YouTube or any link)" value={link.url} onChange={(e) => updateLink(idx, "url", e.target.value)} className="border-[#EDE3CC] rounded-xl" />
                                        {link.url && getYouTubeId(link.url) && (
                                          <div className="aspect-video rounded-xl overflow-hidden bg-[#EDE3CC]">
                                            <iframe src={`https://www.youtube.com/embed/${getYouTubeId(link.url)}`} className="w-full h-full" allowFullScreen />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" className="gap-1.5 border-[#EDE3CC] rounded-xl hover:bg-[#FAF6EE]" onClick={addLinkField}>
                                      <Plus className="h-4 w-4" /> Add Another Link
                                    </Button>
                                  </div>
                                ) : (
                                  <Textarea placeholder="Enter text content..." value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={5} className="border-[#EDE3CC] rounded-xl focus:border-[#C49A3C]" />
                                )}
                                <Button onClick={() => addSection.mutate(mod.id)} disabled={!sectionTitle || addSection.isPending} size="sm" className="gap-1.5 bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl">
                                  <Save className="h-4 w-4" /> {addSection.isPending ? "Saving..." : "Save Section"}
                                </Button>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" className="gap-1.5 border-[#EDE3CC] rounded-xl hover:bg-[#FAF6EE] text-[#7D1E24]" onClick={() => setAddingTo(mod.id)}>
                                <Plus className="h-4 w-4" /> Add Section
                              </Button>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminCurriculum;
