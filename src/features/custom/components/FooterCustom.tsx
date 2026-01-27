import { useRoomStore } from "@/store/useRoomStore";
import { CornerUpLeft, CornerUpRight, Ruler, Wrench } from "lucide-react";

interface FooterCustomProps {
  onCustomizeClick: () => void;
}
export const FooterCustom = ({ onCustomizeClick }: FooterCustomProps) => {
  const { undo, redo, past, future } = useRoomStore();
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  return (
    <footer className="pointer-events-none absolute bottom-0 z-5 mx-auto flex w-full justify-between gap-4 px-3 pb-4 md:px-8">
      {/* ruler button */}
      <div className="pointer-events-auto">
        <div className="cursor-pointer rounded-full bg-slate-900 p-3">
          <Ruler className="text-white" />
        </div>
      </div>

      {/* Customize button */}
      <div className="pointer-events-auto" onClick={onCustomizeClick}>
        <div className="flex cursor-pointer items-center gap-2 rounded-full bg-gray-900 px-4 py-2">
          <Wrench className="text-white" />
          <p className="text-sm font-semibold text-white">Customize Room</p>
        </div>
      </div>

      {/* arrow button */}
      <div className="pointer-events-auto flex items-center">
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
