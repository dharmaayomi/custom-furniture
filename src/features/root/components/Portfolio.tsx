"use client";

import React from "react";
import { motion } from "framer-motion";
import { Maximize2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const images = [
  {
    url: "/assets/Ruang-Keluarga-Mess-Kadusirung.webp",
    title: "Living Room Built-In",
    size: "col-span-2 row-span-2",
  },
  {
    url: "https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg",
    title: "Kitchen Cabinet Set",
    size: "col-span-1 row-span-1",
  },
  {
    url: "https://images.pexels.com/photos/6585603/pexels-photo-6585603.jpeg",
    title: "Wardrobe + Storage",
    size: "col-span-1 row-span-2",
  },
  {
    url: "https://images.pexels.com/photos/6932431/pexels-photo-6932431.jpeg",
    title: "Home Office Setup",
    size: "col-span-1 row-span-1",
  },
];

export default function Porfolio() {
  return (
    <section className="px-4 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 flex flex-col items-end justify-between gap-8 md:flex-row">
          <div className="max-w-xl text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <Badge
                variant="outline"
                className="text-primary bg-primary/5 mb-4 block w-fit rounded-full border-transparent px-4 py-1.5 text-[10px] font-black tracking-[0.2em] uppercase"
              >
                PROYEK TERBARU
              </Badge>
            </motion.div>
            <h2 className="mb-4 text-3xl leading-none font-black tracking-tight md:text-5xl">
              Dibuat untuk{" "}
              <span className="text-primary italic">ruang nyata.</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-sm italic">
            Jelajahi hasil furnitur kustom kami, mulai dari lemari built-in
            hingga solusi ruangan lengkap yang disesuaikan dengan tata letak
            setiap klien.
          </p>
        </div>

        <div className="grid h-200 grid-cols-1 grid-rows-2 gap-4 md:h-150 md:grid-cols-4">
          {images.map((image, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`${image.size} group bg-muted relative overflow-hidden rounded-[2rem]`}
            >
              <img
                src={image.url}
                alt={image.title}
                className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
              />
              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end bg-black/40 p-8 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="translate-y-4 transition-transform duration-500 group-hover:translate-y-0">
                  <h3 className="mb-4 text-xl font-black text-white">
                    {image.title}
                  </h3>
                  <div className="flex gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      className="flex h-10 w-10 items-center justify-center rounded-full border-none border-white/20 bg-white/10 p-0 backdrop-blur-md transition-all hover:bg-white/20"
                    >
                      <Maximize2 className="h-4 w-4 text-white" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="flex h-10 w-10 items-center justify-center rounded-full border-none border-white/20 bg-white/10 p-0 backdrop-blur-md transition-all hover:bg-white/20"
                    >
                      <ExternalLink className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
