import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  clearDesignCodeFromStorage,
  loadDesignCodeFromStorage,
  saveDesignCodeToStorage,
} from "@/lib/designCode";
import { useRoomStore } from "@/store/useRoomStore";
import {
  ArrowLeft,
  FolderClosed,
  FolderOpen,
  Frame,
  Save,
  Share,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NavUserMenu } from "./NavUserMenu";
import { useUser } from "@/providers/UserProvider";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMyDesign?: () => void;
  onOpenDesignCode?: () => void;
  onOpenShareDesign?: () => void;
  onResetRoom?: () => void;
}

export const MenuModal = ({
  isOpen,
  onClose,
  onOpenMyDesign,
  onOpenDesignCode,
  onOpenShareDesign,
  onResetRoom,
}: MenuModalProps) => {
  const router = useRouter();
  const resetRoom = useRoomStore((state) => state.reset);
  const designCode = useRoomStore((state) => state.designCode);
  const setDesignCode = useRoomStore((state) => state.setDesignCode);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { navUser } = useUser();
  const handleBack = () => {
    router.push("/");
  };

  const handleOpenDesignCode = () => {
    onClose();
    onOpenDesignCode?.();
  };

  const handleOpenMyDesign = () => {
    onClose();
    onOpenMyDesign?.();
  };

  const handleOpenShareDesign = () => {
    onClose();
    onOpenShareDesign?.();
  };

  const handleSave = () => {
    const storedCode = loadDesignCodeFromStorage();
    const code = designCode || storedCode;
    if (code !== designCode) {
      setDesignCode(code);
    }
    saveDesignCodeToStorage(code);
  };

  const handleStartFromScratch = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmStartFromScratch = () => {
    resetRoom();
    setDesignCode("");
    clearDesignCodeFromStorage();
    onResetRoom?.();
    setIsConfirmOpen(false);
    onClose();
  };
  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-57 bg-black transition-opacity duration-300 ${
          isOpen ? "opacity-50" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-0 left-0 z-58 h-full w-90 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
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
              id="menu-close-button"
              name="menu-close"
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
                id="menu-back-button"
                name="menu-back"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back</span>
              </button>

              {/* Save (only visible on mobile in original design) */}
              <button
                onClick={handleSave}
                id="menu-save-button"
                name="menu-save"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100 md:hidden"
              >
                <Save size={20} />
                <span className="font-medium">Save</span>
              </button>

              {/* share design */}
              <button
                onClick={handleOpenShareDesign}
                id="menu-share-design-button"
                name="menu-share-design"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <Share size={20} />
                <span className="font-medium">Share Design</span>
              </button>

              {/* My Design */}
              <button
                onClick={handleOpenMyDesign}
                id="menu-my-design-button"
                name="menu-my-design"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <FolderClosed size={20} />
                <span className="font-medium">My Design</span>
              </button>

              {/* Open Design Code */}
              <button
                onClick={handleOpenDesignCode}
                id="menu-open-design-code-button"
                name="menu-open-design-code"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <FolderOpen size={20} />
                <span className="font-medium">Open Design Code</span>
              </button>

              {/* Start from Scratch */}
              <button
                onClick={handleStartFromScratch}
                id="menu-start-from-scratch-button"
                name="menu-start-from-scratch"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <Frame size={20} />
                <span className="font-medium">Start from scratch</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full px-4 py-2">
            {navUser ? (
              <NavUserMenu user={navUser} />
            ) : (
              <Button
                onClick={handleLogin}
                id="menu-login-button"
                name="menu-login"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-black p-4 text-white transition-opacity hover:opacity-90"
              >
                <span className="font-medium">Login</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Start from scratch
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <DialogDescription className="text-base text-gray-600">
              This will remove your current configuration and reset the room.
            </DialogDescription>
          </div>

          <div className="mt-4 flex w-full flex-col gap-3">
            <Button
              variant="outline"
              className="w-full rounded-full text-base font-semibold"
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full rounded-full text-base font-bold"
              onClick={handleConfirmStartFromScratch}
            >
              Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
