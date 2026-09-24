import { ReactNode, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Sparkles, Inbox } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardCounts } from "@/hooks/useDashboardCounts";
import { getNavItems } from "@/config/dashboardNav";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { formatBadgeCount } from "@/lib/utils";

const roleLabel = (role: string | null | undefined): string => {
  if (role === "instructor") return "Faculty";
  if (role === "admin" || role === "super_admin") return "Admin";
  return "Student";
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { profile, role } = useAuth();
  const navigate = useNavigate();
  const name = profile?.display_name || "there";

  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: counts = {} } = useDashboardCounts();
  const navItems = useMemo(() => getNavItems(role), [role]);

  const notifications = useMemo(
    () => navItems.filter((item) => (counts[item.label] || 0) > 0).map((item) => ({ ...item, count: counts[item.label] })),
    [navItems, counts]
  );
  const totalCount = notifications.reduce((sum, n) => sum + n.count, 0);

  const searchTargets = useMemo(
    () =>
      navItems.filter((item) =>
        search.trim() ? item.label.toLowerCase().includes(search.trim().toLowerCase()) : false
      ),
    [navItems, search]
  );

  const runSearch = () => {
    if (searchTargets.length > 0) {
      navigate(searchTargets[0].to);
      setSearch("");
      setMobileSearchOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-brand-cream">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Top greeting bar */}
        <div className="px-3 pt-12 md:px-8 md:pt-6 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-gradient-to-r from-brand-gold/20 to-brand-gold/10 text-brand-gold px-2.5 py-0.5 rounded-full border border-brand-gold/20">
                <Sparkles className="w-3 h-3" /> Sai Ram
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary leading-tight mt-1">{roleLabel(role)} {name}</h2>
            <div className="w-10 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile search icon */}
            <button
              onClick={() => setMobileSearchOpen((o) => !o)}
              className="sm:hidden w-11 h-11 rounded-full bg-white border border-brand-parchment flex items-center justify-center hover:bg-brand-cream-dark transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-brand-warm-grey" />
            </button>
            {/* Desktop search bar */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-brand-warm-grey" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Search..."
                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-brand-parchment bg-white text-brand-charcoal placeholder:text-brand-warm-grey-light focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 w-52"
              />
              {search.trim() && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-brand-parchment rounded-xl shadow-lg overflow-hidden z-20">
                  {searchTargets.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-brand-warm-grey">No matching sections</p>
                  ) : (
                    searchTargets.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSearch("")}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-brand-charcoal hover:bg-brand-cream transition-colors"
                      >
                        <item.icon className="w-3.5 h-3.5 text-brand-gold" /> {item.label}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <button
                  className="w-11 h-11 rounded-full bg-white border border-brand-parchment flex items-center justify-center hover:bg-brand-cream-dark transition-colors relative group"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 text-brand-warm-grey group-hover:text-brand-gold transition-colors" />
                  {totalCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-brand-gold px-1 text-[9px] text-brand-primary-dark">
                      {formatBadgeCount(totalCount)}
                    </Badge>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-2 rounded-2xl">
                <p className="px-2 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-warm-grey">Notifications</p>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Inbox className="w-8 h-8 text-brand-warm-grey-light mb-2" />
                    <p className="text-sm text-brand-warm-grey">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <Link
                        key={n.to}
                        to={n.to}
                        onClick={() => setNotifOpen(false)}
                        className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-brand-cream transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-gold/15 flex items-center justify-center shrink-0">
                          <n.icon className="w-4 h-4 text-brand-gold" />
                        </div>
                        <span className="flex-1 text-sm text-brand-charcoal">{n.label}</span>
                        <Badge className="h-5 min-w-5 rounded-full bg-brand-gold px-1.5 text-[10px] text-brand-primary-dark">
                          {formatBadgeCount(n.count)}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Mobile search panel */}
        {mobileSearchOpen && (
          <div className="sm:hidden px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-brand-warm-grey" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-brand-parchment bg-white text-brand-charcoal placeholder:text-brand-warm-grey-light focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
              />
            </div>
            {search.trim() && (
              <div className="mt-1 bg-white border border-brand-parchment rounded-xl shadow-lg overflow-hidden">
                {searchTargets.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-brand-warm-grey">No matching sections</p>
                ) : (
                  searchTargets.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => { setSearch(""); setMobileSearchOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-brand-charcoal hover:bg-brand-cream transition-colors"
                    >
                      <item.icon className="w-3.5 h-3.5 text-brand-gold" /> {item.label}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className="px-3 md:px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
