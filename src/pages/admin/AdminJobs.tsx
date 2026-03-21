import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Briefcase, Users, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

const AdminJobs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [form, setForm] = useState({ title: "", department: "", location: "Muddenahalli, Karnataka", type: "full-time", description: "", requirements: "" });

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

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
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
      toast({ title: editingJob ? "Job updated" : "Job posted" });
      resetForm();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("job_postings").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_postings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast({ title: "Job deleted" });
    },
  });

  const updateVolStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("volunteer_applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-volunteers"] });
      toast({ title: "Status updated" });
    },
  });

  const resetForm = () => {
    setForm({ title: "", department: "", location: "Muddenahalli, Karnataka", type: "full-time", description: "", requirements: "" });
    setEditingJob(null);
    setShowForm(false);
  };

  const handleEdit = (job: any) => {
    setForm({ title: job.title, department: job.department || "", location: job.location || "", type: job.type || "full-time", description: job.description || "", requirements: job.requirements || "" });
    setEditingJob(job);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editingJob ? { ...form, id: editingJob.id } : form);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl md:text-3xl font-bold">Jobs & Volunteers</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Post Job
        </Button>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs"><Briefcase className="h-4 w-4 mr-1.5" />Job Postings ({jobs.length})</TabsTrigger>
          <TabsTrigger value="volunteers"><Users className="h-4 w-4 mr-1.5" />Volunteer Applications ({volunteers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4 mt-4">
          {jobsLoading ? <p className="text-muted-foreground">Loading...</p> : jobs.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No job postings yet.</CardContent></Card>
          ) : jobs.map((job: any) => (
            <Card key={job.id}>
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <Badge variant={job.is_active ? "default" : "secondary"}>{job.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{job.department} • {job.location} • {job.type}</p>
                  {job.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={job.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: job.id, is_active: v })} />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(job)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(job.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="volunteers" className="space-y-4 mt-4">
          {volLoading ? <p className="text-muted-foreground">Loading...</p> : volunteers.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No volunteer applications yet.</CardContent></Card>
          ) : volunteers.map((vol: any) => (
            <Card key={vol.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{vol.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{vol.email} {vol.phone && `• ${vol.phone}`}</p>
                    {vol.area_of_interest && <p className="text-sm mt-1"><span className="font-medium">Interest:</span> {vol.area_of_interest}</p>}
                    {vol.availability && <p className="text-sm"><span className="font-medium">Availability:</span> {vol.availability}</p>}
                    {vol.message && <p className="text-sm text-muted-foreground mt-2">{vol.message}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{format(new Date(vol.created_at), "PPp")}</p>
                  </div>
                  <Select value={vol.status} onValueChange={(v) => updateVolStatus.mutate({ id: vol.id, status: v })}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Job Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job Posting" : "Post New Job"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Job Title *</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Music Instructor" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Vocal" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Job description..." />
            </div>
            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={3} placeholder="Skills and qualifications..." />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : editingJob ? "Update" : "Post Job"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobs;
