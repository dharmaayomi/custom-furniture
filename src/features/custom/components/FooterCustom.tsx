import { CornerUpLeft, CornerUpRight, Ruler } from "lucide-react";

export const FooterCustom = () => {
  return (
    <footer className="pointer-events-none absolute bottom-0 z-5 mx-auto flex w-full justify-between gap-4 px-3 pb-4 md:px-8">
      {/* ruler button */}
      <div className="pointer-events-auto">
        <div className="cursor-pointer rounded-full bg-slate-900 p-3">
          <Ruler className="text-white" />
        </div>
      </div>

      {/* arrow button */}
      <div className="pointer-events-auto flex items-center">
        <div className="cursor-pointer items-center rounded-l-xl bg-gray-100 p-2">
          <CornerUpLeft />
        </div>
        <div className="cursor-pointer items-center rounded-r-xl bg-gray-100 p-2">
          <CornerUpRight />
        </div>
      </div>
    </footer>
  );
};
