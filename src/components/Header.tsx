import { Link, useLocation } from "react-router-dom";
import { Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const location = useLocation();
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            D
          </div>
          <span className="text-xl font-bold text-foreground">Delarätt</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavItem to="/" icon={<Home size={20} />} label="Hem" active={location.pathname === "/"} />
          <NavItem
            to="/installningar"
            icon={<Settings size={20} />}
            label="Inställningar"
            active={location.pathname === "/installningar"}
          />
          {profile && (
            <Link
              to="/installningar"
              className="ml-2 flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5"
            >
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {profile.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-foreground">
                {profile.name}
              </span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 rounded-lg bg-primary/10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </Link>
  );
}
