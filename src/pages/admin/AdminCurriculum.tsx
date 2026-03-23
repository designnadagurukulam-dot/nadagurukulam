import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Plus, Trash2, PlayCircle, Type, Edit2, X, Save } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/);
  return match?.[1] ?? null;
};

const AdminCurriculum = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [contentType, setContentType] = useState<"youtube" | "text">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [textContent, setTextContent] = useState("");

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["curriculum-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_modules")
        .select("*")
        .order("semester")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["curriculum-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_sections")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addSection = useMutation({
    mutationFn: async (moduleId: string) => {
      const modSections = sections.filter((s) => s.module_id === moduleId);
      const { error } = await supabase.from("curriculum_sections").insert({
        module_id: moduleId,
        title: sectionTitle,
        content_type: contentType,
        youtube_url: contentType === "youtube" ? youtubeUrl : null,
        text_content: contentType === "text" ? textContent : null,
        sort_order: modSections.length + 1,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculum-sections"] });
      toast({ title: "Section added successfully" });
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteSection = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase.from("curriculum_sections").delete().eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculum-sections"] });
      toast({ title: "Section deleted" });
    },
  });

  const resetForm = () => {
    setAddingTo(null);
    setSectionTitle("");
    setContentType("youtube");
    setYoutubeUrl("");
    setTextContent("");
  };

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const getSubjectsForSemester = (sem: number) => {
    const semModules = modules.filter((m) => m.semester === sem);
    const subjects: Record<string, typeof semModules> = {};
    semModules.forEach((m) => {
      const key = `${m.course_code}-${m.subject_name}`;
      if (!subjects[key]) subjects[key] = [];
      subjects[key].push(m);
    });
    return Object.entries(subjects).map(([, mods]) => ({
      courseCode: mods[0].course_code,
      subjectName: mods[0].subject_name,
      modules: mods,
      totalHours: mods.reduce((sum, m) => sum + (m.hours || 0), 0),
    }));
  };

  const getSectionsForModule = (moduleId: string) =>
    sections.filter((s) => s.module_id === moduleId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Curriculum Management</h1>
        <p className="text-muted-foreground">Add sections and embed YouTube videos into curriculum modules.</p>
      </div>

      <Tabs defaultValue="1" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-xl mb-6">
          {semesters.map((s) => (
            <TabsTrigger
              key={s}
              value={String(s)}
              className="px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Sem {s}
            </TabsTrigger>
          ))}
        </TabsList>

        {semesters.map((sem) => (
          <TabsContent key={sem} value={String(sem)} className="space-y-6">
            {getSubjectsForSemester(sem).map((subject) => (
              <Card key={subject.courseCode} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg font-serif">{subject.subjectName}</CardTitle>
                      <Badge variant="secondary" className="mt-1">{subject.courseCode}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {subject.totalHours}h
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {subject.modules.map((mod) => {
                      const modSections = getSectionsForModule(mod.id);
                      return (
                        <AccordionItem key={mod.id} value={mod.id}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-4 w-4 text-secondary shrink-0" />
                              <span className="font-medium">{mod.module_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {modSections.length} section{modSections.length !== 1 ? "s" : ""}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pl-7 space-y-4">
                            {mod.description && (
                              <p className="text-muted-foreground text-sm">{mod.description}</p>
                            )}

                            {/* Existing sections */}
                            {modSections.map((section) => (
                              <div key={section.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {section.content_type === "youtube" ? (
                                      <PlayCircle className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <Type className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="font-medium text-sm">{section.title}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => deleteSection.mutate(section.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                {section.content_type === "youtube" && section.youtube_url && (
                                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${getYouTubeId(section.youtube_url)}`}
                                      className="w-full h-full"
                                      allowFullScreen
                                    />
                                  </div>
                                )}
                                {section.content_type === "text" && section.text_content && (
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.text_content}</p>
                                )}
                              </div>
                            ))}

                            {/* Add section form */}
                            {addingTo === mod.id ? (
                              <div className="border border-dashed rounded-lg p-4 space-y-3 bg-muted/30">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">New Section</span>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Input
                                  placeholder="Section title"
                                  value={sectionTitle}
                                  onChange={(e) => setSectionTitle(e.target.value)}
                                />
                                <Select value={contentType} onValueChange={(v) => setContentType(v as "youtube" | "text")}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="youtube">YouTube Video</SelectItem>
                                    <SelectItem value="text">Text Content</SelectItem>
                                  </SelectContent>
                                </Select>
                                {contentType === "youtube" ? (
                                  <>
                                    <Input
                                      placeholder="YouTube URL (e.g. https://youtube.com/watch?v=...)"
                                      value={youtubeUrl}
                                      onChange={(e) => setYoutubeUrl(e.target.value)}
                                    />
                                    {youtubeUrl && getYouTubeId(youtubeUrl) && (
                                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                                        <iframe
                                          src={`https://www.youtube.com/embed/${getYouTubeId(youtubeUrl)}`}
                                          className="w-full h-full"
                                          allowFullScreen
                                        />
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <Textarea
                                    placeholder="Enter text content..."
                                    value={textContent}
                                    onChange={(e) => setTextContent(e.target.value)}
                                    rows={5}
                                  />
                                )}
                                <Button
                                  onClick={() => addSection.mutate(mod.id)}
                                  disabled={!sectionTitle || addSection.isPending}
                                  size="sm"
                                  className="gap-1.5"
                                >
                                  <Save className="h-4 w-4" />
                                  {addSection.isPending ? "Saving..." : "Save Section"}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => setAddingTo(mod.id)}
                              >
                                <Plus className="h-4 w-4" />
                                Add Section
                              </Button>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminCurriculum;
