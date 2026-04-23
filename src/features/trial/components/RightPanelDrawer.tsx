"use client";

import Image from "next/image";
import { Eye, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <div
      className={`relative z-20 overflow-hidden rounded-l-xl border-l border-white/60 bg-white/80 text-slate-950 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-[width,opacity,margin] duration-300 dark:border-white/10 dark:bg-slate-950/85 dark:text-slate-50 ${
        open ? "-ml-6 w-[min(92vw,408px)] opacity-100" : "ml-0 w-0 opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`h-full ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div className="bg-primary/10 pointer-events-none absolute top-10 right-8 h-28 w-28 rounded-full blur-3xl" />
        <div className="bg-primary/10 pointer-events-none absolute bottom-12 left-6 h-24 w-24 rounded-full blur-3xl" />

        <div className="relative flex h-full w-102 flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-white/60 px-5 pt-5 pb-4 dark:border-white/10">
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase dark:border-white/10 dark:bg-white/5"
              >
                Right Panel
              </Badge>
              <div className="text-xl font-black">
                {selectedToolData?.label ?? "Customize Room"}
              </div>
              <p className="text-muted-foreground max-w-sm text-sm leading-6">
                Dummy product cards so you can confirm the click flow before
                wiring real data.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label="Close right panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative flex-1 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-2 gap-3">
              {cards.map((card) => (
                <article
                  key={card.id}
                  className="overflow-hidden rounded-xl border border-white/60 bg-white/65 shadow-none hover:shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/5"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={card.image}
                      alt={card.name}
                      fill
                      sizes="(max-width: 768px) 44vw, 180px"
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-2 p-3">
                    <div className="flex min-w-0 justify-between">
                      <p className="text-muted-foreground text-xs">
                        {card.size}
                      </p>
                      <Eye className="text-muted-foreground/70 h-4 w-4" />
                    </div>

                    <p className="text-sm font-bold">
                      {formatPrice(card.price)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="border-t border-white/60 px-5 py-4 dark:border-white/10">
            <p className="text-muted-foreground text-sm">
              {cards.length} dummy items ready for flow testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
