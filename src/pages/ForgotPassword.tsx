import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Could not send email", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl border border-brand-parchment p-8">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="Nada Gurukulam" className="h-14 mb-4" />
            <div className="flex items-center gap-2 text-brand-warm-grey">
              <Shield className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest font-medium">Admin Password Reset</span>
            </div>
          </div>

          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-brand-charcoal text-sm">
                If an admin account exists for <span className="font-semibold">{email}</span>, a password reset link has been sent.
              </p>
              <p className="text-brand-warm-grey text-xs">Check your inbox (and spam folder).</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-brand-warm-grey mb-1.5 font-semibold">Admin Email</label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@nadagurukulam.org" className="h-12 rounded-xl border-brand-parchment" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-brand-primary hover:bg-brand-primary-dark text-white">
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}

          <Link to="/admin-login" className="mt-6 flex items-center justify-center gap-1.5 text-xs text-brand-warm-grey hover:text-brand-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
