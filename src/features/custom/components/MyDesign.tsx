import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAvatarFallback } from "@/lib/avatar";
import { clearDesignCodeFromStorage } from "@/lib/designCode";
import { useRoomStore } from "@/store/useRoomStore";
import { ArrowLeft, LogIn, LogOut, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  onBackToMenu?: () => void;
}

export const MyDesign = ({
  isOpen,
  onClose,
  isLoggedIn = false,
  onBackToMenu,
}: MenuModalProps) => {
  const router = useRouter();
  const session = useSession();
  const resetRoom = useRoomStore((state) => state.reset);
  const setStoredDesignCode = useRoomStore((state) => state.setDesignCode);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [designCode, setDesignCode] = useState("");
  const avatarFallback = getAvatarFallback({
    firstName: session.data?.user?.firstName,
    lastName: session.data?.user?.lastName,
    name: session.data?.user?.userName ?? "User",
  });
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
  const handleOpenDesignCode = () => {
    const code = designCode.trim();
    if (!code) return;
    onClose();
    window.open(`/custom/${code}`, "_blank", "noopener,noreferrer");
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

          {/* Menu Items */}
          <div className="mt-5 flex-1 overflow-y-auto px-6 py-4">
            <Tabs defaultValue="my-design" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my-design">My Design</TabsTrigger>
                <TabsTrigger value="design-code">Design Code</TabsTrigger>
              </TabsList>
              <TabsContent value="my-design" className="mt-4">
                <div className="space-y-2">
                  <h3 className="mb-3 text-base font-semibold">Your Designs</h3>
                  <p className="text-sm text-gray-600">
                    Log in to keep your designs saved and easy to find.
                  </p>
                  <p className="text-sm text-gray-600">
                    No login? No problem - just use Share to create a design
                    code.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="design-code" className="mt-4">
                <div className="space-y-2">
                  <h3 className="mb-3 text-base font-semibold">Design Code</h3>
                  <label
                    htmlFor="design-code-input"
                    className="text-sm font-medium text-gray-700"
                  >
                    Have a design code?
                  </label>
                  <p>Enter it here to reopen your design instantly.</p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="design-code-input"
                      name="design-code-input"
                      value={designCode}
                      onChange={(event) => {
                        const nextValue = event.target.value.toUpperCase();
                        setDesignCode(nextValue);
                        console.log("Design code:", nextValue);
                      }}
                      placeholder="e.g. SK9CP8"
                      maxLength={6}
                      className="uppercase"
                    />
                    <Button
                      variant="secondary"
                      onClick={handleOpenDesignCode}
                      disabled={!designCode.trim()}
                    >
                      Open
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    A 5-6 character code using letters and numbers (e.g. SK9CP8)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}

          <div className="border-t p-4">
            {session.data?.user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar>
                    <AvatarImage src="https://res.cloudinary.com/dhdpnfvfn/image/upload/v1768803916/user-icon_rbmcr4.png" />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
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
