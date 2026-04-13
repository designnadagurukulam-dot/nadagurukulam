import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const AdminCoupons = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const fetchCoupons = async () => { const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false }); setCoupons(data || []); setLoading(false); };
  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async () => {
    if (!code.trim() || !discountValue) return;
    const { error } = await supabase.from("coupons").insert({ code: code.trim().toUpperCase(), discount_type: discountType, discount_value: parseFloat(discountValue), max_uses: maxUses ? parseInt(maxUses) : null } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { setCode(""); setDiscountValue(""); setMaxUses(""); setShowForm(false); logActivity("coupon.created", "coupon", undefined, { code: code.trim().toUpperCase(), discountType, discountValue }); toast({ title: "Coupon created" }); fetchCoupons(); }
  };
  const toggleActive = async (coupon: any) => { await supabase.from("coupons").update({ is_active: !coupon.is_active } as any).eq("id", coupon.id); logActivity("coupon.toggled", "coupon", coupon.id, { is_active: !coupon.is_active, code: coupon.code }); fetchCoupons(); };
  const handleDelete = async (id: string) => { if (!confirm("Delete this coupon?")) return; await supabase.from("coupons").delete().eq("id", id); logActivity("coupon.deleted", "coupon", id); toast({ title: "Coupon deleted" }); fetchCoupons(); };

  return (
    <div className="space-y-6 pt-2 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">Coupons</h1>
          <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
          <p className="text-sm text-[#8C7B6B] mt-2">Manage discount codes</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl"><Plus className="h-4 w-4" /> New Coupon</Button>
      </motion.div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6 space-y-4">
          <h3 className="font-serif text-lg text-[#7D1E24]">Create Coupon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Code</label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME20" className="border-[#EDE3CC] rounded-xl" /></div>
            <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Type</label><Select value={discountType} onValueChange={setDiscountType}><SelectTrigger className="border-[#EDE3CC] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed (₹)</SelectItem></SelectContent></Select></div>
            <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Value</label><Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="border-[#EDE3CC] rounded-xl" /></div>
            <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Max Uses</label><Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Unlimited" className="border-[#EDE3CC] rounded-xl" /></div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCreate} disabled={!code || !discountValue} className="bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl">Create</Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-[#EDE3CC] rounded-xl">Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><div className="h-8 w-8 border-4 border-[#7D1E24] border-t-transparent rounded-full animate-spin" /></div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5E9CE] flex items-center justify-center mx-auto mb-4"><Ticket className="h-7 w-7 text-[#C49A3C]" /></div>
          <h3 className="font-serif text-xl text-[#7D1E24]">No Coupons Yet</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-4 flex items-center justify-between hover:bg-[#FAF6EE] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F5E9CE] flex items-center justify-center"><Ticket className="h-5 w-5 text-[#7D1E24]" /></div>
                <div>
                  <p className="font-mono font-bold text-[#3D2E22]">{c.code}</p>
                  <p className="text-xs text-[#8C7B6B]">{c.discount_type === "percentage" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}{c.max_uses ? ` · ${c.used_count}/${c.max_uses} used` : ` · ${c.used_count} used`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={c.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                <Button variant="ghost" size="sm" onClick={() => toggleActive(c)} className="hover:bg-[#F5E9CE]">{c.is_active ? <ToggleRight className="h-4 w-4 text-[#C49A3C]" /> : <ToggleLeft className="h-4 w-4 text-[#8C7B6B]" />}</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
