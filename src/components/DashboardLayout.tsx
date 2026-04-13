import { ReactNode } from "react";
import { Search, Bell } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";

const roleLabel = (role: string | null | undefined): string => {
  if (role === "instructor") return "Tutor";
  if (role === "admin" || role === "super_admin") return "Admin";
  return "Student";
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { profile, role } = useAuth();
  const name = profile?.display_name || "there";

  return (
    <div className="flex min-h-screen w-full bg-brand-cream">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Top greeting bar */}
        <div className="px-4 pt-14 md:px-8 md:pt-6 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-brand-warm-grey">Sai Ram</p>
            <h2 className="font-serif text-2xl font-semibold text-brand-primary leading-tight">{roleLabel(role)} {name}</h2>
            <div className="w-10 h-0.5 bg-brand-gold mt-1" />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-brand-warm-grey" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-brand-parchment bg-white text-brand-charcoal placeholder:text-brand-warm-grey-light focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 w-52"
              />
            </div>
            <button className="w-9 h-9 rounded-full bg-white border border-brand-parchment flex items-center justify-center hover:bg-brand-cream-dark transition-colors relative">
              <Bell className="w-4 h-4 text-brand-warm-grey" />
            </button>
          </div>
        </div>
        <div className="px-4 md:px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
