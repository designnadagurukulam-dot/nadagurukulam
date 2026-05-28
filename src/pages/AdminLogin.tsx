import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getRoleDashboardPath } from "@/components/RoleProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { signIn, role, user, isVerified } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (loginSuccess && user && role) {
      if (role !== "admin" && role !== "super_admin") {
        toast({ title: "Access denied", description: "This portal is for administrators only.", variant: "destructive" });
        return;
      }
      if (!isVerified) {
        navigate("/pending-approval", { replace: true });
        return;
      }
      navigate(getRoleDashboardPath(role), { replace: true });
    }
  }, [loginSuccess, user, role, isVerified, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error, variant: "destructive" });
    } else {
      setLoginSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-brand-parchment p-8">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Nada Gurukulam" className="h-16 mb-4" />
            <div className="flex items-center gap-2 text-brand-warm-grey">
              <Shield className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest font-medium">Admin & Super Admin Access Only</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-brand-warm-grey mb-1.5 font-semibold">Email</label>
              <Input
                type="email"
                placeholder="admin@nadagurukulam.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-brand-parchment bg-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-[14px] text-brand-charcoal placeholder:text-brand-warm-grey-light"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-brand-warm-grey mb-1.5 font-semibold">Password</label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-brand-parchment bg-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-[14px] text-brand-charcoal placeholder:text-brand-warm-grey-light"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-warm-grey hover:text-brand-charcoal transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl text-base bg-brand-primary hover:bg-brand-primary-dark text-white" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center text-xs pt-1">
              <a href="/forgot-password" className="text-brand-warm-grey hover:text-brand-primary underline">Forgot password?</a>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
