"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/features/dashboard/products/components/ImageUpload";
import { UploadedProductImage } from "@/types/product";
import { toast } from "sonner";

type ProcessOrderPageProps = {
  orderId: string;
};

type ProgressLogEntry = {
  id: string;
  images: {
    name: string;
    preview: string;
  }[];
  progressPercentage: number;
  createdAt: string;
};

export const ProcessOrderPage = ({ orderId }: ProcessOrderPageProps) => {
  const [imageItems, setImageItems] = useState<UploadedProductImage[]>([]);
  const [progressPercentage, setProgressPercentage] = useState<string>("");
  const [logs, setLogs] = useState<ProgressLogEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      imageItems.forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [imageItems]);

  const handleImagesChange = (items: UploadedProductImage[]) => {
    setImageItems(items);
  };

  const convertToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = () => resolve(String(fileReader.result ?? ""));
      fileReader.onerror = () => reject(fileReader.error);
      fileReader.readAsDataURL(file);
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedProgress = Number(progressPercentage);
    if (imageItems.length === 0) {
      toast("At least one photo is required");
      return;
    }

    if (
      Number.isNaN(parsedProgress) ||
      parsedProgress < 0 ||
      parsedProgress > 100
    ) {
      toast("Progress must be between 0 and 100");
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const images = await Promise.all(
        imageItems.map(async (item) => ({
          name: item.file.name,
          preview: await convertToDataUrl(item.file),
        })),
      );

      const logEntry: ProgressLogEntry = {
        id: `${Date.now()}`,
        images,
        progressPercentage: parsedProgress,
        createdAt: new Date().toISOString(),
      };

      setLogs((prev) => [logEntry, ...prev]);
      setImageItems([]);
      setProgressPercentage("");
      toast("Dummy production progress submitted");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProgressChange = (value: string) => {
    if (value === "") {
      setProgressPercentage("");
      return;
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return;

    const clampedValue = Math.min(100, Math.max(0, numericValue));
    setProgressPercentage(String(clampedValue));
  };

  return (
    <div className="space-y-6">
      <Card className="border py-3">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Process Order #{orderId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Production Photo</Label>
              <ImageUpload onImagesChange={handleImagesChange} images={imageItems} />
              <input
                value={imageItems.length > 0 ? "ok" : ""}
                readOnly
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                required
              />
              <p className="text-muted-foreground text-xs">
                You can upload one or more photos per progress submit.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress-percentage">Progress Percentage</Label>
              <Input
                id="progress-percentage"
                type="number"
                min={0}
                max={100}
                placeholder="0 - 100"
                value={progressPercentage}
                onChange={(event) => handleProgressChange(event.target.value)}
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Progress"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border py-3">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Dummy Production Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No progress logged yet.
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {log.images.length} photo{log.images.length === 1 ? "" : "s"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(log.createdAt).toLocaleString("en-US")}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold">
                  {log.progressPercentage}%
                </p>
                <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:grid-cols-4">
                  {log.images.map((image, index) => (
                    <img
                      key={`${image.name}-${index}`}
                      src={image.preview}
                      alt={image.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
