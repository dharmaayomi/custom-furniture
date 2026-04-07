"use client";

import React from "react";
import {
  Play,
  ArrowRight,
  CheckCircle2,
  Star,
  ShieldCheck,
  Zap,
  Boxes,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const Hero03 = () => {
  const router = useRouter();
  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden">
      {/* Background Decor */}
      <div className="bg-primary/5 pointer-events-none absolute top-0 right-0 h-125 w-125 translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
      <div className="bg-primary/5 pointer-events-none absolute bottom-0 left-0 h-125 w-125 -translate-x-1/2 translate-y-1/2 rounded-full blur-[120px]" />

      <div className="relative z-10 container mx-auto flex w-full flex-col items-center gap-16 px-6 py-12 md:py-24 lg:flex-row lg:gap-24">
        {/* Left Content Side */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 mb-6 rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide transition-colors"
            >
              <Boxes className="mr-2 inline h-4 w-4" />
              Custom Furniture Platform
            </Badge>

            <h1 className="text-foreground mb-8 text-5xl leading-[1.1] font-black tracking-tight md:text-6xl">
              Desain Furnitur yang{" "}
              <span className="from-primary text-primary bg-linear-to-r via-indigo-500 to-purple-600 bg-clip-text">
                Pas di Ruangan
              </span>{" "}
              Anda.
            </h1>

            <p className="text-muted-foreground/80 mx-auto mb-10 max-w-2xl text-xl leading-relaxed lg:mx-0">
              Buat kabinet dan furnitur ruangan dari dimensi nyata, pratinjau
              setiap detail dalam 3D, dan selesaikan pembelian dengan informasi
              pengiriman dan harga yang transparan.
            </p>

            <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Button
                size="lg"
                className="shadow-primary/20 flex h-16 items-center gap-2 rounded-2xl px-10 text-lg font-bold shadow-2xl transition-transform hover:scale-[1.02]"
                onClick={() => {
                  router.push("/custom");
                }}
              >
                Start Customizing <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="group flex h-16 items-center gap-2 rounded-2xl border-white/10 bg-white/5 px-8 text-lg font-bold backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <div className="bg-primary/10 group-hover:bg-primary/20 flex h-8 w-8 items-center justify-center rounded-full transition-colors">
                  <Play className="text-primary fill-primary h-4 w-4" />
                </div>
                View Design Demo
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70 lg:justify-start">
              <div className="flex items-center gap-2">
                <div className="mb-1 flex -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=64&h=64&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=faces",
                  ].map((src, i) => (
                    <div
                      key={i}
                      className="border-background h-10 w-10 overflow-hidden rounded-full border-2"
                    >
                      <img
                        src={src}
                        alt="user"
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  ))}
                  <div className="bg-secondary border-background flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold">
                    +2k
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-semibold">Dipercaya Pemilik Rumah</span>
                </div>
              </div>
              <div className="bg-border hidden h-4 w-px sm:block" />
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-5 w-5 text-emerald-500" /> Pembayaran
                Aman
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-5 w-5 text-amber-500" /> Alur Desain Cepat
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Media Side */}
        <div className="w-full max-w-2xl flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="group relative"
          >
            {/* Visual Glass Frame */}
            <div className="shadow-3xl relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-linear-to-br from-white/10 to-transparent p-3 backdrop-blur-3xl md:p-4">
              <div className="from-primary/10 pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative aspect-4/3 overflow-hidden rounded-[2rem] bg-slate-900 shadow-inner">
                <img
                  src="/assets/Ruang-Keluarga-Mess-Kadusirung.webp"
                  alt="Custom furniture room preview"
                  className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
                />

                {/* Center Play Button Overlay */}
                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="bg-primary shadow-3xl shadow-primary/50 flex h-20 w-20 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110">
                    <Play className="h-8 w-8 translate-x-1 fill-current text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay Floating Elements */}
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut",
              }}
              className="absolute top-10 -right-8 z-20 hidden rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl md:block"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Zap className="text-primary fill-primary h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-widest text-white/50 uppercase">
                    Design Accuracy
                  </div>
                  <div className="text-lg font-black text-white">98%</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{
                repeat: Infinity,
                duration: 5,
                ease: "easeInOut",
              }}
              className="absolute bottom-12 -left-8 z-20 hidden rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-2xl md:block"
            >
              <div className="mb-2 text-sm font-bold text-white italic">
                Project Status
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-primary/50 h-6 w-6 rounded-full border border-slate-900"
                    />
                  ))}
                </div>
                <div className="text-primary animate-pulse text-xs font-bold">
                  Ready to Build
                </div>
              </div>
            </motion.div>

            {/* decorative rings */}
            <div className="border-primary/20 animate-spin-slow pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full border opacity-20" />
            <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 animate-pulse rounded-full border border-white/10 opacity-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero03;
