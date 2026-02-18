"use client";

import { useRef, useState } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadedProductImage } from "@/types/product";

type ImageUploadProps = {
  onImagesChange: (images: UploadedProductImage[]) => void;
  images: UploadedProductImage[];
};

export function ImageUpload({ onImagesChange, images }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!validFiles.length) return;

    const nextItems = validFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    onImagesChange([...images, ...nextItems]);
  };

  const removeImage = (index: number) => {
    const target = images[index];
    if (target?.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload images"
        />

        <div className="flex flex-col items-center justify-center gap-3 px-4 py-8">
          <Upload className="text-muted-foreground h-8 w-8" />
          <div className="text-center">
            <p className="text-foreground font-medium">
              Drag & drop images here
            </p>
            <p className="text-muted-foreground text-sm">or click to browse</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="border-input text-foreground"
          >
            Select Images
          </Button>
        </div>
      </div>

      {images.length > 0 && (
        <div>
          <p className="text-foreground mb-2 text-sm font-medium">
            Uploaded Images ({images.length})
          </p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {images.map((image, index) => (
              <div
                key={`${image.file.name}-${index}`}
                className="group border-border bg-muted relative overflow-hidden rounded-lg border"
              >
                <img
                  src={image.previewUrl}
                  alt={`Product ${index + 1}`}
                  className="h-32 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 hidden rounded-md bg-red-500/90 p-1 text-white transition-all group-hover:block hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                {index === 0 && (
                  <div className="bg-primary/90 absolute bottom-1 left-1 flex items-center gap-1 rounded px-2 py-1">
                    <ImageIcon className="text-primary-foreground h-3 w-3" />
                    <span className="text-primary-foreground text-xs font-medium">
                      Featured
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
