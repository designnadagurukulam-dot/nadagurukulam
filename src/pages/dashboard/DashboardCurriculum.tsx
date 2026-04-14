import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Clock, PlayCircle, Headphones, FileText, Type, Link as LinkIcon, ChevronRight } from "lucide-react";

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

  for (const link of links) {
    if (getYouTubeId(link.url)) {
      materials.videos.links.push(link);
    } else if (isAudioUrl(link.url)) {
      materials.audio.links.push(link);
    } else if (isPdfUrl(link.url)) {
      materials.pdfs.links.push(link);
    } else {
      if (section.content_type === "youtube") {
        materials.videos.links.push(link);
      } else {
        materials.pdfs.links.push(link);
      }
    }
  }

  if (links.length === 0 && section.content_type === "youtube" && section.youtube_url) {
    materials.videos.links.push({ id: "legacy-yt", section_id: "", url: section.youtube_url, label: null, sort_order: 0, created_at: "" });
  }
  if (section.audio_url) {
    materials.audio.links.push({ id: "legacy-audio", section_id: "", url: section.audio_url, label: null, sort_order: 0, created_at: "" });
  }
  if (section.pdf_url) {
    materials.pdfs.links.push({ id: "legacy-pdf", section_id: "", url: section.pdf_url, label: null, sort_order: 0, created_at: "" });
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
  const handleFilter = (type: MaterialType) => setActiveFilter((prev) => (prev === type ? "all" : type));
  const showType = (type: MaterialType) => activeFilter === "all" || activeFilter === type;

  return (
    <div className="space-y-4">
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

      {totalItems === 0 && <p className="text-sm text-brand-warm-grey italic py-2">No materials added yet.</p>}

      {showType("videos") && materials.videos.links.map((link, idx) => (
        <div key={link.id || idx} className="space-y-1.5">
          {link.label && (
            <p className="text-xs font-semibold text-brand-warm-grey flex items-center gap-1">
              <PlayCircle className="h-3.5 w-3.5 text-red-500" /> {link.label}
            </p>
          )}
          {getYouTubeId(link.url) ? (
            <div className="aspect-video rounded-xl overflow-hidden bg-brand-cream-dark shadow-sm">
              <iframe src={`https://www.youtube.com/embed/${getYouTubeId(link.url)}`} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          ) : (
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:text-brand-primary/80 underline underline-offset-2">
              <LinkIcon className="h-3.5 w-3.5" /> {link.label || "Watch Video"}
            </a>
          )}
        </div>
      ))}

      {showType("audio") && materials.audio.links.map((link, idx) => (
        <div key={link.id || idx} className="space-y-1.5">
          {link.label && (
            <p className="text-xs font-semibold text-brand-warm-grey flex items-center gap-1">
              <Headphones className="h-3.5 w-3.5 text-brand-gold" /> {link.label}
            </p>
          )}
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
            <audio controls className="w-full h-10" preload="metadata"><source src={link.url} /></audio>
          </div>
        </div>
      ))}

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

      {showType("notes") && materials.notes.textContent && (
        <div className="bg-stone-50 border-l-4 border-brand-gold/60 rounded-r-xl p-4">
          <p className="text-xs font-semibold text-brand-warm-grey mb-2 flex items-center gap-1"><Type className="h-3.5 w-3.5" /> Notes</p>
          <div className="text-sm text-brand-charcoal-mid whitespace-pre-wrap leading-relaxed">{materials.notes.textContent}</div>
        </div>
      )}
    </div>
  );
};

/* ─── Subject Card with Sidebar + Content Panel ─── */
const SubjectPanel = ({
  subject,
  sections,
  sectionLinks,
}: {
  subject: { courseCode: string; subjectName: string; modules: any[]; totalHours: number };
  sections: any[];
  sectionLinks: MaterialLink[];
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // Auto-select first chapter
  useEffect(() => {
    if (subject.modules.length > 0 && !selectedChapterId) {
      setSelectedChapterId(subject.modules[0].id);
    }
  }, [subject.modules, selectedChapterId]);

  const selectedChapter = subject.modules.find((m) => m.id === selectedChapterId);
  const topics = selectedChapter ? sections.filter((s) => s.module_id === selectedChapter.id) : [];

  return (
    <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
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

      <CardContent className="pt-0">
        {/* Mobile: horizontal chapter strip */}
        <div className="md:hidden mb-4">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {subject.modules.map((ch) => {
                const isActive = ch.id === selectedChapterId;
                const topicCount = sections.filter((s) => s.module_id === ch.id).length;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      isActive
                        ? "bg-brand-primary/10 border-brand-primary text-brand-primary font-semibold"
                        : "bg-brand-cream/50 border-brand-parchment text-brand-charcoal-mid hover:bg-brand-cream"
                    }`}
                  >
                    {ch.module_name}
                    {topicCount > 0 && (
                      <span className="ml-1.5 text-[10px] opacity-70">({topicCount})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Desktop: sidebar + content */}
        <div className="flex gap-0 min-h-[300px]">
          {/* Chapter sidebar — hidden on mobile */}
          <div className="hidden md:block w-[240px] shrink-0 border-r border-brand-parchment">
            <ScrollArea className="h-[500px] pr-2">
              <div className="space-y-0.5 py-1">
                {subject.modules.map((ch) => {
                  const isActive = ch.id === selectedChapterId;
                  const topicCount = sections.filter((s) => s.module_id === ch.id).length;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChapterId(ch.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-r-lg transition-all text-sm flex items-start gap-2 ${
                        isActive
                          ? "bg-brand-primary/10 border-l-[3px] border-brand-primary text-brand-primary font-semibold"
                          : "border-l-[3px] border-transparent hover:bg-brand-cream-dark/60 text-brand-charcoal-mid hover:text-brand-primary"
                      }`}
                    >
                      <BookOpen className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? "text-brand-gold" : "text-brand-warm-grey"}`} />
                      <div className="min-w-0">
                        <span className="block leading-snug">{ch.module_name}</span>
                        {topicCount > 0 && (
                          <span className="text-[10px] text-brand-warm-grey mt-0.5 block">
                            {topicCount} topic{topicCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Content panel */}
          <div className="flex-1 min-w-0 md:pl-5">
            {selectedChapter ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-brand-charcoal-mid font-serif">
                    {selectedChapter.module_name}
                  </h3>
                  {selectedChapter.description && (
                    <p className="text-xs text-brand-warm-grey mt-1">{selectedChapter.description}</p>
                  )}
                  {selectedChapter.hours && (
                    <span className="inline-flex items-center gap-1 text-xs text-brand-warm-grey mt-1">
                      <Clock className="h-3 w-3" /> {selectedChapter.hours}h
                    </span>
                  )}
                </div>

                {topics.length === 0 ? (
                  <p className="text-sm text-brand-warm-grey italic">No topics added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {topics.map((topic) => {
                      const topicLinks = sectionLinks.filter((l) => l.section_id === topic.id);
                      return (
                        <div
                          key={topic.id}
                          className="bg-brand-cream/40 rounded-xl border border-brand-parchment/80 p-4 space-y-3"
                        >
                          <h4 className="text-sm font-semibold text-brand-charcoal-mid flex items-center gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-brand-gold shrink-0" />
                            {topic.title}
                          </h4>
                          <TopicContent section={topic} links={topicLinks} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-brand-warm-grey text-sm">
                <p>Select a chapter to view topics</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
            {sem === 9 && (
              <p className="text-brand-warm-grey text-sm">Additional courses created by educators outside the standard 8-semester curriculum.</p>
            )}

            {getSubjectsForSemester(sem).length === 0 && (
              <Card className="bg-white rounded-2xl border border-brand-parchment p-8 text-center">
                <BookOpen className="h-10 w-10 text-brand-gold/40 mx-auto mb-3" />
                <p className="text-brand-warm-grey text-sm">No subjects available for this semester yet.</p>
              </Card>
            )}

            {getSubjectsForSemester(sem).map((subject) => (
              <SubjectPanel
                key={subject.courseCode}
                subject={subject}
                sections={sections}
                sectionLinks={sectionLinks}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default DashboardCurriculum;
