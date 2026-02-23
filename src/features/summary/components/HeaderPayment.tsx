"use client";

import { ShoppingCart, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const HeaderPayment = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg";

  return (
    <header className="border-border bg-background/95 mx-8 border-b p-4 backdrop-blur">
      <div className="flex justify-between">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="text-primary-foreground flex items-center justify-center">
            <Image src={logoSrc} alt="Logo" width={200} height={62} />
          </div>
        </Link>
        <div className="text-muted-foreground flex items-center gap-5">
          <User className="h-5 w-5" />
          <ShoppingCart className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
};
