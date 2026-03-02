"use client";

import { MaterialCategory, ProductMaterial } from "@/types/materialProduct";

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  "FLOOR",
  "WALL",
  "FURNITURE",
];

export const toCloudinaryThumbUrl = (url?: string) => {
  if (!url) return undefined;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return undefined;
  }

  return url.replace("/upload/", "/upload/w_320,h_240,c_fill,q_auto,f_auto/");
};

const normalizeCategoryLabel = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) =>
        typeof entry === "string"
          ? entry
          : typeof entry === "object" && entry
            ? String(
                (entry as Record<string, unknown>).name ??
                  (entry as Record<string, unknown>).label ??
                  "",
              )
            : "",
      )
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

export const formatMaterialCategory = (item: ProductMaterial): string => {
  const rawCategory =
    (item as Record<string, unknown>).materialCategory ??
    (item as Record<string, unknown>).materialCategories ??
    (item as Record<string, unknown>).category;
  const normalized = normalizeCategoryLabel(rawCategory);
  return normalized.length ? normalized.join(", ") : "-";
};

