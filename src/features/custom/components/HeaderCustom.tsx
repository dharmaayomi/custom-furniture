"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListOrdered, Menu, MoveRight, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface HeaderCustomProps {
  onMenuClick: () => void;
  onListClick?: () => void;
  totalPrice?: number;
  formattedPrice?: string;
}

export const HeaderCustom = ({
  onMenuClick,
  onListClick,
  formattedPrice = "Rp.0",
}: HeaderCustomProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  const handleSaveClick = () => {
    if (status === "authenticated") {
      console.log("save (user is logged in)");
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleLoginRedirect = () => {
    setIsDialogOpen(false);
    router.push("/login");
  };

  return (
    <>
      <header className="pointer-events-none absolute z-5 mx-auto flex w-full justify-between gap-4 px-4 pt-5 sm:px-6 sm:pt-4 md:px-8">
        {/* left button */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-4">
          <div
            className="cursor-pointer rounded-full bg-gray-100 p-3 shadow-md md:p-4"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4 md:h-6 md:w-6" />
          </div>
          <Button
            className="hidden cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-black shadow-md hover:text-white md:flex"
            onClick={handleSaveClick}
          >
            <Save />
            <div>Save</div>
          </Button>
        </div>

        {/* right button */}
        <div className="pointer-events-auto flex items-center gap-4">
          <div
            className="cursor-pointer rounded-full bg-gray-100 p-2 shadow-md"
            onClick={onListClick}
          >
            <ListOrdered className="h-4 w-4" />
          </div>
          <div className="items-center justify-center text-center text-black">
            {formattedPrice}
          </div>
          <div className="flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-2 py-2 text-sm font-bold text-white sm:px-4">
            <span className="hidden sm:inline">SUMMARY</span>

            <MoveRight />
          </div>
        </div>
      </header>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Save design</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <DialogDescription className="text-base text-gray-600">
              You need to log in to save your designs.
            </DialogDescription>
          </div>

          <div className="mt-4 flex w-full">
            <Button
              className="hover:bg-primary/90 w-full rounded-full text-base font-bold"
              onClick={handleLoginRedirect}
            >
              Log in or sign up
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
