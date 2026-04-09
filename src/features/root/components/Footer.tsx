"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const Footer = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg";

  return (
    <footer>
      <div className="container mx-auto flex w-full flex-col gap-8 p-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <Link href="/" className="inline-flex items-center">
            <Image
              src={logoSrc}
              alt="Byte Beyond Persona"
              width={190}
              height={56}
            />
          </Link>

          <nav className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm sm:gap-6">
            <Link
              href="https://bbpersona.com/tentang-kami/"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              Tentang Kami
            </Link>
            <Link
              href="https://bbpersona.com/spesialisasi/"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              Spesialisasi
            </Link>
            <Link
              href="https://bbpersona.com/portofolio/"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              Portfolio
            </Link>
            <Link
              href="https://bbpersona.com/berita-dan-artikel/"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              Artikel
            </Link>
          </nav>
        </div>

        <div className="text-muted-foreground flex flex-col gap-3 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>Build custom furniture with confidence.</p>
          <p>
            © {new Date().getFullYear()} Byte Beyond Persona. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
