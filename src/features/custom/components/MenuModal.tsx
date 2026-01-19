import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FolderClosed,
  FolderOpen,
  Frame,
  LogIn,
  LogOut,
  Save,
  X,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";

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
  const router = useRouter();
  const session = useSession();
  const logout = () => {
    signOut({ redirect: false });
    router.push("/");
  };

  const handleBack = () => {
    router.push("/");
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

              {!session.data?.user ? (
                <button
                  onClick={() => redirect("/login")}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
                >
                  <LogIn size={20} />
                  <span className="font-medium">Login</span>
                </button>
              ) : (
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-100"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="https://res.cloudinary.com/dhdpnfvfn/image/upload/v1768803916/user-icon_rbmcr4.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <p className="text-center text-sm font-medium text-gray-600 capitalize">
                {session.data?.user?.firstName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
