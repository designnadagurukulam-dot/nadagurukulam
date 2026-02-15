import { motion } from "framer-motion";
import { Award, Download, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const certificates = [
  { title: "Carnatic Vocal - Level 1 Completion", course: "Carnatic Vocal - Basics", date: "Jan 15, 2026", id: "NG-CV-2026-001" },
];

const DashboardCertificates = () => (
  <div className="space-y-6">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-serif text-3xl text-foreground">Certificates</h1>
      <p className="text-muted-foreground mt-1">Your earned certificates and achievements</p>
    </motion.div>

    {certificates.length === 0 ? (
      <Card className="text-center p-12">
        <Award className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="font-serif text-xl text-foreground">No certificates yet</h3>
        <p className="text-muted-foreground mt-2">Complete a course to earn your first certificate!</p>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert, i) => (
          <motion.div key={cert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 gradient-maroon flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                <Award className="h-16 w-16 text-secondary" />
              </div>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-serif text-lg text-foreground">{cert.title}</h3>
                <p className="text-sm text-muted-foreground">{cert.course}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Awarded: {cert.date}</span>
                  <span>ID: {cert.id}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

export default DashboardCertificates;
