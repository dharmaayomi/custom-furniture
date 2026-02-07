import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LogIn, LogOut, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRoomStore } from "@/store/useRoomStore";
import { useState } from "react";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  onBackToMenu?: () => void;
}

export const OpenDesignCode = ({
  isOpen,
  onClose,
  isLoggedIn = false,
  onBackToMenu,
}: MenuModalProps) => {
  const router = useRouter();
  const session = useSession();
  const resetRoom = useRoomStore((state) => state.reset);
  const [designCode, setDesignCode] = useState("");
  const logout = () => {
    signOut({ redirect: false });
    router.push("/");
  };

  const handleLogin = () => {
    router.push("/login");
  };
  const handleBackToMenu = () => {
    if (onBackToMenu) {
      onBackToMenu();
      return;
    }
    onClose();
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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToMenu}
              className="hover:bg-secondary/70"
            >
              <ArrowLeft size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-secondary/70"
            >
              <X size={20} />
            </Button>
          </div>

          <div className="mt-5 flex-1 overflow-y-auto px-6 py-4">
            {/* Menu Items */}
            <div className="mb-6 text-lg font-bold">Open Your Design</div>
            <div>Have a design code? Enter it below</div>
            <div className="mt-4 flex gap-3">
              <Input
                type="text"
                name="design-code"
                id="design-code"
                value={designCode}
                onChange={(e) => {
                  const targetValue = e.target.value.toUpperCase();
                  setDesignCode(targetValue);
                  console.log("kode :", targetValue);
                }}
                placeholder="Enter Design Code"
              />
              <Button variant="secondary">Open</Button>
            </div>
            <div className="text-muted-foreground mt-2 text-xs">
              Codes are 5–6 characters long (letters & numbers)
            </div>
          </div>

          {/* Footer */}

          <div className="border-t p-4">
            {session.data?.user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar>
                    <AvatarImage src="https://res.cloudinary.com/dhdpnfvfn/image/upload/v1768803916/user-icon_rbmcr4.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="truncate text-sm font-semibold text-gray-700 capitalize">
                      {session.data?.user?.firstName || "User"}
                    </p>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>

                <Button
                  onClick={() => logout()}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  title="Logout"
                >
                  <LogOut size={20} />
                </Button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-white transition-opacity hover:opacity-90"
              >
                <LogIn size={20} />
                <span className="font-medium">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
