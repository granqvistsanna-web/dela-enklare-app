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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between max-w-6xl mx-auto">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Päronsplit" className="h-10 sm:h-12 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Link
            to="/dashboard"
            className={cn(
              "text-sm font-medium transition-colors",
              location.pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Växla tema</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
            <span className="text-sm text-muted-foreground font-medium">
              {profile.name}
            </span>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10"
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
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container max-w-6xl mx-auto py-4 flex flex-col gap-4">
            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-base font-medium transition-colors py-2",
                location.pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Hem
            </Link>
            <Link
              to="/installningar"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-base font-medium transition-colors py-2",
                location.pathname === "/installningar" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Inställningar
            </Link>

            {/* Theme Selector for Mobile */}
            <div className="py-2">
              <p className="text-xs text-muted-foreground mb-2">Tema</p>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className="flex-1"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Ljust</span>
                </Button>
                <Button
                  variant={theme === "dark" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className="flex-1"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Mörkt</span>
                </Button>
                <Button
                  variant={theme === "system" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  className="flex-1"
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>System</span>
                </Button>
              </div>
            </div>

            {profile && (
              <div className="py-2 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Inloggad som <span className="font-medium text-foreground">{profile.name}</span>
                </p>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
