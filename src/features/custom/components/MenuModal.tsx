// import {
//   FilePlus,
//   FolderOpen,
//   FolderOutput,
//   Frame,
//   LogOut,
//   Save,
//   X,
// } from "lucide-react";

// interface MenuModalProps {
//   onClose: () => void;
// }

// export const MenuModal = ({ onClose }: MenuModalProps) => {
//   return (
//     <div className="flex h-full w-full flex-col bg-white">
//       {/* Header Menu */}
//       <div className="flex items-center justify-between border-b bg-white p-6">
//         <h2 className="text-xl font-bold">Menu</h2>
//         <button
//           onClick={onClose}
//           className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-black"
//         >
//           <X className="h-5 w-5" />
//         </button>
//       </div>

//       {/* List Menu */}
//       <div className="flex-1 overflow-y-auto p-4">
//         <ul className="space-y-2">
//           <li className="flex cursor-pointer items-center gap-3 rounded-lg p-3 font-medium text-gray-700 transition hover:bg-gray-100">
//             <FilePlus size={20} />
//             <span>New Room</span>
//           </li>
//           <li className="flex cursor-pointer items-center gap-3 rounded-lg p-3 font-medium text-gray-700 transition hover:bg-gray-100">
//             <FolderOpen size={20} />
//             <span>Load Design</span>
//           </li>
//           <li className="flex cursor-pointer items-center gap-3 rounded-lg p-3 font-medium text-gray-700 transition hover:bg-gray-100">
//             <FolderOutput size={20} />
//             <span>Open Design Code</span>
//           </li>
//           <li className="flex cursor-pointer items-center gap-3 rounded-lg p-3 font-medium text-gray-700 transition hover:bg-gray-100">
//             <Frame size={20} />
//             <span>Start From Scratch</span>
//           </li>
//           <li className="flex cursor-pointer items-center gap-3 rounded-lg p-3 font-medium text-gray-700 transition hover:bg-gray-100">
//             <Save size={20} />
//             <span>Export / Save</span>
//           </li>

//           <div className="my-2 h-px bg-gray-200"></div>

//           <li className="flex cursor-pointer items-center gap-3 rounded-lg p-3 font-medium text-red-600 transition hover:bg-red-50">
//             <LogOut size={20} />
//             <span>Logout</span>
//           </li>
//         </ul>
//       </div>

//       {/* Footer Menu */}
//       <div className="border-t p-4 text-center text-xs text-gray-400">
//         Furniture Planner v1.0
//       </div>
//     </div>
//   );
// };

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Code,
  FolderClosed,
  FolderOpen,
  Frame,
  LogIn,
  LogOut,
  Save,
  Sparkles,
  X,
} from "lucide-react";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
}

export const MenuModal = ({
  isOpen,
  onClose,
  isLoggedIn = false,
}: MenuModalProps) => {
  const handleBack = () => {
    console.log("Back to start page");
  };

  const handleOpenDesignCode = () => {
    console.log("Open design code");
  };

  const handleSave = () => {
    console.log("Save");
  };

  const handleStartFromScratch = () => {
    console.log("Start from scratch");
  };

  const handleAuth = () => {
    if (isLoggedIn) {
      console.log("Logout");
    } else {
      console.log("Login");
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black transition-opacity duration-300 ${
          isOpen ? "opacity-50" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-80 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Back */}
              <button
                onClick={handleBack}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back</span>
              </button>

              {/* Save (only visible on mobile in original design) */}
              <button
                onClick={handleSave}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100 md:hidden"
              >
                <Save size={20} />
                <span className="font-medium">Save</span>
              </button>

              {/* My Design */}
              <button
                onClick={handleOpenDesignCode}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <FolderClosed size={20} />
                <span className="font-medium">My Design</span>
              </button>

              {/* Open Design Code */}
              <button
                onClick={handleOpenDesignCode}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <FolderOpen size={20} />
                <span className="font-medium">Open design code</span>
              </button>

              {/* Start from Scratch */}
              <button
                onClick={handleStartFromScratch}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <Frame size={20} />
                <span className="font-medium">Start from scratch</span>
              </button>

              {/* Divider */}
              <div className="my-4 border-t" />

              {/* Login/Logout */}
              <button
                onClick={handleAuth}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                {isLoggedIn ? <LogOut size={20} /> : <LogIn size={20} />}
                <span className="font-medium">
                  {isLoggedIn ? "Logout" : "Login"}
                </span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <p className="text-center text-sm font-medium text-gray-600">
              HALO DEK
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
