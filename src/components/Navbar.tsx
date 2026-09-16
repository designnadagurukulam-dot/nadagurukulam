import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getRoleDashboardPath } from "@/components/RoleProtectedRoute";
import ConfirmDialog from "@/components/ConfirmDialog";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Courses", to: "/courses" },
  { label: "Faculty", to: "/faculty" },
  { label: "Events", to: "/events" },
  { label: "Gallery", to: "/gallery" },
  { label: "Admission", to: "/admission" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const dashboardPath = getRoleDashboardPath(role);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-2xl shadow-xl border-b border-border"
          : "bg-background/50 backdrop-blur-xl border-b border-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div
        className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="container mx-auto flex h-[76px] items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="Nada Gurukulam" className="h-12 w-auto transition-transform duration-300 group-hover:scale-105" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 hover:text-primary ${
                location.pathname === link.to
                  ? "text-primary font-semibold"
                  : "text-foreground/65 hover:text-foreground"
              }`}
            >
              {link.label}
              {location.pathname === link.to && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-[2px] left-[20%] right-[20%] h-[3px] rounded-full bg-gradient-to-r from-secondary via-accent to-secondary"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={() => navigate(dashboardPath)} className="gap-1.5 border-secondary/30 hover:border-secondary hover:bg-secondary/5">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSignOutConfirm(true)} className="gap-1.5 text-muted-foreground">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="ml-4 bg-background text-foreground border border-border hover:bg-muted shadow-lg hover:shadow-xl transition-all px-6 font-semibold">
                Login
              </Button>
            </Link>
          )}
        </nav>

        <button
          className="lg:hidden p-2.5 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 top-[76px] z-40"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            {/* Backdrop overlay */}
            <div className="absolute inset-0 bg-background/98 backdrop-blur-2xl" />
            <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary" />
            <nav className="container mx-auto flex flex-col gap-1 p-6 pt-6 relative z-10">
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
                    <Link to={dashboardPath} onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full gap-1.5 h-12 text-base border-secondary/30">
                        <LayoutDashboard className="h-5 w-5" /> Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full gap-1.5 h-12 text-base text-muted-foreground" onClick={() => setShowSignOutConfirm(true)}>
                      <LogOut className="h-5 w-5" /> Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full h-12 text-base shadow-lg font-semibold">Login</Button>
                  </Link>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        variant="destructive"
        onConfirm={() => { handleSignOut(); setMobileOpen(false); }}
      />
    </header>
  );
};

export default Navbar;
