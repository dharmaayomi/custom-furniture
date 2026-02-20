"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useGetSavedDesignByCode from "@/hooks/api/design/useGetSavedDesignByCode";
import { useUser } from "@/providers/UserProvider";
import { SavedDesign } from "@/types/shareableDesign";
import { Copy, ExternalLink, CalendarDays, Hash, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DesignCardProps {
  design: SavedDesign;
  variant?: "list" | "grid";
  onDelete?: (design: SavedDesign) => void;
}

export default function DesignCard({
  design,
  variant = "grid",
  onDelete,
}: DesignCardProps) {
  const { userId } = useUser();
  const [submittedCode, setSubmittedCode] = useState("");
  const { data, isFetching, isError } = useGetSavedDesignByCode(
    userId,
    submittedCode,
  );
  const createdAt = design?.createdAt
    ? new Date(design.createdAt).toLocaleDateString()
    : "";
  const title = design.designName || "Untitled design";
  const previewSrc = (design?.previewUrl || "").trim();

  useEffect(() => {
    if (!data || !submittedCode) return;
    const payload = (data as any)?.data ?? data;
    const configuration = payload?.configuration;
    if (!configuration) {
      toast.error("Design not found");
      return;
    }
    window.open(`/custom/${submittedCode}`, "_blank", "noopener,noreferrer");
    setSubmittedCode("");
  }, [data, submittedCode]);

  useEffect(() => {
    if (!isError || !submittedCode) return;
    toast.error("Failed to open design");
    setSubmittedCode("");
  }, [isError, submittedCode]);

  const handleOpen = () => {
    if (!design.designCode) return;
    if (!userId) {
      toast.error("Please login to open saved design");
      return;
    }
    setSubmittedCode(design.designCode);
  };

  const handleCopyCode = async () => {
    const code = design.designCode?.trim();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleDelete = () => {
    onDelete?.(design);
  };

  if (variant === "list") {
    return (
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt={`${title} preview`}
                className="h-16 w-24 shrink-0 rounded-md object-cover"
                loading="lazy"
              />
            ) : (
              <div className="bg-muted text-muted-foreground flex h-16 w-24 shrink-0 items-center justify-center rounded-md text-xs">
                No preview
              </div>
            )}
            <div className="flex-1">
              <div className="text-foreground text-lg font-semibold">{title}</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  <span>Code: {design.designCode}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopyCode}
                    aria-label="Copy design code"
                    title="Copy design code"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {createdAt ? (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>Created: {createdAt}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpen}
              disabled={isFetching}
            >
              <ExternalLink className="h-4 w-4" />
              {isFetching ? "Opening..." : "Open"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive bg-transparent hover:text-white"
              aria-label="Delete design"
              title="Delete design"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="bg-card overflow-hidden rounded-lg border shadow-sm">
      {previewSrc ? (
        <img
          src={previewSrc}
          alt={`${title} preview`}
          className="aspect-4/3 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center text-xs">
          Preview unavailable
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0 space-y-1">
          <p className="text-foreground truncate text-sm font-semibold">
            {title}
          </p>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <span>Code: {design.designCode}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCopyCode}
              aria-label="Copy design code"
              title="Copy design code"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          {createdAt ? (
            <p className="text-muted-foreground/80 text-xs">Created {createdAt}</p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={handleOpen}
            disabled={isFetching}
          >
            {isFetching ? "Opening..." : "Open"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:bg-destructive bg-transparent hover:text-white"
            aria-label="Delete design"
            title="Delete design"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
