import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, List, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/dashboard", label: "Hem", icon: Home },
  { to: "/analys", label: "Analys", icon: BarChart3 },
  { to: "/aktivitet", label: "Aktivitet", icon: List },
  { to: "/installningar", label: "Inställningar", icon: Settings },
];

export function SideNav() {
  const location = useLocation();

  return (
    <>
      {/* Desktop sidebar - Notion-inspired */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-14 px-4 border-b border-sidebar-border/50">
            <Link to="/dashboard" className="flex items-center hover:opacity-70 transition-opacity">
              <img src={logo} alt="Päronsplit" className="h-16 w-auto" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary"
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile bottom navigation - Notion-inspired */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/98 backdrop-blur-md shadow-notion-lg">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
