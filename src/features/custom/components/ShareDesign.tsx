import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, LogIn, LogOut, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRoomStore } from "@/store/useRoomStore";
import {
  generateDesignCode,
  loadDesignCodeFromStorage,
  saveDesignCodeToStorage,
} from "@/lib/designCode";
import { useState } from "react";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  onBackToMenu?: () => void;
}

export const ShareDesign = ({
  isOpen,
  onClose,
  onBackToMenu,
}: MenuModalProps) => {
  const router = useRouter();
  const session = useSession();
  const designCode = useRoomStore((state) => state.designCode);
  const setDesignCode = useRoomStore((state) => state.setDesignCode);
  const [shareLink, setShareLink] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const logout = () => {
    signOut({ redirect: false });
    router.push("/");
  };

  const buildShareLink = (code: string) => {
    if (!code) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin || ""}/design/${code}`;
  };

  const ensureShareData = () => {
    const storedCode = loadDesignCodeFromStorage();
    const code = designCode || storedCode || generateDesignCode(6);
    if (code !== designCode) {
      setDesignCode(code);
    }
    saveDesignCodeToStorage(code);
    const link = buildShareLink(code);
    setShareLink(link);
    return { code, link };
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

  const handleGetLink = () => {
    ensureShareData();
    setCopyStatus("");
  };

  const handleGenerateCode = () => {
    const code = generateDesignCode(6);
    setDesignCode(code);
    saveDesignCodeToStorage(code);
    setShareLink(buildShareLink(code));
    setCopyStatus("");
  };

  const handleShareViaEmail = () => {
    const { code, link } = ensureShareData();
    const subject = encodeURIComponent("My Custom Furniture Design");
    const body = encodeURIComponent(
      `Here is my design.\n\nDesign code: ${code}\nLink: ${link}`,
    );
    if (typeof window !== "undefined") {
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const handleCopyLink = async () => {
    const { link } = ensureShareData();
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("Link copied!");
    } catch {
      setCopyStatus("Copy failed");
    }
  };

  const handleCopyCode = async () => {
    const { code } = ensureShareData();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("Code copied!");
    } catch {
      setCopyStatus("Copy failed");
    }
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
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Share Your Design</h2>
                <p className="text-sm text-gray-600">
                  Generate a code or link to share your design with others.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleShareViaEmail}
                  id="share-email-button"
                  name="share-email"
                  className="w-full"
                >
                  Share via Email
                </Button>
              </div>

              <Tabs defaultValue="link" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="link"
                    id="share-tab-link"
                    name="share-tab-link"
                  >
                    Get Link
                  </TabsTrigger>
                  <TabsTrigger
                    value="code"
                    id="share-tab-code"
                    name="share-tab-code"
                  >
                    Get Code
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="link" className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <label
                      htmlFor="share-link"
                      className="text-sm font-medium text-gray-700"
                    >
                      Shareable Link
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        name="share-link"
                        id="share-link"
                        value={shareLink}
                        readOnly
                        placeholder="Click Generate Link"
                      />
                      <Button
                        onClick={handleCopyLink}
                        id="share-copy-link-button"
                        name="share-copy-link"
                        variant="secondary"
                        className="gap-2"
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="code" className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <label
                      htmlFor="design-code"
                      className="text-sm font-medium text-gray-700"
                    >
                      Design Code
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        name="share-design-code"
                        id="share-design-code"
                        value={designCode}
                        readOnly
                        placeholder="Click Generate Code"
                        className="uppercase"
                      />{" "}
                      <Button
                        onClick={handleCopyCode}
                        id="share-copy-code-button"
                        name="share-copy-code"
                        variant="secondary"
                        className="gap-2"
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Codes are 5-6 characters long (letters & numbers)
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {copyStatus ? (
                <p className="text-xs text-gray-500">{copyStatus}</p>
              ) : null}
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
