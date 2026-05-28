import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Music, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getRoleDashboardPath } from "@/components/RoleProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import campusVault from "@/assets/campus/NGVaultPassage.jpg";

const Login = () => {
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
      if (!isVerified) { navigate("/pending-approval", { replace: true }); return; }
      navigate(getRoleDashboardPath(role), { replace: true });
    }
  }, [loginSuccess, user, role, isVerified, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!" });
      setLoginSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex bg-brand-cream">
      {/* Left — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={campusVault} alt="Campus heritage passage" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#5C1219]/95 via-[#7D1E24]/88 to-[#5C1219]/85" />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center w-full">
          <motion.img src={logo} alt="Nada Gurukulam" className="h-24 mb-10" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} />
          <h2 className="font-serif text-5xl font-bold text-brand-gold-light text-center leading-tight">
            Welcome to<br /><span className="text-shimmer-gold">Nada Gurukulam</span>
          </h2>
          <p className="text-brand-warm-grey-light text-center mt-4 text-base italic font-light">Where classical arts find their home.</p>
          <p className="text-brand-warm-grey text-center text-sm mt-2 tracking-widest uppercase">रसो वै सः</p>
          <div className="mt-10 flex items-center gap-3 text-brand-gold/80">
            <Music className="h-5 w-5" />
            <span className="font-devanagari text-xl">नाद गुरुकुलम्</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="Nada Gurukulam" className="h-16" />
          </div>

          <h1 className="font-serif text-3xl font-bold text-brand-primary mt-6 mb-2">Sign In</h1>
          <p className="text-brand-warm-grey text-sm mb-6">Access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-brand-warm-grey mb-1.5 font-semibold">Email</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl border-brand-parchment bg-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-[14px] text-brand-charcoal" />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-brand-warm-grey mb-1.5 font-semibold">Password</label>
              <div className="relative">
                <Input type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl border-brand-parchment bg-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-[14px] text-brand-charcoal" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-warm-grey hover:text-brand-charcoal" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl text-base bg-brand-primary hover:bg-brand-primary-dark text-white shadow-sm" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm text-brand-warm-grey mt-8 space-y-3">
            <Link to="/register/student" className="block text-brand-gold hover:text-brand-primary font-semibold underline">
              New student? Register here →
            </Link>
            <Link to="/register/educator" className="block text-brand-warm-grey hover:text-brand-primary underline">
              New instructor? Register here →
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-brand-parchment text-center">
            <Link to="/admin-login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-warm-grey hover:text-brand-primary transition-colors">
              <Shield className="h-3.5 w-3.5" /> Sign in as Admin
            </Link>
          </div>

          <p className="text-center text-sm mt-6">
            <Link to="/" className="text-brand-warm-grey hover:text-brand-primary transition-colors">← Back to Home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
