import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Curriculum = () => {
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

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const getSubjectsForSemester = (sem: number) => {
    const semModules = modules.filter((m) => m.semester === sem);
    const subjects: Record<string, typeof semModules> = {};
    semModules.forEach((m) => {
      const key = `${m.course_code}-${m.subject_name}`;
      if (!subjects[key]) subjects[key] = [];
      subjects[key].push(m);
    });
    return Object.entries(subjects).map(([key, mods]) => ({
      courseCode: mods[0].course_code,
      subjectName: mods[0].subject_name,
      modules: mods,
      totalHours: mods.reduce((sum, m) => sum + (m.hours || 0), 0),
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            BPA Carnatic Vocal Curriculum
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive 8-semester programme covering Carnatic compositions, theory, Manodharma Sangeetha, and more.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="container mx-auto px-4 py-12">
        <Tabs defaultValue="1" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-xl mb-8">
            {semesters.map((s) => (
              <TabsTrigger
                key={s}
                value={String(s)}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Semester {s}
              </TabsTrigger>
            ))}
          </TabsList>

          {semesters.map((sem) => (
            <TabsContent key={sem} value={String(sem)} className="space-y-6">
              {getSubjectsForSemester(sem).length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No modules added for this semester yet.</p>
              ) : (
                getSubjectsForSemester(sem).map((subject) => (
                  <Card key={subject.courseCode} className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-xl font-serif">{subject.subjectName}</CardTitle>
                          <Badge variant="secondary" className="mt-1">{subject.courseCode}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {subject.totalHours} hours
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" className="w-full">
                        {subject.modules.map((mod) => (
                          <AccordionItem key={mod.id} value={mod.id}>
                            <AccordionTrigger className="text-left hover:no-underline">
                              <div className="flex items-center gap-3">
                                <BookOpen className="h-4 w-4 text-secondary shrink-0" />
                                <span className="font-medium">{mod.module_name}</span>
                                {mod.hours && (
                                  <Badge variant="outline" className="ml-2 text-xs">{mod.hours}h</Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <p className="text-muted-foreground pl-7">
                                {mod.description || "No description available."}
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
  );
};

export default Curriculum;
