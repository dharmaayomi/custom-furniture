"use client";

import { ComponentCategory } from "@/types/componentProduct";

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  "SHELF",
  "DRAWER",
  "HANGER",
  "DOOR",
  "RAIL",
  "ACCESSORY",
  "HARDWARE",
];

export const toCloudinaryThumbUrl = (url?: string) => {
  if (!url) return undefined;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return undefined;
  }

  return url.replace("/upload/", "/upload/w_320,h_240,c_fill,q_auto,f_auto/");
};

