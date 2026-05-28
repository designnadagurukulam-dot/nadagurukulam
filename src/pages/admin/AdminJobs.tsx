import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";
import { Plus, Trash2, Pencil, Briefcase, Users, Settings2, Archive } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

const EXPERIENCE_OPTIONS = ["Fresher", "0-2 years", "2-5 years", "5+ years", "Open to all"];

const AdminJobs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showDeptManager, setShowDeptManager] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [editingJob, setEditingJob] = useState<any>(null);
  const [form, setForm] = useState({ title: "", department: "", location: "Muddenahalli, Karnataka", type: "full-time", description: "", requirements: "", qualification: "", experience_required: "Open to all" });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_postings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: volunteers = [], isLoading: volLoading } = useQuery({
    queryKey: ["admin-volunteers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("volunteer_applications").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: customPrograms = [] } = useQuery({
    queryKey: ["job-departments"],
    queryFn: async () => {
      const { data } = await supabase.from("job_departments" as any).select("*").order("name");
      return (data as any[]) || [];
    },
  });
  const { data: curriculumPrograms = [] } = useQuery({
    queryKey: ["curriculum-programs-for-jobs"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").is("parent_id", null).order("name");
      return data || [];
    },
  });
  // Merge curriculum programs + custom programs, de-duplicated by name (case-insensitive)
  const programs = (() => {
    const seen = new Set<string>();
    const out: { id: string; name: string; source: "curriculum" | "custom" }[] = [];
    curriculumPrograms.forEach((p: any) => {
      const key = (p.name || "").toLowerCase();
      if (key && !seen.has(key)) { seen.add(key); out.push({ id: `curr-${p.id}`, name: p.name, source: "curriculum" }); }
    });
    customPrograms.forEach((p: any) => {
      const key = (p.name || "").toLowerCase();
      if (key && !seen.has(key)) { seen.add(key); out.push({ id: p.id, name: p.name, source: "custom" }); }
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  })();

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { error } = await supabase.from("job_postings").update(data).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("job_postings").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      logActivity(editingJob ? "job.updated" : "job.created", "job_posting", editingJob?.id, { title: form.title });
      toast({ title: editingJob ? "Job updated" : "Job posted" });
      resetForm();
    },
  });
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("job_postings").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); logActivity("job.toggled", "job_posting", vars.id, { is_active: vars.is_active }); },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("job_postings").delete().eq("id", id); if (error) throw error; },
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); logActivity("job.deleted", "job_posting", id); toast({ title: "Job deleted" }); },
  });
  const updateVolStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from("volunteer_applications").update({ status }).eq("id", id); if (error) throw error; },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ["admin-volunteers"] }); logActivity("volunteer.status_updated", "volunteer_application", vars.id, { status: vars.status }); toast({ title: "Status updated" }); },
  });
  const addDept = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("job_departments" as any).insert({ name });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["job-departments"] }); setNewDept(""); toast({ title: "Department added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const removeDept = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("job_departments" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["job-departments"] }); toast({ title: "Department removed" }); },
  });

  const resetForm = () => {
    setForm({ title: "", department: "", location: "Muddenahalli, Karnataka", type: "full-time", description: "", requirements: "", qualification: "", experience_required: "Open to all" });
    setEditingJob(null);
    setShowForm(false);
  };
  const handleEdit = (job: any) => {
    setForm({
      title: job.title,
      department: job.department || "",
      location: job.location || "",
      type: job.type || "full-time",
      description: job.description || "",
      requirements: job.requirements || "",
      qualification: job.qualification || "",
      experience_required: job.experience_required || "Open to all",
    });
    setEditingJob(job);
    setShowForm(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.location?.trim()) { toast({ title: "Location is required", variant: "destructive" }); return; }
    saveMutation.mutate(editingJob ? { ...form, id: editingJob.id } : form);
  };

  const activeJobs = jobs.filter((j: any) => j.is_active);
  const pastJobs = jobs.filter((j: any) => !j.is_active);
  const activeVols = volunteers.filter((v: any) => v.status === "new" || v.status === "contacted");
  const pastVols = volunteers.filter((v: any) => v.status === "accepted" || v.status === "dismissed");

  const renderJob = (job: any) => (
    <div key={job.id} className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 flex items-start justify-between gap-4 hover:bg-brand-cream transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-serif text-lg text-brand-primary">{job.title}</h3>
          <Badge className={job.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"}>{job.is_active ? "Active" : "Closed"}</Badge>
        </div>
        <p className="text-sm text-brand-warm-grey">{job.department || "—"} • {job.location} • {job.type}</p>
        {(job.qualification || job.experience_required) && (
          <p className="text-xs text-brand-warm-grey mt-1">
            {job.qualification && <><span className="font-semibold">Qualification:</span> {job.qualification} </>}
            {job.experience_required && <span className="ml-2"><span className="font-semibold">Experience:</span> {job.experience_required}</span>}
          </p>
        )}
        {job.description && <p className="text-sm text-brand-warm-grey mt-2 line-clamp-2">{job.description}</p>}
        <p className="text-[11px] text-brand-warm-grey mt-1">Posted {format(new Date(job.created_at), "PP")}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Switch checked={job.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: job.id, is_active: v })} />
        <Button variant="ghost" size="icon" onClick={() => handleEdit(job)} className="hover:bg-brand-gold-pale text-brand-primary"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(job.id)} className="hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );

  const renderVol = (vol: any) => (
    <div key={vol.id} className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:bg-brand-cream transition-colors">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-gold-pale flex items-center justify-center text-brand-primary font-serif font-bold text-xs">{vol.full_name[0]}</div>
            <h3 className="font-medium text-brand-charcoal">{vol.full_name}</h3>
            <Badge className="bg-brand-cream-dark text-brand-charcoal-mid border-0 text-[10px] capitalize">{vol.status}</Badge>
          </div>
          <p className="text-sm text-brand-warm-grey mt-1">{vol.email} {vol.phone && `• ${vol.phone}`}</p>
          {vol.area_of_interest && <p className="text-sm mt-1 text-brand-charcoal"><span className="text-brand-warm-grey">Interest:</span> {vol.area_of_interest}</p>}
          {vol.availability && <p className="text-sm text-brand-charcoal"><span className="text-brand-warm-grey">Availability:</span> {vol.availability}</p>}
          {vol.message && <p className="text-sm text-brand-warm-grey mt-2">{vol.message}</p>}
          <p className="text-xs text-brand-warm-grey mt-2">{format(new Date(vol.created_at), "PPp")}</p>
        </div>
        <Select value={vol.status} onValueChange={(v) => updateVolStatus.mutate({ id: vol.id, status: v })}>
          <SelectTrigger className="w-32 border-brand-parchment rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-primary">Jobs & Volunteers</h1>
          <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeptManager(true)} className="gap-2 rounded-xl"><Settings2 className="h-4 w-4" /> Manage Departments</Button>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl gap-2"><Plus className="h-4 w-4" /> Post Job</Button>
        </div>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList className="bg-brand-cream border border-brand-parchment rounded-xl p-1">
          <TabsTrigger value="jobs" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5"><Briefcase className="h-4 w-4" />Active Jobs ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="past-jobs" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5"><Archive className="h-4 w-4" />Past Openings ({pastJobs.length})</TabsTrigger>
          <TabsTrigger value="volunteers" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5"><Users className="h-4 w-4" />Active Volunteers ({activeVols.length})</TabsTrigger>
          <TabsTrigger value="past-vols" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5"><Archive className="h-4 w-4" />Past Volunteers ({pastVols.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-3 mt-4">
          {jobsLoading ? <p className="text-brand-warm-grey">Loading...</p> : activeJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
              <Briefcase className="h-7 w-7 text-brand-gold mx-auto mb-2" />
              <h3 className="font-serif text-xl text-brand-primary">No Active Jobs</h3>
            </div>
          ) : activeJobs.map(renderJob)}
        </TabsContent>

        <TabsContent value="past-jobs" className="space-y-3 mt-4">
          {pastJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
              <Archive className="h-7 w-7 text-brand-gold mx-auto mb-2" />
              <h3 className="font-serif text-xl text-brand-primary">No Past Openings</h3>
            </div>
          ) : pastJobs.map(renderJob)}
        </TabsContent>

        <TabsContent value="volunteers" className="space-y-3 mt-4">
          {volLoading ? <p className="text-brand-warm-grey">Loading...</p> : activeVols.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
              <Users className="h-7 w-7 text-brand-gold mx-auto mb-2" />
              <h3 className="font-serif text-xl text-brand-primary">No Active Volunteer Applications</h3>
            </div>
          ) : activeVols.map(renderVol)}
        </TabsContent>

        <TabsContent value="past-vols" className="space-y-3 mt-4">
          {pastVols.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
              <Archive className="h-7 w-7 text-brand-gold mx-auto mb-2" />
              <h3 className="font-serif text-xl text-brand-primary">No Past Volunteers</h3>
            </div>
          ) : pastVols.map(renderVol)}
        </TabsContent>
      </Tabs>

      {/* Job Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl border-brand-parchment max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-xl text-brand-primary">{editingJob ? "Edit Job Posting" : "Post New Job"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Job Title *</label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-brand-parchment rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Department</label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger className="border-brand-parchment rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="border-brand-parchment rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Location *</label><Input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border-brand-parchment rounded-xl" /></div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Experience Required</label>
              <Select value={form.experience_required} onValueChange={(v) => setForm({ ...form, experience_required: v })}>
                <SelectTrigger className="border-brand-parchment rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Qualification</label><Textarea value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} rows={2} placeholder="e.g. Master's in Music or equivalent practical credentials" className="border-brand-parchment rounded-xl" /></div>
            <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="border-brand-parchment rounded-xl" /></div>
            <div><label className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold mb-1 block">Requirements</label><Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={3} className="border-brand-parchment rounded-xl" /></div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetForm} className="border-brand-parchment rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl">{saveMutation.isPending ? "Saving..." : editingJob ? "Update" : "Post Job"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Departments manager */}
      <Dialog open={showDeptManager} onOpenChange={setShowDeptManager}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="font-serif text-brand-primary">Manage Departments</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="New department" />
            <Button onClick={() => newDept.trim() && addDept.mutate(newDept.trim())} disabled={!newDept.trim()} className="bg-brand-primary text-white"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {departments.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between bg-brand-cream rounded-xl px-3 py-2">
                <span className="text-sm">{d.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeDept.mutate(d.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobs;
