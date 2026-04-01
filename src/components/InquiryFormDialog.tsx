import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

const inquirySchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email").max(255, "Email too long"),
  phone: z.string().trim().max(20, "Phone too long").optional().or(z.literal("")),
  message: z.string().trim().max(1000, "Message too long").optional().or(z.literal("")),
});

interface InquiryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programSlug: string;
  programName: string;
}

const InquiryFormDialog = ({ open, onOpenChange, programSlug, programName }: InquiryFormDialogProps) => {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = inquirySchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("program_inquiries").insert({
      program_slug: programSlug,
      program_name: programName,
      full_name: result.data.full_name,
      email: result.data.email,
      phone: result.data.phone || null,
      message: result.data.message || null,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: "Failed to submit inquiry. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Inquiry Submitted!", description: "We'll get back to you soon." });
      setForm({ full_name: "", email: "", phone: "", message: "" });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Enquire about {programName}</DialogTitle>
          <DialogDescription>Fill in your details and we'll reach out to you shortly.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
            <Input
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Your full name"
              className="h-11"
            />
            {errors.full_name && <p className="text-destructive text-xs mt-1">{errors.full_name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email *</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="you@example.com"
              className="h-11"
            />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Phone</label>
            <Input
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="h-11"
            />
            {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Message</label>
            <Textarea
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              placeholder="Any specific questions or details..."
              rows={3}
            />
            {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
          </div>
          <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
            <Send className="h-4 w-4" />
            {loading ? "Submitting..." : "Submit Inquiry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InquiryFormDialog;
