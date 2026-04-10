"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Pratinjau 3D membantu kami memvalidasi ukuran kabinet sebelum produksi. Hari pemasangan berjalan lancar dan persis seperti yang direncanakan.",
    author: "Nadia Putri",
    role: "Pemilik Rumah, Jakarta",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=faces",
  },
  {
    quote:
      "Dari pemilihan material hingga checkout, alurnya sangat jelas. Tim interior kami kini bisa mempresentasikan pilihan jauh lebih cepat.",
    author: "Rizky Mahendra",
    role: "Konsultan Interior",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces",
  },
  {
    quote:
      "Klien mempercayai prosesnya karena mereka bisa meninjau dimensi, komponen, dan harga sebelum mengkonfirmasi pesanan.",
    author: "Kevin Wijaya",
    role: "Manajer Proyek, Studio Furni",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces",
  },
  {
    quote:
      "Detail pengiriman di checkout sangat membantu. Kami bisa mengkonfirmasi pemenuhan, jarak, dan alamat dalam satu tempat.",
    author: "Sinta Lestari",
    role: "Kepala Operasional, Custom Furniture",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
  },
];

export default function Testimonial04() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="container mx-auto mb-15 px-14">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            <Badge
              variant="outline"
              className="bg-primary/10 border-primary/20 mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1"
            >
              <Quote className="text-primary h-3 w-3" />
              <span className="text-primary text-[10px] font-black tracking-widest uppercase">
                Client Stories
              </span>
            </Badge>
          </motion.div>
          <h2 className="text-4xl leading-[1.1] font-black tracking-tighter md:text-6xl">
            Dipercaya oleh{" "}
            <span className="text-primary decoration-primary/20 italic underline underline-offset-8">
              pemilik rumah dan tim interior
            </span>{" "}
            yang membangun ruang kustom.
          </h2>
        </div>
      </div>

      <div className="group relative">
        <div className="absolute inset-y-0 left-0 z-10 w-32 bg-linear-to-r from-zinc-50 to-transparent dark:from-black" />
        <div className="absolute inset-y-0 right-0 z-10 w-32 bg-linear-to-l from-zinc-50 to-transparent dark:from-black" />

        <div className="flex overflow-hidden select-none">
          <div className="animate-marquee pause-on-hover flex gap-8 pt-5 pb-15">
            {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
              <Card
                key={i}
                className="border-border/30 hover:border-primary/40 group/card relative w-105 shrink-0 overflow-hidden rounded-[2.5rem] bg-zinc-50 p-0 shadow-xs transition-all duration-500 hover:shadow-2xl dark:bg-zinc-900"
              >
                <CardContent className="p-10">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-opacity group-hover/card:opacity-[0.08]">
                    <Quote className="h-24 w-24" />
                  </div>
                  <p className="text-foreground relative z-10 mb-10 text-lg leading-relaxed font-medium italic md:text-xl">
                    "{t.quote}"
                  </p>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={t.avatar}
                        alt={t.author}
                        className="border-background h-14 w-14 rounded-2xl border-2 object-cover shadow-lg"
                        crossOrigin="anonymous"
                      />
                      <div className="bg-primary border-background absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2">
                        <Check className="h-3 w-3 stroke-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-tight">
                        {t.author}
                      </h4>
                      <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                        {t.role}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-marquee {
          display: flex;
          animation: marquee 50s linear infinite;
        }
        .pause-on-hover:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
      `}</style>
    </section>
  );
}
