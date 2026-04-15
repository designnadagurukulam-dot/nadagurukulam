import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Youtube, Instagram, Facebook, Linkedin } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden">
      {/* Gold shimmer line at top */}
      <div className="h-[2px] shimmer-line" style={{ background: "linear-gradient(90deg, hsl(358 68% 28%), hsl(33 62% 58%), hsl(35 62% 65%), hsl(33 62% 58%), hsl(358 68% 28%))" }} />

      <div className="relative text-primary-foreground overflow-hidden" style={{ backgroundColor: "rgb(134, 25, 28)" }}>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 25% 25%, hsl(0 0% 100%) 1px, transparent 1px), radial-gradient(circle at 75% 75%, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        {/* Decorative golden mandala watermark */}
        <motion.div
          className="absolute -right-32 -bottom-32 opacity-[0.04] pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 80, ease: "linear" }}
        >
          <svg width="500" height="500" viewBox="0 0 200 200" fill="none" className="text-secondary">
            <circle cx="100" cy="100" r="95" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="75" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="55" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="35" stroke="currentColor" strokeWidth="0.5" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
              <line key={angle} x1="100" y1="5" x2="100" y2="40" stroke="currentColor" strokeWidth="0.5" transform={`rotate(${angle} 100 100)`} />
            ))}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <path key={`p-${angle}`} d="M100 10 L103 45 L100 38 L97 45 Z" fill="currentColor" opacity="0.5" transform={`rotate(${angle} 100 100)`} />
            ))}
          </svg>
        </motion.div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src={logo} alt="Nada Gurukulam" className="h-16 w-auto brightness-0 invert" />
              </div>
              <p className="text-sm text-primary-foreground/65 leading-relaxed">
                A premier institution for Indian classical music and dance under Sri Sathya Sai University for Human Excellence. Nurturing talent through the traditional Guru-Shishya system.
              </p>
              <div className="grid grid-cols-4 xs:flex gap-3 mt-6">
                {[
                  { Icon: Youtube, href: "#" },
                  { Icon: Instagram, href: "#" },
                  { Icon: Facebook, href: "#" },
                  { Icon: Linkedin, href: "#" },
                ].map(({ Icon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    className="p-2.5 rounded-full bg-primary-foreground/8 hover:bg-secondary/30 hover:scale-110 hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300 border border-primary-foreground/10 hover:border-secondary/30 flex items-center justify-center"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-6 relative inline-block">
                Quick Links
                <span className="absolute -bottom-1 left-0 w-10 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, hsl(33 62% 58%), transparent)" }} />
              </h4>
              <ul className="space-y-3 text-sm text-primary-foreground/65">
                {[
                  { label: "Home", to: "/" },
                  { label: "About Us", to: "/about" },
                  
                  { label: "Faculty", to: "/faculty" },
                  { label: "Gallery", to: "/gallery" },
                  { label: "Contact", to: "/contact" },
                ].map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="hover:text-secondary hover:pl-2 transition-all duration-300 inline-flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-secondary/40 group-hover:bg-secondary group-hover:w-2 transition-all duration-300" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Courses */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-6 relative inline-block">
                Our Courses
                <span className="absolute -bottom-1 left-0 w-10 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, hsl(33 62% 58%), transparent)" }} />
              </h4>
              <ul className="space-y-3 text-sm text-primary-foreground/65">
                {["Carnatic Vocal", "Hindustani Vocal", "Bharatanatyam", "Mridangam", "Tabla", "Sitar"].map((c) => (
                  <li key={c}>
                    <Link to="/courses" className="hover:text-secondary hover:pl-2 transition-all duration-300 inline-flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-secondary/40 group-hover:bg-secondary group-hover:w-2 transition-all duration-300" />
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-6 relative inline-block">
                Contact Us
                <span className="absolute -bottom-1 left-0 w-10 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, hsl(33 62% 58%), transparent)" }} />
              </h4>
              <ul className="space-y-4 text-sm text-primary-foreground/65">
                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0 mt-0.5 border border-secondary/10">
                    <MapPin className="h-4 w-4 text-secondary" />
                  </div>
                  <span>Sathya Sai Grama, Muddenahalli, Chikkaballapur, Karnataka - 562101</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0 border border-secondary/10">
                    <Mail className="h-4 w-4 text-secondary" />
                  </div>
                  <a href="mailto:info.nadagurukulam@sssuhe.ac.in" className="hover:text-secondary transition-colors">
                    info.nadagurukulam@sssuhe.ac.in
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0 border border-secondary/10">
                    <Phone className="h-4 w-4 text-secondary" />
                  </div>
                  <span>+91 80 1234 5678</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/8 relative z-10" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between text-[11px] sm:text-xs text-primary-foreground/40 flex-wrap gap-1 text-center">
            <p>© {new Date().getFullYear()} Nada Gurukulam. All rights reserved.</p>
            <p className="mt-1 md:mt-0">Sri Sathya Sai University for Human Excellence</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
