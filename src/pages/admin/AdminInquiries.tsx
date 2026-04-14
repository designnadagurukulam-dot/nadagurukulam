import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";
import { Mail, Phone, MessageSquare, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border border-amber-200",
  resolved: "bg-green-50 text-green-700 border border-green-200",
  dismissed: "bg-gray-50 text-gray-500 border border-gray-200",
};

const AdminInquiries = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: async () => { const { data, error } = await supabase.from("program_inquiries").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from("program_inquiries").update({ status }).eq("id", id); if (error) throw error; },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] }); logActivity("inquiry.status_updated", "program_inquiry", vars.id, { status: vars.status }); toast({ title: "Status updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("program_inquiries").delete().eq("id", id); if (error) throw error; },
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] }); logActivity("inquiry.deleted", "program_inquiry", id); toast({ title: "Inquiry deleted" }); },
  });

  const filtered = filterStatus === "all" ? inquiries : inquiries.filter((i: any) => i.status === filterStatus);

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-brand-primary">Program Inquiries</h1>
              <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
            </div>
          </div>
          <p className="text-sm text-brand-warm-grey mt-2">Manage inquiries from prospective students</p>
        </motion.div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Filter:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 border-brand-parchment rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="dismissed">Dismissed</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4"><MessageSquare className="h-7 w-7 text-brand-gold" /></div>
          <h3 className="font-serif text-xl text-brand-primary">No Inquiries Found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-brand-primary-dark to-brand-primary hover:bg-brand-primary-dark">
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold">Name</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold">Program</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold hidden md:table-cell">Contact</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold hidden lg:table-cell">Message</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold">Status</TableHead>
                <TableHead className="text-brand-gold-light text-[11px] uppercase tracking-widest font-semibold hidden sm:table-cell">Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inq: any, i: number) => (
                <TableRow key={inq.id} className={`${i % 2 === 1 ? "bg-brand-cream" : "bg-white"} hover:bg-brand-cream transition-colors border-b border-brand-parchment`}>
                  <TableCell className="font-medium text-brand-charcoal">{inq.full_name}</TableCell>
                  <TableCell><Badge className="bg-brand-gold-pale text-brand-gold-dark border border-brand-parchment text-xs">{inq.program_name}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1 text-brand-warm-grey"><Mail className="h-3 w-3" /> {inq.email}</div>
                      {inq.phone && <div className="flex items-center gap-1 text-brand-warm-grey"><Phone className="h-3 w-3" /> {inq.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[200px]"><p className="text-xs text-brand-warm-grey truncate">{inq.message || "—"}</p></TableCell>
                  <TableCell>
                    <Select value={inq.status} onValueChange={(value) => updateStatusMutation.mutate({ id: inq.id, status: value })}>
                      <SelectTrigger className="w-28 h-8 text-xs border-brand-parchment rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="dismissed">Dismissed</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-brand-warm-grey">
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-brand-gold" />{format(new Date(inq.created_at), "dd MMM yyyy")}</div>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 text-red-500" onClick={() => deleteMutation.mutate(inq.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminInquiries;
