"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useGetUserDisplay from "@/hooks/api/user/useGetUserDisplay";
import { getAvatarFallback } from "@/lib/avatar";
import { useUser } from "@/providers/UserProvider";
import { Moon, ShoppingCart, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const HeaderPayment = () => {
  const { userId } = useUser();
  const { data: user } = useGetUserDisplay(userId);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg";
  const isLoggedIn = !!userId;
  const avatarFallback = getAvatarFallback({
    name: user?.userName ?? "User",
  });

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/75 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="text-primary-foreground flex items-center justify-center">
            <Image src={logoSrc} alt="Logo" width={200} height={62} />
          </div>
        </Link>
        <div className="text-muted-foreground flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          {isLoggedIn ? (
            <Link href="/dashboard/profile" aria-label="Profile">
              <Avatar className="ring-primary/30 hover:ring-primary/50 h-8 w-8 ring-2 ring-offset-2 transition">
                <AvatarImage
                  src={user?.avatar}
                  alt={user?.userName ?? "User"}
                />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
