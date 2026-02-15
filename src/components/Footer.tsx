import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Youtube, Instagram, Facebook, Linkedin } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="gradient-maroon text-primary-foreground pattern-overlay relative">
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <img src={logo} alt="Nada Gurukulam" className="h-14 w-auto mb-4 brightness-0 invert" />
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              A premier institution for Indian classical music and dance under Sri Sathya Sai University for Human Excellence. Nurturing talent through the traditional Guru-Shishya system.
            </p>
            <div className="flex gap-3 mt-5">
              {[Youtube, Instagram, Facebook, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="p-2.5 rounded-full bg-primary-foreground/10 hover:bg-secondary/30 hover:scale-110 transition-all duration-300">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/80">
              {[
                { label: "Home", to: "/" },
                { label: "About Us", to: "/about" },
                { label: "Admissions", to: "/admissions" },
                { label: "Faculty", to: "/faculty" },
                { label: "Gallery", to: "/gallery" },
                { label: "Contact", to: "/contact" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-primary-foreground hover:pl-1 transition-all duration-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-5">Our Courses</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/80">
              {["Carnatic Vocal", "Hindustani Vocal", "Bharatanatyam", "Mridangam", "Tabla", "Flute"].map((c) => (
                <li key={c}>
                  <Link to="/courses" className="hover:text-primary-foreground hover:pl-1 transition-all duration-300">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-5">Contact Us</h4>
            <ul className="space-y-3.5 text-sm text-primary-foreground/80">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-secondary" />
                <span>Sathya Sai Grama, Muddenahalli, Chikkaballapur, Karnataka - 562101</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-secondary" />
                <a href="mailto:info.nadagurukulam@sssuhe.ac.in" className="hover:text-primary-foreground transition-colors">
                  info.nadagurukulam@sssuhe.ac.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-secondary" />
                <span>+91 80 1234 5678</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 relative z-10">
        <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between text-xs text-primary-foreground/60">
          <p>© {new Date().getFullYear()} Nada Gurukulam. All rights reserved.</p>
          <p className="mt-1 md:mt-0">Sri Sathya Sai University for Human Excellence</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
