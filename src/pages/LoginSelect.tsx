import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import campusVault from "@/assets/campus/NGVaultPassage.jpg";

const LoginSelect = () => {
  return (
    <div className="min-h-screen flex bg-brand-cream">
      {/* Left — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={campusVault} alt="Campus heritage passage" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#5C1219]/95 via-[#7D1E24]/88 to-[#5C1219]/85" />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center w-full">
          <motion.img
            src={logo}
            alt="Nada Gurukulam"
            className="h-24 mb-10"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          <h2 className="font-serif text-5xl font-bold text-brand-gold-light text-center leading-tight">
            Welcome to<br /><span className="text-shimmer-gold">Nada Gurukulam</span>
          </h2>
          <p className="text-brand-warm-grey-light text-center mt-4 text-base italic font-light">
            Your journey into the divine world of Indian classical arts begins here.
          </p>
          <div className="mt-10 flex items-center gap-3 text-brand-gold/80">
            <Music className="h-5 w-5" />
            <span className="font-devanagari text-xl">रसो वै सः</span>
          </div>
        </div>
      </div>

      {/* Right — role selection */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="Nada Gurukulam" className="h-16" />
          </div>

          <h1 className="font-serif text-3xl font-bold text-brand-primary mb-2">Sign In</h1>
          <p className="text-brand-warm-grey mb-10">Choose how you'd like to sign in</p>

          <div className="space-y-4">
            <Button
              asChild
              variant="outline"
              className="w-full h-20 rounded-xl border-brand-parchment hover:border-brand-primary/50 hover:bg-brand-gold-pale/50 transition-all group"
            >
              <Link to="/login" className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-brand-gold-pale flex items-center justify-center group-hover:bg-brand-gold-pale transition-colors">
                  <GraduationCap className="h-6 w-6 text-brand-primary" />
                </div>
                <div className="text-left">
                  <span className="block text-base font-semibold text-brand-charcoal">Login as Student</span>
                  <span className="block text-sm text-brand-warm-grey">Access your courses and dashboard</span>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-20 rounded-xl border-brand-parchment hover:border-brand-gold/50 hover:bg-brand-gold-pale/50 transition-all group"
            >
              <Link to="/login" className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-brand-gold-pale flex items-center justify-center group-hover:bg-brand-gold-pale transition-colors">
                  <BookOpen className="h-6 w-6 text-brand-gold" />
                </div>
                <div className="text-left">
                  <span className="block text-base font-semibold text-brand-charcoal">Login as Educator</span>
                  <span className="block text-sm text-brand-warm-grey">Manage your courses and students</span>
                </div>
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-brand-warm-grey mt-10">
            <p className="mb-1">Don't have an account?</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <Link to="/register/student" className="text-brand-gold hover:text-brand-primary font-semibold underline">
                Register as Student
              </Link>
              <span className="text-brand-parchment">|</span>
              <Link to="/register/educator" className="text-brand-gold hover:text-brand-primary font-semibold underline">
                Register as Educator
              </Link>
            </div>
          </div>
          <p className="text-center text-sm mt-3">
            <Link to="/" className="text-brand-warm-grey hover:text-brand-primary transition-colors">
              ← Back to Home
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginSelect;
