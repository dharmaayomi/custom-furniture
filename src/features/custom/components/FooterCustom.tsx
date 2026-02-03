import { useRoomStore } from "@/store/useRoomStore";
import {
  Columns2,
  CornerUpLeft,
  CornerUpRight,
  Moon,
  Ruler,
} from "lucide-react";

interface FooterCustomProps {
  onCustomizeClick?: () => void;
}
export const FooterCustom = ({ onCustomizeClick }: FooterCustomProps) => {
  const { undo, redo, past, future, present, toggleHuman } = useRoomStore();
  const isHumanActive = present.showHuman;
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  return (
    <footer className="pointer-events-none absolute bottom-0 z-5 mx-auto flex w-full justify-between gap-4 px-3 pb-4 md:px-8">
      {/* ruler button */}
      <div className="pointer-events-auto flex flex-col gap-2">
        <div className="cursor-pointer rounded-full bg-slate-900 p-3">
          <Moon className="h-5 w-5 text-white" />
        </div>
        <div
          onClick={toggleHuman}
          className={`cursor-pointer rounded-full p-3 transition-colors ${
            isHumanActive
              ? "bg-white text-slate-900"
              : "bg-slate-900 text-white"
          }`}
        >
          <Columns2 className="h-5 w-5" />
        </div>
        <div className="cursor-pointer rounded-full bg-slate-900 p-3">
          <Ruler className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* arrow button */}
      <div className="pointer-events-auto flex items-center self-end">
        {/* UNDO BUTTON */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`flex items-center rounded-l-xl bg-white p-2 transition-opacity ${
            canUndo ? "cursor-pointer hover:bg-white/90" : "opacity-80"
          }`}
          aria-label="Undo"
        >
          <CornerUpLeft className="h-6 w-6 text-slate-900" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className={`flex items-center rounded-r-xl bg-white p-2 transition-opacity ${
            canRedo ? "cursor-pointer hover:bg-white/90" : "opacity-80"
          }`}
          aria-label="Redo"
        >
          <CornerUpRight className="h-6 w-6 text-slate-900" />
        </button>
      </div>
    </footer>
  );
};
