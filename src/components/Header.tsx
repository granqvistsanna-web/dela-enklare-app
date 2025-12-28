import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

export function Header() {
  const location = useLocation();
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between max-w-6xl mx-auto px-4">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <img src={logo} alt="Päronsplit" className="h-10 w-auto" />
        </Link>

        <nav className="flex items-center gap-8">
          <Link
            to="/"
            className={cn(
              "text-sm font-medium transition-colors",
              location.pathname === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Hem
          </Link>
          <Link
            to="/installningar"
            className={cn(
              "text-sm font-medium transition-colors",
              location.pathname === "/installningar" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Inställningar
          </Link>
          {profile && (
            <span className="text-sm text-muted-foreground font-medium">
              {profile.name}
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
