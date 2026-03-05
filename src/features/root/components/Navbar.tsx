"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  Navbar,
  NavbarButton,
  NavbarLogo,
  NavbarThemeToggle,
  NavBody,
  NavItems,
} from "@/components/ui/resizable-navbar";
import { getAvatarFallback } from "@/lib/avatar";
import { useUser } from "@/providers/UserProvider";
import Link from "next/link";
import { useState } from "react";

export const RootNavbar = () => {
  const { navUser } = useUser();
  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Pricing", link: "#pricing" },
    { name: "Contact", link: "#contact" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLoggedIn = !!navUser;
  const avatarFallback = getAvatarFallback({
    name: navUser?.userName ?? "User",
  });

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        <div className="flex items-center gap-4">
          <NavbarThemeToggle />
          {isLoggedIn ? (
            <Link href="/dashboard/profile" aria-label="Profile">
              <Avatar className="ring-primary/30 hover:ring-primary/50 h-8 w-8 ring-2 ring-offset-2 transition">
                <AvatarImage
                  src={navUser?.avatar}
                  alt={navUser?.userName ?? "User"}
                />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <NavbarButton href="/login" variant="secondary">
              Login
            </NavbarButton>
          )}
          <NavbarButton href="/custom" variant="primary">
            Start Customizing
          </NavbarButton>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <a
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="relative text-neutral-600 dark:text-neutral-300"
            >
              <span className="block">{item.name}</span>
            </a>
          ))}
          <div className="flex w-full flex-col gap-4">
            <div className="flex w-full justify-end">
              <NavbarThemeToggle />
            </div>
            {isLoggedIn ? (
              <Link
                href="/dashboard/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex w-full justify-center"
                aria-label="Profile"
              >
                <Avatar className="ring-primary/30 hover:ring-primary/50 h-10 w-10 ring-2 ring-offset-2 transition">
                  <AvatarImage
                    src={navUser?.avatar}
                    alt={navUser?.userName ?? "User"}
                  />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <NavbarButton
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Login
              </NavbarButton>
            )}
            <NavbarButton
              href="/custom"
              onClick={() => setIsMobileMenuOpen(false)}
              variant="primary"
              className="w-full"
            >
              Start Customizing
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
};
