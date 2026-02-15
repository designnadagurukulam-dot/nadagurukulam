import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Courses", to: "/courses" },
  { label: "Faculty", to: "/faculty" },
  { label: "Join Us", to: "/admissions" },
  { label: "Gallery", to: "/gallery" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/90 backdrop-blur-2xl shadow-lg border-b border-border"
          : "bg-background/60 backdrop-blur-xl border-b border-transparent"
      }`}
    >
      {/* Gold accent line on scroll */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[1px] transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: "linear-gradient(90deg, transparent, hsl(43 72% 52% / 0.4), transparent)" }}
      />

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logo} alt="Nada Gurukulam" className="h-12 w-auto transition-transform duration-300 group-hover:scale-105" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 hover:text-primary ${
                location.pathname === link.to
                  ? "text-primary font-semibold"
                  : "text-foreground/70"
              }`}
            >
              {link.label}
              {location.pathname === link.to && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(43 72% 52%), hsl(48 90% 60%))" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-2 ml-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="gap-1.5">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-muted-foreground">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="ml-3 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                Login
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 top-16 z-40 bg-background/98 backdrop-blur-2xl"
          >
            <nav className="container mx-auto flex flex-col gap-1 p-6 pt-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-4 rounded-xl text-lg font-medium transition-all block ${
                      location.pathname === link.to
                        ? "text-primary bg-primary/5 font-semibold border-l-4 border-secondary"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-6 pt-6 border-t border-border"
              >
                {user ? (
                  <div className="space-y-3">
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full gap-1.5 h-12 text-base">
                        <LayoutDashboard className="h-5 w-5" /> Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full gap-1.5 h-12 text-base text-muted-foreground" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                      <LogOut className="h-5 w-5" /> Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full h-12 text-base shadow-lg">Login</Button>
                  </Link>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
