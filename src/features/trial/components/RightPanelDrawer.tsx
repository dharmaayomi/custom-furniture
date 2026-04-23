"use client";

import Image from "next/image";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { TrialTool, TrialToolType } from "./RightPanel";

interface DrawerCard {
  id: string;
  image: string;
  name: string;
  size: string;
  price: number;
}

interface RightPanelDrawerProps {
  open: boolean;
  selectedTool: TrialToolType;
  tools: TrialTool[];
  onOpenChange: (open: boolean) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);

const drawerCardsByTool: Record<string, DrawerCard[]> = {
  furniture: [
    {
      id: "furniture-1",
      image: "/assets/Ruang-Keluarga-Mess-Kadusirung.webp",
      name: "Luma Cabinet",
      size: "180 x 45 x 220 cm",
      price: 12800000,
    },
    {
      id: "furniture-2",
      image: "/waw.jpg",
      name: "Sora Shelf",
      size: "120 x 38 x 210 cm",
      price: 9400000,
    },
    {
      id: "furniture-3",
      image: "/hihi.jpg",
      name: "Kara Sideboard",
      size: "160 x 42 x 82 cm",
      price: 7600000,
    },
  ],
  tambahan: [
    {
      id: "tambahan-1",
      image: "/waw.jpg",
      name: "Drawer Module",
      size: "60 x 45 x 20 cm",
      price: 1450000,
    },
    {
      id: "tambahan-2",
      image: "/hihi.jpg",
      name: "Open Shelf Insert",
      size: "80 x 35 x 30 cm",
      price: 980000,
    },
    {
      id: "tambahan-3",
      image: "/assets/Ruang-Keluarga-Mess-Kadusirung.webp",
      name: "Hanging Rod Set",
      size: "90 x 4 x 4 cm",
      price: 650000,
    },
  ],
  material: [
    {
      id: "material-1",
      image: "/assets/Ruang-Keluarga-Mess-Kadusirung.webp",
      name: "Oak Finish Panel",
      size: "244 x 122 cm",
      price: 2150000,
    },
    {
      id: "material-2",
      image: "/hihi.jpg",
      name: "Matte White Panel",
      size: "244 x 122 cm",
      price: 1790000,
    },
    {
      id: "material-3",
      image: "/waw.jpg",
      name: "Smoked Walnut Panel",
      size: "244 x 122 cm",
      price: 2380000,
    },
  ],
  lighting: [
    {
      id: "lighting-1",
      image: "/waw.jpg",
      name: "Warm Strip Light",
      size: "5 meter",
      price: 780000,
    },
    {
      id: "lighting-2",
      image: "/assets/Ruang-Keluarga-Mess-Kadusirung.webp",
      name: "Spotlight Set",
      size: "3 points",
      price: 1260000,
    },
    {
      id: "lighting-3",
      image: "/hihi.jpg",
      name: "Sensor Lamp",
      size: "12 x 12 x 3 cm",
      price: 430000,
    },
  ],
};

const fallbackCards = drawerCardsByTool.furniture;

export const RightPanelDrawer = ({
  open,
  selectedTool,
  tools,
  onOpenChange,
}: RightPanelDrawerProps) => {
  const selectedToolData = tools.find((tool) => tool.id === selectedTool);
  const cards = selectedTool
    ? (drawerCardsByTool[selectedTool] ?? fallbackCards)
    : fallbackCards;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="rounded-l-xl border-white/60 bg-white/80 text-slate-950 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl data-[vaul-drawer-direction=right]:w-[min(92vw,420px)] data-[vaul-drawer-direction=right]:sm:max-w-105 dark:border-white/10 dark:bg-slate-950/85 dark:text-slate-50">
        <div className="bg-primary/10 pointer-events-none absolute top-10 right-8 h-28 w-28 rounded-full blur-3xl" />
        <div className="bg-primary/10 pointer-events-none absolute bottom-12 left-6 h-24 w-24 rounded-full blur-3xl" />

        <DrawerHeader className="relative border-b border-white/60 px-5 pt-5 pb-4 dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase dark:border-white/10 dark:bg-white/5"
              >
                Right Panel
              </Badge>
              <DrawerTitle className="text-xl font-black">
                {selectedToolData?.label ?? "Customize Room"}
              </DrawerTitle>
              <DrawerDescription className="max-w-sm text-sm leading-6">
                Dummy product cards so you can confirm the click flow before
                wiring real data.
              </DrawerDescription>
            </div>

            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                aria-label="Close right panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="relative flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {cards.map((card) => (
            <article
              key={card.id}
              className="overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/65 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
            >
              <div className="relative aspect-4/3 overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  sizes="(max-width: 768px) 90vw, 380px"
                  className="object-cover"
                />
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black">
                      {card.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">{card.size}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">
                    {formatPrice(card.price)}
                  </p>
                </div>

                <Button
                  type="button"
                  className="shadow-primary/20 w-full rounded-2xl text-sm font-bold shadow-lg"
                >
                  Select Item
                </Button>
              </div>
            </article>
          ))}
        </div>

        <DrawerFooter className="border-t border-white/60 px-5 pt-4 pb-5 dark:border-white/10">
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-white/50 bg-white/70 font-semibold shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              Close Panel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
