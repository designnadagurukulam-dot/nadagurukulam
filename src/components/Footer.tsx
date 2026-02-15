import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Youtube, Instagram, Facebook, Linkedin } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden">
      {/* Gold shimmer line at top */}
      <div className="h-[2px] shimmer-line" style={{ background: "linear-gradient(90deg, hsl(0 69% 33%), hsl(43 72% 52%), hsl(0 69% 33%))" }} />

      <div className="gradient-maroon text-primary-foreground pattern-overlay relative">
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* About */}
            <div>
              <img src={logo} alt="Nada Gurukulam" className="h-14 w-auto mb-5 brightness-0 invert" />
              <p className="text-sm text-primary-foreground/75 leading-relaxed">
                A premier institution for Indian classical music and dance under Sri Sathya Sai University for Human Excellence. Nurturing talent through the traditional Guru-Shishya system.
              </p>
              <div className="flex gap-3 mt-6">
                {[
                  { Icon: Youtube, href: "#" },
                  { Icon: Instagram, href: "#" },
                  { Icon: Facebook, href: "#" },
                  { Icon: Linkedin, href: "#" },
                ].map(({ Icon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    className="p-2.5 rounded-full bg-primary-foreground/10 hover:bg-secondary/40 hover:scale-110 hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300"
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
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-secondary rounded-full" />
              </h4>
              <ul className="space-y-3 text-sm text-primary-foreground/75">
                {[
                  { label: "Home", to: "/" },
                  { label: "About Us", to: "/about" },
                  { label: "Admissions", to: "/admissions" },
                  { label: "Faculty", to: "/faculty" },
                  { label: "Gallery", to: "/gallery" },
                  { label: "Contact", to: "/contact" },
                ].map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="hover:text-secondary hover:pl-2 transition-all duration-300 inline-flex items-center gap-1">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
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
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-secondary rounded-full" />
              </h4>
              <ul className="space-y-3 text-sm text-primary-foreground/75">
                {["Carnatic Vocal", "Hindustani Vocal", "Bharatanatyam", "Mridangam", "Tabla", "Sitar"].map((c) => (
                  <li key={c}>
                    <Link to="/courses" className="hover:text-secondary hover:pl-2 transition-all duration-300">
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
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-secondary rounded-full" />
              </h4>
              <ul className="space-y-4 text-sm text-primary-foreground/75">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-secondary" />
                  </div>
                  <span>Sathya Sai Grama, Muddenahalli, Chikkaballapur, Karnataka - 562101</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-secondary" />
                  </div>
                  <a href="mailto:info.nadagurukulam@sssuhe.ac.in" className="hover:text-secondary transition-colors">
                    info.nadagurukulam@sssuhe.ac.in
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-secondary" />
                  </div>
                  <span>+91 80 1234 5678</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 relative z-10">
          <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between text-xs text-primary-foreground/50">
            <p>© {new Date().getFullYear()} Nada Gurukulam. All rights reserved.</p>
            <p className="mt-1 md:mt-0">Sri Sathya Sai University for Human Excellence</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
