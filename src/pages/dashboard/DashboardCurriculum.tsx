import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen, Clock, PlayCircle, Headphones, FileText, Type,
  ChevronRight, GraduationCap, Sparkles,
  Music, Download, Play, FolderOpen, Layers, Quote, Hash
} from "lucide-react";

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

const materialMeta: Record<MaterialType, { label: string; icon: typeof PlayCircle; activeGradient: string; inactiveClass: string; iconBg: string }> = {
  videos: {
    label: "Videos", icon: PlayCircle,
    activeGradient: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200/50",
    inactiveClass: "bg-white/80 border-brand-parchment text-brand-charcoal-mid hover:border-red-200 hover:shadow-md",
    iconBg: "bg-red-100 text-red-600",
  },
  audio: {
    label: "Audio", icon: Headphones,
    activeGradient: "bg-gradient-to-r from-amber-500 to-brand-gold text-white shadow-lg shadow-amber-200/50",
    inactiveClass: "bg-white/80 border-brand-parchment text-brand-charcoal-mid hover:border-amber-200 hover:shadow-md",
    iconBg: "bg-amber-100 text-amber-600",
  },
  pdfs: {
    label: "PDFs", icon: FileText,
    activeGradient: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200/50",
    inactiveClass: "bg-white/80 border-brand-parchment text-brand-charcoal-mid hover:border-blue-200 hover:shadow-md",
    iconBg: "bg-blue-100 text-blue-600",
  },
  notes: {
    label: "Notes", icon: Type,
    activeGradient: "bg-gradient-to-r from-stone-500 to-stone-600 text-white shadow-lg shadow-stone-200/50",
    inactiveClass: "bg-white/80 border-brand-parchment text-brand-charcoal-mid hover:border-stone-200 hover:shadow-md",
    iconBg: "bg-stone-100 text-stone-600",
  },
};

/* ─── Topic Content with Premium Material Display ─── */
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
    <div className="space-y-5">
      {/* Glossy Filter Pills */}
      <div className="flex flex-wrap gap-2.5">
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
              className={`group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border backdrop-blur-sm transition-all duration-300 ${
                isDisabled
                  ? "opacity-30 cursor-not-allowed bg-muted/20 text-muted-foreground border-transparent"
                  : isActive
                    ? `${meta.activeGradient} border-transparent scale-105`
                    : `${meta.inactiveClass} hover:scale-[1.03]`
              }`}
            >
              <span className={`flex items-center justify-center w-6 h-6 rounded-full ${isActive ? "bg-white/25" : meta.iconBg} transition-colors duration-300`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              {meta.label}
              {count > 0 && (
                <span className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25" : "bg-brand-cream-dark"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-primary/10 flex items-center justify-center mb-3">
            <FolderOpen className="h-6 w-6 text-brand-gold" />
          </div>
          <p className="text-sm text-brand-warm-grey font-medium">Content coming soon — stay tuned!</p>
        </div>
      )}

      {/* Videos — Premium Embed */}
      {showType("videos") && materials.videos.links.map((link, idx) => (
        <div key={link.id || idx} className="space-y-2 animate-fade-in">
          {link.label && (
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                <Play className="h-3 w-3 text-red-600" />
              </span>
              <p className="text-xs font-bold text-brand-charcoal-mid uppercase tracking-wide">{link.label}</p>
            </div>
          )}
          {getYouTubeId(link.url) ? (
            <div className="relative group rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow duration-300">
              <div className="aspect-video bg-gradient-to-br from-brand-charcoal-mid to-black">
                <iframe src={`https://www.youtube.com/embed/${getYouTubeId(link.url)}`} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
              </div>
            </div>
          ) : (
            <a href={link.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-xl text-sm font-medium text-red-700 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
              <Play className="h-4 w-4" /> {link.label || "Watch Video"}
            </a>
          )}
        </div>
      ))}

      {/* Audio — Waveform-style Card */}
      {showType("audio") && materials.audio.links.map((link, idx) => (
        <div key={link.id || idx} className="animate-fade-in">
          {link.label && (
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100">
                <Headphones className="h-3 w-3 text-brand-gold" />
              </span>
              <p className="text-xs font-bold text-brand-charcoal-mid uppercase tracking-wide">{link.label}</p>
            </div>
          )}
          <div className="relative bg-gradient-to-r from-amber-50 via-amber-50/80 to-brand-gold/5 border border-amber-200/60 rounded-2xl p-4 shadow-sm overflow-hidden">
            {/* Decorative waveform lines */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-[3px] opacity-15">
              {[16, 24, 12, 28, 18, 22, 14, 26, 10, 20].map((h, i) => (
                <div key={i} className="w-[3px] rounded-full bg-brand-gold" style={{ height: `${h}px` }} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold to-amber-500 flex items-center justify-center shadow-md shrink-0">
                <Music className="h-5 w-5 text-white" />
              </div>
              <audio controls className="w-full h-10" preload="metadata"><source src={link.url} /></audio>
            </div>
          </div>
        </div>
      ))}

      {/* PDFs — Paper-texture Download Card */}
      {showType("pdfs") && materials.pdfs.links.map((link, idx) => (
        <a key={link.id || idx} href={link.url} target="_blank" rel="noopener noreferrer"
          className="group flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/30 border border-blue-100 rounded-2xl hover:shadow-lg hover:shadow-blue-100/40 transition-all duration-300 hover:scale-[1.01] animate-fade-in">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shrink-0 group-hover:shadow-lg transition-shadow">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-charcoal-mid truncate">{link.label || "View PDF Document"}</p>
            <p className="text-xs text-brand-warm-grey truncate mt-0.5">{link.url.split("/").pop()}</p>
          </div>
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-100 shrink-0 group-hover:bg-blue-200 transition-colors">
            <Download className="h-4 w-4 text-blue-600" />
          </div>
        </a>
      ))}

      {/* Notes — Elegant Blockquote */}
      {showType("notes") && materials.notes.textContent && (
        <div className="relative bg-gradient-to-br from-stone-50 via-brand-cream to-stone-50/50 border border-stone-200/60 rounded-2xl p-5 shadow-sm animate-fade-in overflow-hidden">
          {/* Decorative quote mark */}
          <div className="absolute -top-2 -left-1 opacity-[0.07]">
            <Quote className="h-20 w-20 text-brand-primary" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-200">
                <Type className="h-3 w-3 text-stone-600" />
              </span>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Notes</p>
            </div>
            <div className="text-sm text-brand-charcoal-mid whitespace-pre-wrap leading-relaxed font-serif border-l-4 border-brand-gold/40 pl-4">
              {materials.notes.textContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Subject Card with Premium Sidebar + Content Panel ─── */
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

  useEffect(() => {
    if (subject.modules.length > 0 && !selectedChapterId) {
      setSelectedChapterId(subject.modules[0].id);
    }
  }, [subject.modules, selectedChapterId]);

  const selectedChapter = subject.modules.find((m) => m.id === selectedChapterId);
  const topics = selectedChapter ? sections.filter((s) => s.module_id === selectedChapter.id) : [];

  return (
    <Card className="relative bg-white rounded-2xl border border-brand-parchment shadow-[0_4px_30px_rgba(125,30,36,0.06)] overflow-hidden">
      {/* Decorative gradient header strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary via-brand-gold to-brand-primary" />
      
      {/* Watermark decoration */}
      <div className="absolute top-4 right-4 opacity-[0.04]">
        <Music className="h-24 w-24 text-brand-primary" />
      </div>

      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary/80 flex items-center justify-center shadow-md shrink-0">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif text-brand-charcoal-mid leading-tight">{subject.subjectName}</CardTitle>
              <Badge className="mt-1.5 bg-gradient-to-r from-brand-gold-pale to-amber-100 text-brand-primary border-0 font-bold text-xs shadow-sm">
                {subject.courseCode}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-brand-warm-grey bg-brand-cream-dark/60 px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4 text-brand-gold" /> <span className="font-semibold">{subject.totalHours}h</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 relative z-10">
        {/* Mobile: horizontal chapter strip */}
        <div className="md:hidden mb-4">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {subject.modules.map((ch, idx) => {
                const isActive = ch.id === selectedChapterId;
                const topicCount = sections.filter((s) => s.module_id === ch.id).length;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-brand-primary to-brand-primary/90 text-white border-transparent shadow-md scale-105"
                        : "bg-white border-brand-parchment text-brand-charcoal-mid hover:bg-brand-cream hover:shadow-sm"
                    }`}
                  >
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${isActive ? "bg-white/25 text-white" : "bg-brand-gold/15 text-brand-primary"}`}>
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[120px]">{ch.module_name}</span>
                    {topicCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-white/20" : "bg-brand-cream-dark"}`}>
                        {topicCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Desktop: sidebar + content */}
        <div className="flex gap-0 min-h-[350px]">
          {/* Chapter sidebar — sticky */}
          <div className="hidden md:block w-[260px] shrink-0 border-r border-brand-parchment/80 bg-gradient-to-b from-brand-cream/30 to-transparent self-start sticky top-4">
            <ScrollArea className="max-h-[calc(100vh-200px)]">
              <div className="p-2 space-y-1">
                {subject.modules.map((ch, idx) => {
                  const isActive = ch.id === selectedChapterId;
                  const topicCount = sections.filter((s) => s.module_id === ch.id).length;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChapterId(ch.id)}
                      className={`group w-full text-left px-3 py-3 rounded-xl transition-all duration-300 text-sm flex items-start gap-3 ${
                        isActive
                          ? "bg-gradient-to-r from-brand-primary/10 to-brand-gold/5 shadow-sm border border-brand-primary/15"
                          : "hover:bg-brand-cream-dark/50 border border-transparent hover:border-brand-parchment"
                      }`}
                    >
                      {/* Numbered badge */}
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shrink-0 transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-br from-brand-gold to-amber-500 text-white shadow-md"
                          : "bg-brand-gold/15 text-brand-primary group-hover:bg-brand-gold/25"
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className={`block leading-snug font-medium transition-colors ${isActive ? "text-brand-primary font-semibold" : "text-brand-charcoal-mid"}`}>
                          {ch.module_name}
                        </span>
                        {topicCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-brand-warm-grey mt-1">
                            <Layers className="h-3 w-3" /> {topicCount} topic{topicCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-brand-gold shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Content panel */}
          <div className="flex-1 min-w-0 md:pl-6">
            {selectedChapter ? (
              <div className="space-y-6 animate-fade-in">
                {/* Chapter header */}
                <div className="bg-gradient-to-r from-brand-cream/80 to-brand-gold/5 rounded-xl p-4 border border-brand-parchment/60">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-brand-gold" />
                    <h3 className="text-base font-bold text-brand-charcoal-mid font-serif">
                      {selectedChapter.module_name}
                    </h3>
                  </div>
                  {selectedChapter.description && (
                    <p className="text-xs text-brand-warm-grey mt-1 ml-6">{selectedChapter.description}</p>
                  )}
                  {selectedChapter.hours && (
                    <span className="inline-flex items-center gap-1 text-xs text-brand-warm-grey mt-2 ml-6 bg-white/60 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3 text-brand-gold" /> {selectedChapter.hours}h
                    </span>
                  )}
                </div>

                {topics.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-primary/10 flex items-center justify-center mb-3">
                      <Sparkles className="h-7 w-7 text-brand-gold" />
                    </div>
                    <p className="text-sm text-brand-warm-grey font-medium">Topics coming soon — stay tuned!</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {topics.map((topic) => {
                      const topicLinks = sectionLinks.filter((l) => l.section_id === topic.id);
                      return (
                        <div
                          key={topic.id}
                          className="bg-white rounded-2xl border border-brand-parchment/80 shadow-[0_2px_16px_rgba(196,154,60,0.08)] hover:shadow-[0_4px_24px_rgba(196,154,60,0.14)] transition-all duration-300 overflow-hidden"
                        >
                          {/* Topic header with accent border */}
                          <div className="border-l-4 border-brand-gold p-5">
                            <h4 className="text-sm font-bold text-brand-charcoal-mid flex items-center gap-2.5">
                              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-brand-gold/20 to-amber-100 shrink-0">
                                <Hash className="h-3.5 w-3.5 text-brand-gold" />
                              </span>
                              <span className="font-serif">{topic.title}</span>
                            </h4>
                            <div className="mt-4 ml-8">
                              <TopicContent section={topic} links={topicLinks} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary/10 to-brand-gold/10 flex items-center justify-center mb-3">
                  <BookOpen className="h-7 w-7 text-brand-primary/40" />
                </div>
                <p className="text-brand-warm-grey text-sm font-medium">Select a chapter to explore topics</p>
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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-gold/20 flex items-center justify-center animate-pulse">
          <GraduationCap className="h-6 w-6 text-brand-primary" />
        </div>
        <p className="text-sm text-brand-warm-grey">Loading curriculum...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-brand-primary/5 via-brand-gold/5 to-brand-primary/5 rounded-2xl p-6 border border-brand-parchment overflow-hidden">
        <div className="absolute -top-4 -right-4 opacity-[0.06]">
          <GraduationCap className="h-32 w-32 text-brand-primary" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-gold to-amber-500 flex items-center justify-center shadow-lg shrink-0">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-primary">My Curriculum</h1>
            <p className="text-brand-warm-grey text-sm mt-0.5">
              Explore your semester-wise chapters, topics & study materials
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="1" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1.5 bg-white p-2 rounded-xl mb-6 border border-brand-parchment shadow-sm">
          {semesters.map((s) => (
            <TabsTrigger
              key={s}
              value={String(s)}
              className="group px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-primary data-[state=active]:to-brand-primary/90 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-105 text-brand-warm-grey hover:bg-brand-cream-dark/60"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-[10px] font-black group-data-[state=active]:bg-white/20">
                  {s}
                </span>
                Sem {s}
              </span>
            </TabsTrigger>
          ))}
          {hasAdditional && (
            <TabsTrigger value="9" className="px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-primary data-[state=active]:to-brand-primary/90 data-[state=active]:text-white data-[state=active]:shadow-md text-brand-warm-grey">
              Additional
            </TabsTrigger>
          )}
        </TabsList>

        {[...semesters, ...(hasAdditional ? [9] : [])].map((sem) => (
          <TabsContent key={sem} value={String(sem)} className="space-y-6 animate-fade-in">
            {sem === 9 && (
              <p className="text-brand-warm-grey text-sm">Additional courses created by educators outside the standard 8-semester curriculum.</p>
            )}

            {getSubjectsForSemester(sem).length === 0 && (
              <Card className="bg-white rounded-2xl border border-brand-parchment p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-gold/15 to-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-7 w-7 text-brand-gold/60" />
                </div>
                <p className="text-brand-warm-grey text-sm font-medium">No subjects available for this semester yet.</p>
                <p className="text-brand-warm-grey/60 text-xs mt-1">Check back later for updates!</p>
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
