import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, PlayCircle, Headphones, FileText, Type, Link as LinkIcon, ChevronRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/);
  return match?.[1] ?? null;
};

type MaterialType = "videos" | "audio" | "pdfs" | "notes";

interface MaterialLink {
  id: string;
  section_id: string;
  url: string;
  label: string | null;
  sort_order: number;
  created_at: string;
}

const isAudioUrl = (url: string) => /\.(mp3|wav|ogg|aac|flac|m4a)/i.test(url);
const isPdfUrl = (url: string) => /\.pdf(\?|$)/i.test(url);

const classifyMaterials = (
  section: { content_type: string; youtube_url: string | null; text_content: string | null; audio_url: string | null; pdf_url: string | null },
  links: MaterialLink[]
) => {
  const materials: Record<MaterialType, { links: MaterialLink[]; textContent?: string }> = {
    videos: { links: [] },
    audio: { links: [] },
    pdfs: { links: [] },
    notes: { links: [], textContent: undefined },
  };

  // Classify links
  for (const link of links) {
    if (getYouTubeId(link.url)) {
      materials.videos.links.push(link);
    } else if (isAudioUrl(link.url)) {
      materials.audio.links.push(link);
    } else if (isPdfUrl(link.url)) {
      materials.pdfs.links.push(link);
    } else {
      // Generic external link — put under videos if youtube-type section, else pdfs
      if (section.content_type === "youtube") {
        materials.videos.links.push(link);
      } else {
        materials.pdfs.links.push(link);
      }
    }
  }

  // Legacy fields
  if (links.length === 0 && section.content_type === "youtube" && section.youtube_url) {
    materials.videos.links.push({
      id: "legacy-yt",
      section_id: "",
      url: section.youtube_url,
      label: null,
      sort_order: 0,
      created_at: "",
    });
  }
  if (section.audio_url) {
    materials.audio.links.push({
      id: "legacy-audio",
      section_id: "",
      url: section.audio_url,
      label: null,
      sort_order: 0,
      created_at: "",
    });
  }
  if (section.pdf_url) {
    materials.pdfs.links.push({
      id: "legacy-pdf",
      section_id: "",
      url: section.pdf_url,
      label: null,
      sort_order: 0,
      created_at: "",
    });
  }
  if (section.content_type === "text" && section.text_content) {
    materials.notes.textContent = section.text_content;
  }

  return materials;
};

const materialMeta: Record<MaterialType, { label: string; icon: typeof PlayCircle; color: string; bgActive: string; bgInactive: string }> = {
  videos: { label: "Videos", icon: PlayCircle, color: "text-red-600", bgActive: "bg-red-50 border-red-200 text-red-700", bgInactive: "bg-muted/50 text-muted-foreground" },
  audio: { label: "Audio", icon: Headphones, color: "text-brand-gold", bgActive: "bg-amber-50 border-amber-200 text-amber-700", bgInactive: "bg-muted/50 text-muted-foreground" },
  pdfs: { label: "PDFs", icon: FileText, color: "text-blue-600", bgActive: "bg-blue-50 border-blue-200 text-blue-700", bgInactive: "bg-muted/50 text-muted-foreground" },
  notes: { label: "Notes", icon: Type, color: "text-brand-warm-grey", bgActive: "bg-stone-100 border-stone-300 text-stone-700", bgInactive: "bg-muted/50 text-muted-foreground" },
};

const TopicContent = ({ section, links }: { section: any; links: MaterialLink[] }) => {
  const materials = classifyMaterials(section, links);
  const [activeFilter, setActiveFilter] = useState<MaterialType | "all">("all");

  const counts: Record<MaterialType, number> = {
    videos: materials.videos.links.length,
    audio: materials.audio.links.length,
    pdfs: materials.pdfs.links.length,
    notes: materials.notes.textContent ? 1 : 0,
  };

  const totalItems = counts.videos + counts.audio + counts.pdfs + counts.notes;

  const handleFilter = (type: MaterialType) => {
    setActiveFilter((prev) => (prev === type ? "all" : type));
  };

  const showType = (type: MaterialType) => activeFilter === "all" || activeFilter === type;

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(materialMeta) as MaterialType[]).map((type) => {
          const meta = materialMeta[type];
          const Icon = meta.icon;
          const count = counts[type];
          const isActive = activeFilter === type;
          const isDisabled = count === 0;

          return (
            <button
              key={type}
              onClick={() => !isDisabled && handleFilter(type)}
              disabled={isDisabled}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed bg-muted/30 text-muted-foreground border-transparent"
                  : isActive
                    ? meta.bgActive
                    : "bg-white border-brand-parchment text-brand-charcoal-mid hover:border-brand-gold/50 hover:shadow-sm"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {meta.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {totalItems === 0 && (
        <p className="text-sm text-brand-warm-grey italic py-2">No materials added yet.</p>
      )}

      {/* Videos */}
      {showType("videos") && materials.videos.links.map((link, idx) => (
        <div key={link.id || idx} className="space-y-1.5">
          {link.label && (
            <p className="text-xs font-semibold text-brand-warm-grey flex items-center gap-1">
              <PlayCircle className="h-3.5 w-3.5 text-red-500" /> {link.label}
            </p>
          )}
          {getYouTubeId(link.url) ? (
            <div className="aspect-video rounded-xl overflow-hidden bg-brand-cream-dark shadow-sm">
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(link.url)}`}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          ) : (
            <a href={link.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:text-brand-primary/80 underline underline-offset-2">
              <LinkIcon className="h-3.5 w-3.5" /> {link.label || "Watch Video"}
            </a>
          )}
        </div>
      ))}

      {/* Audio */}
      {showType("audio") && materials.audio.links.map((link, idx) => (
        <div key={link.id || idx} className="space-y-1.5">
          {link.label && (
            <p className="text-xs font-semibold text-brand-warm-grey flex items-center gap-1">
              <Headphones className="h-3.5 w-3.5 text-brand-gold" /> {link.label}
            </p>
          )}
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
            <audio controls className="w-full h-10" preload="metadata">
              <source src={link.url} />
            </audio>
          </div>
        </div>
      ))}

      {/* PDFs */}
      {showType("pdfs") && materials.pdfs.links.map((link, idx) => (
        <a key={link.id || idx} href={link.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-blue-50/60 border border-blue-100 rounded-xl hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-100 shrink-0">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-charcoal-mid truncate">{link.label || "View PDF"}</p>
            <p className="text-xs text-brand-warm-grey truncate">{link.url.split("/").pop()}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-brand-warm-grey shrink-0 ml-auto" />
        </a>
      ))}

      {/* Notes */}
      {showType("notes") && materials.notes.textContent && (
        <div className="bg-stone-50 border-l-4 border-brand-gold/60 rounded-r-xl p-4">
          <p className="text-xs font-semibold text-brand-warm-grey mb-2 flex items-center gap-1">
            <Type className="h-3.5 w-3.5" /> Notes
          </p>
          <div className="text-sm text-brand-charcoal-mid whitespace-pre-wrap leading-relaxed">
            {materials.notes.textContent}
          </div>
        </div>
      )}
    </div>
  );
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
        <p className="text-brand-warm-grey text-sm mt-2">
          Explore your semester-wise chapters, topics, and study materials.
        </p>
      </div>

      <Tabs defaultValue="1" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-brand-cream-dark p-1.5 rounded-xl mb-6">
          {semesters.map((s) => (
            <TabsTrigger
              key={s}
              value={String(s)}
              className="px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey"
            >
              Sem {s}
            </TabsTrigger>
          ))}
          {hasAdditional && (
            <TabsTrigger
              value="9"
              className="px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey"
            >
              Additional
            </TabsTrigger>
          )}
        </TabsList>

        {[...semesters, ...(hasAdditional ? [9] : [])].map((sem) => (
          <TabsContent key={sem} value={String(sem)} className="space-y-6">
            {sem === 9 && (
              <p className="text-brand-warm-grey text-sm">
                Additional courses created by educators outside the standard 8-semester curriculum.
              </p>
            )}

            {getSubjectsForSemester(sem).length === 0 && (
              <Card className="bg-white rounded-2xl border border-brand-parchment p-8 text-center">
                <BookOpen className="h-10 w-10 text-brand-gold/40 mx-auto mb-3" />
                <p className="text-brand-warm-grey text-sm">No subjects available for this semester yet.</p>
              </Card>
            )}

            {getSubjectsForSemester(sem).map((subject) => (
              <Card
                key={subject.courseCode}
                className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg font-serif text-brand-charcoal-mid">
                        {subject.subjectName}
                      </CardTitle>
                      <Badge className="mt-1 bg-brand-gold-pale text-brand-primary border-0">
                        {subject.courseCode}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-brand-warm-grey">
                      <Clock className="h-4 w-4" /> {subject.totalHours}h
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Chapters accordion */}
                  <Accordion type="multiple" className="w-full">
                    {subject.modules.map((chapter) => {
                      const topics = getSectionsForModule(chapter.id);
                      return (
                        <AccordionItem
                          key={chapter.id}
                          value={chapter.id}
                          className="border-0 mb-2"
                        >
                          <div className="border-l-[3px] border-brand-primary/30 rounded-r-lg hover:border-brand-primary/60 transition-colors">
                            <AccordionTrigger className="text-left hover:no-underline px-4 py-3 hover:bg-brand-cream-dark/50 rounded-r-lg transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center h-7 w-7 rounded-md bg-brand-gold/10 shrink-0">
                                  <BookOpen className="h-3.5 w-3.5 text-brand-gold" />
                                </div>
                                <span className="font-medium text-brand-charcoal-mid text-sm">
                                  {chapter.module_name}
                                </span>
                                {topics.length > 0 && (
                                  <Badge className="text-[10px] bg-brand-cream-dark text-brand-warm-grey border-0 px-2 py-0.5">
                                    {topics.length} topic{topics.length > 1 ? "s" : ""}
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                          </div>

                          <AccordionContent className="pl-5 pt-2 pb-1">
                            {chapter.description && (
                              <p className="text-brand-warm-grey text-xs mb-3 pl-4">{chapter.description}</p>
                            )}

                            {topics.length === 0 ? (
                              <p className="text-sm text-brand-warm-grey italic pl-4">No topics added yet.</p>
                            ) : (
                              <Accordion type="multiple" className="w-full space-y-2">
                                {topics.map((topic) => {
                                  const topicLinks = getLinksForSection(topic.id);
                                  return (
                                    <AccordionItem
                                      key={topic.id}
                                      value={topic.id}
                                      className="border-0"
                                    >
                                      <div className="bg-brand-cream/60 rounded-xl border border-brand-parchment/80 overflow-hidden">
                                        <AccordionTrigger className="text-left hover:no-underline px-4 py-3 hover:bg-brand-cream transition-colors">
                                          <div className="flex items-center gap-2">
                                            <ChevronRight className="h-3.5 w-3.5 text-brand-gold shrink-0 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
                                            <span className="font-medium text-sm text-brand-charcoal-mid">
                                              {topic.title}
                                            </span>
                                          </div>
                                        </AccordionTrigger>

                                        <AccordionContent className="px-4 pb-4 pt-0">
                                          <TopicContent section={topic} links={topicLinks} />
                                        </AccordionContent>
                                      </div>
                                    </AccordionItem>
                                  );
                                })}
                              </Accordion>
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
