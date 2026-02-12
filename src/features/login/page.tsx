"use client";

import React from "react";
import { LoginForm } from "./components/login-form";
import { GalleryVerticalEnd } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CircleAlert } from "lucide-react";

export const LoginPage = () => {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const isSessionExpired = reason === "session_expired";

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Image src="/waw.jpg" alt="Logo" width={30} height={30} />
            </div>
            Custom Furniture
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            {isSessionExpired ? (
              <Alert className="mb-6">
                <CircleAlert />
                <AlertTitle>Session expired</AlertTitle>
                <AlertDescription>
                  Please log in again to continue.
                </AlertDescription>
              </Alert>
            ) : null}
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/assets/Ruang-Keluarga-Mess-Kadusirung.webp"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};
