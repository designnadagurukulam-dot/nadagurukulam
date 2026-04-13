import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";
import { Plus, Trash2, Pencil, Briefcase, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

const AdminJobs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [form, setForm] = useState({ title: "", department: "", location: "Muddenahalli, Karnataka", type: "full-time", description: "", requirements: "" });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({ queryKey: ["admin-jobs"], queryFn: async () => { const { data, error } = await supabase.from("job_postings").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const { data: volunteers = [], isLoading: volLoading } = useQuery({ queryKey: ["admin-volunteers"], queryFn: async () => { const { data, error } = await supabase.from("volunteer_applications").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => { if (data.id) { const { error } = await supabase.from("job_postings").update(data).eq("id", data.id); if (error) throw error; } else { const { error } = await supabase.from("job_postings").insert(data); if (error) throw error; } },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); logActivity(editingJob ? "job.updated" : "job.created", "job_posting", editingJob?.id, { title: form.title }); toast({ title: editingJob ? "Job updated" : "Job posted" }); resetForm(); },
  });
  const toggleMutation = useMutation({ mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { const { error } = await supabase.from("job_postings").update({ is_active }).eq("id", id); if (error) throw error; }, onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); logActivity("job.toggled", "job_posting", vars.id, { is_active: vars.is_active }); } });
  const deleteMutation = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("job_postings").delete().eq("id", id); if (error) throw error; }, onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }); logActivity("job.deleted", "job_posting", id); toast({ title: "Job deleted" }); } });
  const updateVolStatus = useMutation({ mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from("volunteer_applications").update({ status }).eq("id", id); if (error) throw error; }, onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ["admin-volunteers"] }); logActivity("volunteer.status_updated", "volunteer_application", vars.id, { status: vars.status }); toast({ title: "Status updated" }); } });

  const resetForm = () => { setForm({ title: "", department: "", location: "Muddenahalli, Karnataka", type: "full-time", description: "", requirements: "" }); setEditingJob(null); setShowForm(false); };
  const handleEdit = (job: any) => { setForm({ title: job.title, department: job.department || "", location: job.location || "", type: job.type || "full-time", description: job.description || "", requirements: job.requirements || "" }); setEditingJob(job); setShowForm(true); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); saveMutation.mutate(editingJob ? { ...form, id: editingJob.id } : form); };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">Jobs & Volunteers</h1>
          <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl gap-2"><Plus className="h-4 w-4" /> Post Job</Button>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList className="bg-[#FAF6EE] border border-[#EDE3CC] rounded-xl p-1">
          <TabsTrigger value="jobs" className="rounded-lg data-[state=active]:bg-[#7D1E24] data-[state=active]:text-white text-[#8C7B6B] gap-1.5"><Briefcase className="h-4 w-4" />Job Postings ({jobs.length})</TabsTrigger>
          <TabsTrigger value="volunteers" className="rounded-lg data-[state=active]:bg-[#7D1E24] data-[state=active]:text-white text-[#8C7B6B] gap-1.5"><Users className="h-4 w-4" />Volunteers ({volunteers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-3 mt-4">
          {jobsLoading ? <p className="text-[#8C7B6B]">Loading...</p> : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F5E9CE] flex items-center justify-center mx-auto mb-4"><Briefcase className="h-7 w-7 text-[#C49A3C]" /></div>
              <h3 className="font-serif text-xl text-[#7D1E24]">No Job Postings</h3>
            </div>
          ) : jobs.map((job: any) => (
            <div key={job.id} className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 flex items-start justify-between gap-4 hover:bg-[#FAF6EE] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-serif text-lg text-[#7D1E24]">{job.title}</h3>
                  <Badge className={job.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"}>{job.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="text-sm text-[#8C7B6B]">{job.department} • {job.location} • {job.type}</p>
                {job.description && <p className="text-sm text-[#8C7B6B] mt-2 line-clamp-2">{job.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={job.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: job.id, is_active: v })} />
                <Button variant="ghost" size="icon" onClick={() => handleEdit(job)} className="hover:bg-[#F5E9CE] text-[#7D1E24]"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(job.id)} className="hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="volunteers" className="space-y-3 mt-4">
          {volLoading ? <p className="text-[#8C7B6B]">Loading...</p> : volunteers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F5E9CE] flex items-center justify-center mx-auto mb-4"><Users className="h-7 w-7 text-[#C49A3C]" /></div>
              <h3 className="font-serif text-xl text-[#7D1E24]">No Volunteer Applications</h3>
            </div>
          ) : volunteers.map((vol: any) => (
            <div key={vol.id} className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:bg-[#FAF6EE] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#F5E9CE] flex items-center justify-center text-[#7D1E24] font-serif font-bold text-xs">{vol.full_name[0]}</div>
                    <h3 className="font-medium text-[#3D2E22]">{vol.full_name}</h3>
                  </div>
                  <p className="text-sm text-[#8C7B6B] mt-1">{vol.email} {vol.phone && `• ${vol.phone}`}</p>
                  {vol.area_of_interest && <p className="text-sm mt-1 text-[#3D2E22]"><span className="text-[#8C7B6B]">Interest:</span> {vol.area_of_interest}</p>}
                  {vol.availability && <p className="text-sm text-[#3D2E22]"><span className="text-[#8C7B6B]">Availability:</span> {vol.availability}</p>}
                  {vol.message && <p className="text-sm text-[#8C7B6B] mt-2">{vol.message}</p>}
                  <p className="text-xs text-[#8C7B6B] mt-2">{format(new Date(vol.created_at), "PPp")}</p>
                </div>
                <Select value={vol.status} onValueChange={(v) => updateVolStatus.mutate({ id: vol.id, status: v })}>
                  <SelectTrigger className="w-32 border-[#EDE3CC] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="accepted">Accepted</SelectItem><SelectItem value="dismissed">Dismissed</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl border-[#EDE3CC]">
          <DialogHeader><DialogTitle className="font-serif text-xl text-[#7D1E24]">{editingJob ? "Edit Job Posting" : "Post New Job"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Job Title *</label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-[#EDE3CC] rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Department</label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="border-[#EDE3CC] rounded-xl" /></div>
              <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Type</label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="border-[#EDE3CC] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full-time">Full-time</SelectItem><SelectItem value="part-time">Part-time</SelectItem><SelectItem value="contract">Contract</SelectItem><SelectItem value="volunteer">Volunteer</SelectItem></SelectContent></Select></div>
            </div>
            <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Location</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border-[#EDE3CC] rounded-xl" /></div>
            <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="border-[#EDE3CC] rounded-xl" /></div>
            <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Requirements</label><Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={3} className="border-[#EDE3CC] rounded-xl" /></div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetForm} className="border-[#EDE3CC] rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl">{saveMutation.isPending ? "Saving..." : editingJob ? "Update" : "Post Job"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobs;
