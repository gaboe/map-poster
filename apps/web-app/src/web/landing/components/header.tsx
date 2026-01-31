import { Button } from "@/shared/ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import { useUser } from "@/hooks/users/use-user";
import logo from "@/assets/logo.png";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/infrastructure/lib/utils";

export function Header() {
  const { user } = useUser();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActivePath = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="w-full border-b bg-background backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
        {/* Logo & Name */}
        <a
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src={logo}
            alt="map-poster Logo"
            className="w-7 h-7"
          />
          <span className="text-2xl font-bold">
            map-poster
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a
            href="/"
            className={cn(
              "relative py-1 hover:text-foreground transition-colors",
              isActivePath("/")
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            Home
            {isActivePath("/") && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </a>
          <a
            href="/newsroom"
            className={cn(
              "relative py-1 hover:text-foreground transition-colors",
              isActivePath("/newsroom")
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            Newsroom
            {isActivePath("/newsroom") && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </a>
          <a
            href="/contact"
            className={cn(
              "relative py-1 hover:text-foreground transition-colors",
              isActivePath("/contact")
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            Contact
            {isActivePath("/contact") && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </a>
        </nav>

        {/* Desktop Auth & Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {/* Desktop Auth Button */}
          <div className="hidden md:block">
            {user ? (
              <Link to="/app/dashboard">
                <Button size="sm">To App</Button>
              </Link>
            ) : (
              <Link to="/sign-in">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="flex flex-col px-4 py-4 space-y-4">
            <a
              href="/"
              className={cn(
                "relative hover:text-foreground py-2 text-base font-medium transition-colors border-l-4",
                isActivePath("/")
                  ? "text-foreground border-orange-500"
                  : "text-muted-foreground border-transparent"
              )}
              onClick={() => {
                setMobileMenuOpen(false);
              }}
            >
              <span className="pl-3">Home</span>
            </a>
            <a
              href="/newsroom"
              className={cn(
                "relative hover:text-foreground py-2 text-base font-medium transition-colors border-l-4",
                isActivePath("/newsroom")
                  ? "text-foreground border-orange-500"
                  : "text-muted-foreground border-transparent"
              )}
              onClick={() => {
                setMobileMenuOpen(false);
              }}
            >
              <span className="pl-3">Newsroom</span>
            </a>
            <a
              href="/contact"
              className={cn(
                "relative hover:text-foreground py-2 text-base font-medium transition-colors border-l-4",
                isActivePath("/contact")
                  ? "text-foreground border-orange-500"
                  : "text-muted-foreground border-transparent"
              )}
              onClick={() => {
                setMobileMenuOpen(false);
              }}
            >
              <span className="pl-3">Contact</span>
            </a>

            {/* Mobile Auth Button */}
            <div className="pt-4 border-t">
              {user ? (
                <Link
                  to="/app/dashboard"
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                >
                  <Button size="sm" className="w-full">
                    To App
                  </Button>
                </Link>
              ) : (
                <Link
                  to="/sign-in"
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                >
                  <Button size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
