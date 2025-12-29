import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Monitor, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.png";

export function Header() {
  const location = useLocation();
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="container flex h-16 items-center justify-between max-w-6xl mx-auto px-4">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Päronsplit" className="h-12 sm:h-16 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/dashboard"
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-all rounded-md",
              location.pathname === "/dashboard"
                ? "text-foreground bg-secondary/50"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
            )}
          >
            Hem
            {location.pathname === "/dashboard" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
          <Link
            to="/installningar"
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-all rounded-md",
              location.pathname === "/installningar"
                ? "text-foreground bg-secondary/50"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
            )}
          >
            Inställningar
            {location.pathname === "/installningar" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
          </Link>

          <div className="w-px h-6 bg-border mx-2" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-secondary/50 transition-colors">
                <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Växla tema</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Ljust</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Mörkt</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {profile && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {profile.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <span className="text-sm text-foreground font-medium max-w-[120px] truncate">
                {profile.name}
              </span>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 hover:bg-secondary/50 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="sr-only">Meny</span>
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
          <nav className="container max-w-6xl mx-auto px-4 py-6 flex flex-col gap-2">
            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "relative flex items-center px-4 py-3 text-base font-medium transition-all rounded-lg active:scale-[0.98]",
                location.pathname === "/dashboard"
                  ? "text-foreground bg-secondary/70"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 active:bg-secondary/60"
              )}
            >
              Hem
              {location.pathname === "/dashboard" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}
            </Link>
            <Link
              to="/installningar"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "relative flex items-center px-4 py-3 text-base font-medium transition-all rounded-lg active:scale-[0.98]",
                location.pathname === "/installningar"
                  ? "text-foreground bg-secondary/70"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 active:bg-secondary/60"
              )}
            >
              Inställningar
              {location.pathname === "/installningar" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}
            </Link>

            {/* Theme Selector for Mobile */}
            <div className="pt-4 pb-2 mt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-3 px-1">Tema</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={theme === "light" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex-col h-auto py-3 gap-1 transition-all",
                    theme === "light" && "bg-secondary/70 border-primary/20 border"
                  )}
                >
                  <Sun className="h-4 w-4" />
                  <span className="text-xs">Ljust</span>
                </Button>
                <Button
                  variant={theme === "dark" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex-col h-auto py-3 gap-1 transition-all",
                    theme === "dark" && "bg-secondary/70 border-primary/20 border"
                  )}
                >
                  <Moon className="h-4 w-4" />
                  <span className="text-xs">Mörkt</span>
                </Button>
                <Button
                  variant={theme === "system" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex-col h-auto py-3 gap-1 transition-all",
                    theme === "system" && "bg-secondary/70 border-primary/20 border"
                  )}
                >
                  <Monitor className="h-4 w-4" />
                  <span className="text-xs">System</span>
                </Button>
              </div>
            </div>

            {profile && (
              <div className="pt-4 mt-2 border-t border-border">
                <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-base font-semibold text-primary shrink-0">
                    {profile.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Inloggad som</p>
                    <p className="text-sm font-medium text-foreground truncate">{profile.name}</p>
                  </div>
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
