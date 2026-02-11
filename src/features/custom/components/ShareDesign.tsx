import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, LogIn, LogOut, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRoomStore } from "@/store/useRoomStore";
import {
  loadDesignCodeFromStorage,
  saveDesignCodeToStorage,
} from "@/lib/designCode";
import { useState } from "react";
import { getAvatarFallback } from "@/lib/avatar";
import useGenerateDesignCode from "@/hooks/api/design/useGenerateDesignCode";

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
  const roomState = useRoomStore((state) => state.present);
  const [shareLink, setShareLink] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const avatarFallback = getAvatarFallback({
    firstName: session.data?.user?.firstName,
    lastName: session.data?.user?.lastName,
    name: session.data?.user?.userName ?? "User",
  });

  const { mutateAsync: shareableLink, isPending } = useGenerateDesignCode({
    onGenerated: ({ designCode: generatedCode, shareableUrl }) => {
      setDesignCode(generatedCode);
      saveDesignCodeToStorage(generatedCode);
      setShareLink(shareableUrl);
      setCopyStatus("");
    },
  });

  const buildDesignConfig = () => {
    return {
      units: { distance: "m", rotation: "rad" },
      room: roomState.roomConfig,
      mainModels: roomState.mainModels.map((id, index) => {
        const transform = roomState.mainModelTransforms[index];
        return {
          id,
          position_m: transform
            ? [transform.position.x, transform.position.y, transform.position.z]
            : null,
          rotation: [0, transform?.rotation ?? 0, 0],
          scale: transform?.scale
            ? [transform.scale.x, transform.scale.y, transform.scale.z]
            : null,
          texture: transform?.texture ?? null,
        };
      }),
      addOnModels: roomState.addOnModels.map((id, index) => {
        const transform = roomState.addOnTransforms[index];
        return {
          id,
          position_m: transform
            ? [transform.position.x, transform.position.y, transform.position.z]
            : null,
          rotation: [0, transform?.rotation ?? 0, 0],
          scale: transform?.scale
            ? [transform.scale.x, transform.scale.y, transform.scale.z]
            : null,
          texture: transform?.texture ?? null,
        };
      }),
      activeTexture: roomState.activeTexture,
      totalPrice: { amount: roomState.totalPrice, currency: "IDR" },
    };
  };
  const logout = () => {
    signOut({ redirect: false });
    router.push("/");
  };

  const buildShareLink = (code: string) => {
    if (!code) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin || ""}/custom/${code}`;
  };

  const getStoredCode = () => {
    const storedCode = loadDesignCodeFromStorage();
    return designCode || storedCode || "";
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

  const handleGenerateShareable = async () => {
    await shareableLink({
      configuration: buildDesignConfig(),
    });
  };

  const handleShareViaEmail = async () => {
    if (!getStoredCode()) {
      await handleGenerateShareable();
    }
    const code = getStoredCode();
    const link = shareLink || buildShareLink(code);
    const subject = encodeURIComponent("My Custom Furniture Design");
    const body = encodeURIComponent(
      `Here is my design.\n\nDesign code: ${code}\nLink: ${link}`,
    );
    if (typeof window !== "undefined") {
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const handleCopyLink = async () => {
    const linkToCopy = shareLink || buildShareLink(getStoredCode());
    if (!linkToCopy) return;
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopyStatus("Link copied!");
    } catch {
      setCopyStatus("Copy failed");
    }
  };

  const handleCopyCode = async () => {
    const code = getStoredCode();
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
                  variant="outline"
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
                        value={shareLink || buildShareLink(getStoredCode())}
                        readOnly
                        placeholder="Click Generate Link"
                      />
                      <Button
                        onClick={handleCopyLink}
                        id="share-copy-link-button"
                        name="share-copy-link"
                        variant="secondary"
                        className="gap-2"
                        disabled={!shareLink || isPending}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                    <p className="text-xs font-light text-gray-500 italic">
                      This link represents a snapshot of your design at the time
                      it was generated.
                    </p>
                    <Button
                      className="w-full"
                      onClick={handleGenerateShareable}
                      disabled={isPending}
                    >
                      {isPending ? "Generating..." : "Generate Link"}
                    </Button>
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
                        value={getStoredCode()}
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
                        disabled={!getStoredCode() || isPending}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Codes are 5-6 characters long (letters & numbers)
                    </p>
                    <p className="text-xs font-light text-gray-500 italic">
                      This code represents a snapshot of your design at the time
                      it was generated.
                    </p>
                    <Button
                      className="w-full"
                      onClick={handleGenerateShareable}
                      disabled={isPending}
                    >
                      {isPending ? "Generating..." : "Generate Code"}
                    </Button>
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
