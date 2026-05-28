import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase parses recovery token from URL hash automatically and fires onAuthStateChange "PASSWORD_RECOVERY"
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // If user already has session (deep-link refresh), allow it
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    // After 2s, if not ready and no token in hash, show error
    const t = setTimeout(() => {
      if (!ready && !window.location.hash.includes("access_token")) setErrorMsg("This password reset link is invalid or has expired. Please request a new one.");
    }, 2000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast({ title: "Passwords do not match", variant: "destructive" }); return; }
    if (password.length < 8) { toast({ title: "Use at least 8 characters", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast({ title: "Could not update password", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Password updated. Please sign in." });
    await supabase.auth.signOut();
    navigate("/admin-login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl border border-brand-parchment p-8">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="Nada Gurukulam" className="h-14 mb-4" />
            <h1 className="font-serif text-xl text-brand-primary">Set a new password</h1>
          </div>

          {errorMsg ? (
            <p className="text-sm text-destructive text-center">{errorMsg}</p>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-brand-warm-grey mb-1.5 font-semibold">New Password</label>
                <div className="relative">
                  <Input type={showPass ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="h-12 rounded-xl border-brand-parchment pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-warm-grey">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-brand-warm-grey mb-1.5 font-semibold">Confirm Password</label>
                <Input type={showPass ? "text" : "password"} required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 rounded-xl border-brand-parchment" />
              </div>
              <Button type="submit" disabled={loading || !ready} className="w-full h-12 rounded-xl bg-brand-primary hover:bg-brand-primary-dark text-white gap-2">
                <Lock className="h-4 w-4" /> {loading ? "Updating..." : "Update Password"}
              </Button>
              {!ready && <p className="text-xs text-brand-warm-grey text-center">Validating reset link…</p>}
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
