import { Button } from "@/components/ui/button";
import { ListOrdered, Menu, MoveRight, Save } from "lucide-react";
import React from "react";

interface HeaderCustomProps {
  onMenuClick: () => void;
}

export const HeaderCustom = ({ onMenuClick }: HeaderCustomProps) => {
  return (
    <header className="pointer-events-none absolute z-5 mx-auto flex w-full justify-between gap-4 px-4 pt-5 sm:px-6 sm:pt-4 md:px-8">
      {/* left button */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-4">
        <div
          className="cursor-pointer rounded-full bg-gray-100 p-3 md:p-4"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4 md:h-6 md:w-6" />
        </div>
        <Button
          className="hidden cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-black hover:text-white md:flex"
          onClick={() => console.log("save")}
        >
          <Save />
          <div>Save</div>
        </Button>
      </div>

      {/* right button */}
      <div className="pointer-events-auto flex items-center gap-4">
        <div className="cursor-pointer rounded-full bg-gray-100 p-2">
          <ListOrdered className="h-4 w-4" />
        </div>
        {/* dummy total price */}
        <div className="items-center justify-center text-center text-black">
          Rp.3.000.000,00
        </div>
        <div className="flex cursor-pointer items-center gap-2 rounded-full bg-gray-900 px-2 py-2 text-sm font-bold text-white sm:px-4">
          {/* text hanya muncul di tablet+ */}
          <span className="hidden sm:inline">SUMMARY</span>

          <MoveRight />
        </div>
      </div>
    </header>
  );
};
