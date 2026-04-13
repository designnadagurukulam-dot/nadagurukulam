import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, PlayCircle, Type, Link as LinkIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/);
  return match?.[1] ?? null;
};

const DashboardCurriculum = () => {
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
  const getLinksForSection = (sectionId: string) => sectionLinks.filter((l) => l.section_id === sectionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-brand-primary">My Curriculum</h1>
        <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        <p className="text-brand-warm-grey text-sm mt-2">Access your semester-wise curriculum and learning materials.</p>
      </div>

      <Tabs defaultValue="1" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-brand-cream-dark p-1.5 rounded-xl mb-6">
          {semesters.map((s) => (
            <TabsTrigger key={s} value={String(s)} className="px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">
              Sem {s}
            </TabsTrigger>
          ))}
          {hasAdditional && (
            <TabsTrigger value="9" className="px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey">
              Additional
            </TabsTrigger>
          )}
        </TabsList>

        {[...semesters, ...(hasAdditional ? [9] : [])].map((sem) => (
          <TabsContent key={sem} value={String(sem)} className="space-y-6">
            {sem === 9 && <p className="text-brand-warm-grey text-sm">Additional courses created by educators outside the standard 8-semester curriculum.</p>}
            {getSubjectsForSemester(sem).map((subject) => (
              <Card key={subject.courseCode} className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg font-serif text-brand-charcoal-mid">{subject.subjectName}</CardTitle>
                      <Badge className="mt-1 bg-brand-gold-pale text-brand-primary border-0">{subject.courseCode}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-brand-warm-grey">
                      <Clock className="h-4 w-4" /> {subject.totalHours}h
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {subject.modules.map((mod) => {
                      const modSections = getSectionsForModule(mod.id);
                      return (
                        <AccordionItem key={mod.id} value={mod.id} className="border-brand-parchment">
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-4 w-4 text-brand-gold shrink-0" />
                              <span className="font-medium text-brand-charcoal-mid">{mod.module_name}</span>
                              {modSections.length > 0 && (
                                <Badge className="text-xs bg-brand-cream-dark text-brand-warm-grey border-0">
                                  {modSections.length} section{modSections.length > 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pl-7 space-y-4">
                            {mod.description && <p className="text-brand-warm-grey text-sm">{mod.description}</p>}
                            {modSections.length === 0 ? (
                              <p className="text-sm text-brand-warm-grey italic">No content added yet.</p>
                            ) : (
                              modSections.map((section) => {
                                const secLinks = getLinksForSection(section.id);
                                const displayLinks = secLinks.length > 0
                                  ? secLinks
                                  : section.content_type === "youtube" && section.youtube_url
                                    ? [{ id: "legacy", section_id: section.id, url: section.youtube_url, label: null, sort_order: 0, created_at: "" }]
                                    : [];

                                return (
                                  <div key={section.id} className="border border-brand-parchment rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                      {section.content_type === "youtube" ? (
                                        <PlayCircle className="h-4 w-4 text-red-500" />
                                      ) : (
                                        <Type className="h-4 w-4 text-brand-warm-grey" />
                                      )}
                                      <span className="font-medium text-sm text-brand-charcoal-mid">{section.title}</span>
                                      {displayLinks.length > 1 && (
                                        <Badge className="text-xs bg-brand-cream-dark text-brand-warm-grey border-0">{displayLinks.length} links</Badge>
                                      )}
                                    </div>
                                    {displayLinks.map((link, idx) => (
                                      <div key={link.id || idx} className="space-y-1">
                                        {link.label && <p className="text-xs font-medium text-brand-warm-grey">{link.label}</p>}
                                        {getYouTubeId(link.url) ? (
                                          <div className="aspect-video rounded-xl overflow-hidden bg-brand-cream-dark">
                                            <iframe src={`https://www.youtube.com/embed/${getYouTubeId(link.url)}`} className="w-full h-full" allowFullScreen
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                                          </div>
                                        ) : (
                                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary underline flex items-center gap-1">
                                            <LinkIcon className="h-3 w-3" /> {link.label || link.url}
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                    {section.content_type === "text" && section.text_content && (
                                      <div className="text-sm text-brand-warm-grey whitespace-pre-wrap">{section.text_content}</div>
                                    )}
                                  </div>
                                );
                              })
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

export default DashboardCurriculum;
