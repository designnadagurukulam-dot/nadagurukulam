import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import campusVault from "@/assets/campus/NGVaultPassage.jpg";

const LoginSelect = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={campusVault} alt="Campus heritage passage" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_69%_10%/0.92)] via-[hsl(0_69%_18%/0.85)] to-[hsl(345_75%_12%/0.8)]" />
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

      {/* Right — role selection */}
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
          <p className="text-muted-foreground mb-10">Choose how you'd like to sign in</p>

          <div className="space-y-4">
            <Button
              asChild
              variant="outline"
              className="w-full h-20 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <Link to="/login/student" className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <span className="block text-base font-semibold text-foreground">Login as Student</span>
                  <span className="block text-sm text-muted-foreground">Access your courses and dashboard</span>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-20 rounded-xl border-border/50 hover:border-secondary/50 hover:bg-secondary/5 transition-all group"
            >
              <Link to="/login/educator" className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-secondary" />
                </div>
                <div className="text-left">
                  <span className="block text-base font-semibold text-foreground">Login as Educator</span>
                  <span className="block text-sm text-muted-foreground">Manage your courses and students</span>
                </div>
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-10">
            <p className="mb-1">Don't have an account?</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <Link to="/register/student" className="text-primary font-medium hover:underline">
                Register as Student
              </Link>
              <span className="text-border">|</span>
              <Link to="/register/educator" className="text-primary font-medium hover:underline">
                Register as Educator
              </Link>
            </div>
          </div>
          <p className="text-center text-sm mt-3">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              ← Back to Home
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginSelect;
