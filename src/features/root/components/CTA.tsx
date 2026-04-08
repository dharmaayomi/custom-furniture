"use client";

import React from "react";
import {
  Rocket,
  Sparkles,
  ArrowRight,
  Star,
  Zap,
  CheckCircle2,
  MousePointer2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const CTA06 = () => {
  const router = useRouter();
  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden px-6 py-24">
      {/* Dynamic Background Atmosphere */}
      <div className="via-primary/50 absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent" />
      <div className="bg-primary/10 pointer-events-none absolute -top-[30%] -left-[10%] h-[80%] w-[60%] -rotate-12 rounded-full blur-[120px]" />
      <div className="/10 pointer-events-none absolute -right-[10%] -bottom-[30%] h-[80%] w-[60%] rotate-12 rounded-full blur-[120px]" />

      <div className="relative z-20 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="group shadow-3xl relative overflow-hidden rounded-[3rem] border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-transparent backdrop-blur-3xl">
            <CardContent className="p-8 md:p-16">
              {/* Internal Glow Decor */}
              <div className="pointer-events-none absolute top-0 right-0 p-12 transition-transform duration-500 group-hover:scale-110">
                <Sparkles className="text-primary h-24 w-24 opacity-[0.03]" />
              </div>

              <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
                <div className="flex-1 space-y-8 text-center lg:text-left">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 border-primary/20 text-primary inline-flex animate-pulse items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-widest uppercase"
                  >
                    <Rocket className="h-3.5 w-3.5" /> Start Your Custom Build
                  </Badge>

                  <h2 className="text-foreground text-4xl leading-tight font-black tracking-tighter md:text-6xl">
                    Siap mendesain{" "}
                    <span className="text-primary italic">
                      furnitur impian Anda?
                    </span>
                  </h2>

                  <p className="text-muted-foreground mx-auto max-w-xl text-lg leading-relaxed md:text-xl lg:mx-0">
                    Pilih produk dasar, kombinasikan komponen, terapkan
                    material, dan pantau progres pesanan Anda dari pembayaran
                    hingga produksi dalam satu platform yang terintegrasi.
                  </p>

                  <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row lg:justify-start">
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground shadow-primary/30 group/btn relative h-16 overflow-hidden rounded-2xl px-10 text-lg font-black shadow-2xl"
                      onClick={() => router.push("/custom")}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Start Customizing{" "}
                        <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                      </span>
                      <div className="absolute inset-x-0 bottom-0 h-full origin-left scale-x-0 transform bg-white/20 transition-transform group-hover/btn:scale-x-100" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => router.push("/contact")}
                      className="decoration-primary/30 h-16 rounded-2xl px-8 text-lg font-bold hover:bg-white/10 hover:underline"
                    >
                      Hubungi Tim Kami
                    </Button>
                  </div>

                  {/* Mini Indicators */}
                  <div className="flex flex-wrap items-center justify-center gap-6 pt-6 opacity-60 grayscale transition-all duration-500 hover:grayscale-0 lg:justify-start">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />{" "}
                      Harga Transparan
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <Zap className="h-4 w-4 text-amber-500" /> Produksi Cepat
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <MousePointer2 className="h-4 w-4 text-blue-500" />{" "}
                      Pelacakan Pesanan Langsung
                    </div>
                  </div>
                </div>

                {/* Visual Side Card Overlay */}
                <div className="hidden w-75 lg:block">
                  <motion.div
                    animate={{ rotate: [-2, 2, -2], y: [-5, 5, -5] }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Card className="bg-secondary/30 relative rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl">
                      <CardContent className="space-y-6 p-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full shadow-inner">
                            <Star className="text-primary fill-primary h-6 w-6" />
                          </div>
                          <div>
                            <div className="text-sm font-black italic">
                              Custom Order
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className="bg-primary h-2 w-2 rounded-full"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                            <motion.div
                              animate={{ width: ["0%", "85%"] }}
                              transition={{ duration: 2, delay: 1 }}
                              className="bg-primary h-full"
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase opacity-50">
                            <span>PROGRES PRODUKSI</span>
                            <span>85% Complete</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/5 pt-2">
                          <span className="text-xs font-bold">
                            Diperbarui Hari Ini
                          </span>
                          <Badge
                            variant="secondary"
                            className="border-none bg-emerald-500/20 text-emerald-500"
                          >
                            +3
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA06;
