import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getRoleDashboardPath } from "@/components/RoleProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import campusVault from "@/assets/campus/NGVaultPassage.jpg";

interface LoginProps {
  roleType: "student" | "educator";
}

const Login = ({ roleType }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { signIn, role, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const title = roleType === "student" ? "Student Sign In" : "Educator Sign In";
  const subtitle = roleType === "student"
    ? "Access your courses and learning dashboard"
    : "Access your teaching dashboard and manage courses";

  useEffect(() => {
    if (loginSuccess && user && role) {
      navigate(getRoleDashboardPath(role), { replace: true });
    }
  }, [loginSuccess, user, role, navigate]);

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
    <div className="min-h-screen flex">
      {/* Left — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={campusVault} alt="Campus heritage passage" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(358_68%_10%/0.92)] via-[hsl(358_68%_18%/0.85)] to-[hsl(358_68%_12%/0.8)]" />
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          style={{ background: "linear-gradient(135deg, hsl(43 72% 52% / 0.15), transparent, hsl(43 72% 52% / 0.15))", backgroundSize: "200% 200%" }}
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
            Your journey into the divine world of Indian classical arts begins here.
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

          <h1 className="font-serif text-3xl text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground mb-8">{subtitle}</p>

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

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link to={roleType === "educator" ? "/register/educator" : "/register/student"} className="text-primary font-medium hover:underline">
              Create Account
            </Link>
          </p>
          <p className="text-center text-sm mt-3">
            <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
              ← Back to Role Selection
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
