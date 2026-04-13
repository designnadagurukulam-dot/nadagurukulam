import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Music, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getRoleDashboardPath } from "@/components/RoleProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import campusVault from "@/assets/campus/NGVaultPassage.jpg";

type LoginTab = "student" | "tutor";

const Login = () => {
  const [tab, setTab] = useState<LoginTab>("student");
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
      if (!isVerified) {
        navigate("/pending-approval", { replace: true });
        return;
      }
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

  const registerLink = tab === "student" ? "/register/student" : "/register/tutor";
  const registerLabel = tab === "student" ? "New student? Register here →" : "New tutor? Register here →";

  return (
    <div className="min-h-screen flex">
      {/* Left — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={campusVault} alt="Campus heritage passage" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(231_72%_12%/0.94)] via-[hsl(231_72%_20%/0.88)] to-[hsl(231_72%_15%/0.85)]" />
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          style={{ background: "linear-gradient(135deg, hsl(43 85% 52% / 0.15), transparent, hsl(43 85% 52% / 0.15))", backgroundSize: "200% 200%" }}
        />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center w-full">
          <motion.img
            src={logo}
            alt="Nada Gurukulam"
            className="h-24 mb-10"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          <h2 className="font-serif text-3xl text-primary-foreground mb-4" style={{ textShadow: "0 2px 20px hsl(0 0% 0% / 0.5)" }}>
            Welcome to<br /><span className="text-shimmer-gold">Nada Gurukulam</span>
          </h2>
          <p className="text-primary-foreground/65 text-lg max-w-md leading-relaxed">
            Where classical arts find their home.
          </p>
          <div className="mt-10 flex items-center gap-3 text-secondary/80">
            <Music className="h-5 w-5" />
            <span className="font-devanagari text-xl">रसो वै सः</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="Nada Gurukulam" className="h-16" />
          </div>

          <h1 className="font-serif text-3xl text-foreground mb-2">Sign In</h1>
          <p className="text-muted-foreground mb-6">Access your dashboard</p>

          {/* Role tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setTab("student")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all border-2 ${
                tab === "student"
                  ? "border-secondary bg-secondary/10 text-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:border-border/80"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Student
            </button>
            <button
              onClick={() => setTab("tutor")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all border-2 ${
                tab === "tutor"
                  ? "border-secondary bg-secondary/10 text-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:border-border/80"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Tutor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-border/50 focus:border-secondary focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-border/50 focus:border-secondary focus:ring-secondary/20"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl text-base shadow-lg hover:shadow-xl transition-all" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-8">
            <Link to={registerLink} className="text-primary font-medium hover:underline">
              {registerLabel}
            </Link>
          </div>

          <p className="text-center text-sm mt-3">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              ← Back to Home
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/50 mt-6">
            <Link to="/admin-login" className="hover:text-muted-foreground transition-colors">
              Institution staff? Access admin portal →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
