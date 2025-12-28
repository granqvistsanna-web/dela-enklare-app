import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const location = useLocation();
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors">
          Delarätt
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className={cn(
              "text-sm transition-colors",
              location.pathname === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Hem
          </Link>
          <Link
            to="/installningar"
            className={cn(
              "text-sm transition-colors",
              location.pathname === "/installningar" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Inställningar
          </Link>
          {profile && (
            <span className="text-sm text-muted-foreground">
              {profile.name}
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
