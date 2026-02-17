import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Grid3x3, List, LogIn, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useGetSavedDesignByCode from "@/hooks/api/design/useGetSavedDesignByCode";
import useGetSavedDesign from "@/hooks/api/design/useGetSavedDesign";
import { toast } from "sonner";
import { NavUserMenu } from "./NavUserMenu";
import { useUser } from "@/providers/UserProvider";
import { Skeleton } from "@/components/ui/skeleton";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToMenu?: () => void;
}

export const MyDesign = ({
  isOpen,
  onClose,
  onBackToMenu,
}: MenuModalProps) => {
  const router = useRouter();
  const session = useSession();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [designCode, setDesignCode] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { navUser } = useUser();

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
  const userId = session.data?.user?.id
    ? Number(session.data.user.id)
    : undefined;
  const { data, isFetching, isError } = useGetSavedDesignByCode(
    userId,
    submittedCode,
  );
  const {
    data: savedDesignsData,
    isFetching: isFetchingSavedDesigns,
    isError: isSavedDesignsError,
  } = useGetSavedDesign(userId);
  const savedDesignsPayload =
    (savedDesignsData as any)?.data ?? savedDesignsData;
  const savedDesigns = Array.isArray(savedDesignsPayload)
    ? savedDesignsPayload
    : [];

  useEffect(() => {
    if (!data || !submittedCode) return;
    const payload = (data as any)?.data ?? data;
    const configuration = payload?.configuration;
    if (!configuration) {
      toast.error("Design not found");
      return;
    }
    onClose();
    window.open(`/custom/${submittedCode}`, "_blank", "noopener,noreferrer");
    setSubmittedCode("");
    setDesignCode("");
  }, [data, submittedCode, onClose]);

  useEffect(() => {
    if (!isError) return;
    toast.error("Failed to load design code");
  }, [isError]);
  useEffect(() => {
    if (!isSavedDesignsError) return;
    toast.error("Failed to load saved designs");
  }, [isSavedDesignsError]);

  const handleOpenDesignCode = () => {
    const code = designCode.trim();
    if (!code) return;
    setSubmittedCode(code);
  };
  const handleOpenSavedDesign = (code: string) => {
    if (!code) return;
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
        className={`bg-background text-foreground fixed top-0 left-0 z-58 h-full w-90 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b p-4">
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
          <div className="thin-scrollbar mt-5 flex-1 overflow-y-auto px-6 py-4">
            <Tabs defaultValue="my-design" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my-design">My Design</TabsTrigger>
                <TabsTrigger value="design-code">Design Code</TabsTrigger>
              </TabsList>
              <TabsContent value="my-design" className="mt-4">
                {session.data?.user ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">Your Designs</h3>
                      <div className="border-border bg-muted flex gap-2 rounded-lg border p-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          onClick={() => setViewMode("grid")}
                          className="gap-2"
                        >
                          <Grid3x3 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={viewMode === "list" ? "default" : "ghost"}
                          onClick={() => setViewMode("list")}
                          className="gap-2"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isFetchingSavedDesigns ? (
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-1 gap-4 sm:grid-cols-1"
                            : "space-y-3"
                        }
                      >
                        {Array.from({
                          length: viewMode === "grid" ? 4 : 3,
                        }).map((_, index) => (
                          <div
                            key={index}
                            className={
                              viewMode === "grid"
                                ? "bg-card overflow-hidden rounded-lg border shadow-sm"
                                : "bg-card rounded-lg border p-3 shadow-sm"
                            }
                          >
                            {viewMode === "grid" ? (
                              <div className="flex h-full flex-col">
                                <Skeleton className="aspect-4/3 w-full" />
                                <div className="flex flex-1 flex-col gap-2 p-3">
                                  <Skeleton className="h-4 w-3/4" />
                                  <Skeleton className="h-3 w-1/2" />
                                  <Skeleton className="h-3 w-1/3" />
                                  <Skeleton className="mt-auto h-8 w-full" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-16 w-24 rounded-md" />
                                <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                                  <div className="min-w-0 space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-3 w-20" />
                                  </div>
                                  <Skeleton className="h-8 w-16" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : savedDesigns.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        You don&apos;t have any saved designs yet.
                      </p>
                    ) : (
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-1 gap-4 sm:grid-cols-1"
                            : "space-y-3"
                        }
                      >
                        {savedDesigns.map((design) => {
                          const createdAt = design?.createdAt
                            ? new Date(design.createdAt).toLocaleDateString()
                            : "";
                          const previewSrc = (design?.previewUrl || "").trim();
                          return (
                            <div
                              key={design.id}
                              className={
                              viewMode === "grid"
                                  ? "bg-card overflow-hidden rounded-lg border shadow-sm"
                                  : "bg-card rounded-lg border p-3 shadow-sm"
                              }
                            >
                              {viewMode === "grid" ? (
                                <div className="flex h-full flex-col">
                                  {previewSrc ? (
                                    <img
                                      src={previewSrc}
                                      alt={`${design.designName || "Untitled design"} preview`}
                                      className="aspect-4/3 w-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center text-xs">
                                      Preview unavailable
                                    </div>
                                  )}
                                  <div className="flex flex-1 flex-col gap-2 p-3">
                                    <div className="min-w-0">
                                      <p className="text-foreground truncate text-sm font-semibold">
                                        {design.designName || "Untitled design"}
                                      </p>
                                      <p className="text-muted-foreground text-xs">
                                        Code: {design.designCode}
                                      </p>
                                      {createdAt ? (
                                        <p className="text-muted-foreground/80 text-xs">
                                          Created {createdAt}
                                        </p>
                                      ) : null}
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      onClick={() =>
                                        handleOpenSavedDesign(design.designCode)
                                      }
                                      className="mt-auto w-full"
                                    >
                                      Open
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  {previewSrc ? (
                                    <img
                                      src={previewSrc}
                                      alt={`${design.designName || "Untitled design"} preview`}
                                      className="h-16 w-24 shrink-0 rounded-md object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="bg-muted text-muted-foreground flex h-16 w-24 shrink-0 items-center justify-center rounded-md text-xs">
                                      No preview
                                    </div>
                                  )}
                                  <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-foreground truncate text-sm font-semibold">
                                        {design.designName || "Untitled design"}
                                      </p>
                                      <p className="text-muted-foreground text-xs">
                                        Code: {design.designCode}
                                      </p>
                                      {createdAt ? (
                                        <p className="text-muted-foreground/80 text-xs">
                                          Created {createdAt}
                                        </p>
                                      ) : null}
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      onClick={() =>
                                        handleOpenSavedDesign(design.designCode)
                                      }
                                    >
                                      Open
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="mb-3 text-base font-semibold">
                      Your Designs
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Log in to keep your designs saved and easy to find.
                    </p>
                    <p className="text-muted-foreground text-sm">
                      No login? No problem - just use Share to create a design
                      code.
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="design-code" className="mt-4">
                <div className="space-y-2">
                  <h3 className="mb-3 text-base font-semibold">Design Code</h3>
                  <label
                    htmlFor="design-code-input"
                    className="text-foreground text-sm font-medium"
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
                      disabled={!designCode.trim() || isFetching}
                    >
                      {isFetching ? "Opening..." : "Open"}
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    A 5-6 character code using letters and numbers (e.g. SK9CP8)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}

          <div className="border-border border-t p-4">
            {navUser ? (
              <NavUserMenu user={navUser} />
            ) : (
              <button
                onClick={handleLogin}
                className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 transition-opacity hover:opacity-90"
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
