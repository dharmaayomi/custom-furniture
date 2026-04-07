"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";

export default function Step02() {
  const router = useRouter();
  const steps = [
    {
      title: "Ukur ",
      desc: "Bagikan dimensi dan tata letak ruangan Anda agar setiap kabinet dan panel pas di ruang nyata Anda.",
    },
    {
      title: "Kustomisasi",
      desc: "Pilih furnitur dasar, tambahkan komponen, dan terapkan material yang sesuai dengan gaya dan anggaran Anda",
    },
    {
      title: "Tinjau",
      desc: "Lihat desain Anda dalam pratinjau, periksa detail item, dan konfirmasi kebutuhan pengiriman sebelum checkout.",
    },
    {
      title: "Checkout",
      desc: "Lakukan pemesanan dengan aman, pantau pembaruan status, dan wujudkan konsep menjadi instalasi dengan penuh keyakinan.",
    },
  ];

  return (
    <section className="px-4 py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <Badge
                variant="outline"
                className="bg-primary/10 border-primary/20 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black tracking-widest uppercase"
              >
                How it works
              </Badge>
            </motion.div>
            <h2 className="mb-6 text-4xl leading-[1.1] font-black tracking-tight lg:text-5xl">
              Desain furnitur kustom Anda dalam{" "}
              <span className="text-primary italic">empat langkah mudah.</span>
            </h2>
            <p className="text-muted-foreground mb-10 text-lg leading-relaxed italic">
              Dari pengukuran ruangan hingga pembayaran akhir, alur kerja kami
              membantu Anda membangun furnitur yang pas lebih cepat tanpa
              kehilangan kendali atas detailnya.
            </p>

            <Button
              className="bg-foreground text-background h-auto rounded-xl px-8 py-6 text-sm font-black tracking-[0.2em] uppercase shadow-xl transition-all hover:opacity-90"
              onClick={() => router.push("/custom")}
            >
              Start Customizing
            </Button>
          </div>

          <div className="relative pl-8 md:pl-0">
            {/* Vertical Line */}
            <div className="bg-border/40 absolute top-4 bottom-4 left-14 w-0.5 md:left-6.75" />

            <div className="space-y-12">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex gap-8 md:gap-10"
                >
                  {/* Number Bubble */}
                  <div className="bg-background border-muted group hover:border-primary relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 shadow-sm transition-colors duration-300">
                    <span className="text-muted-foreground group-hover:text-primary text-lg font-black">
                      {i + 1}
                    </span>
                  </div>

                  <div className="pt-2">
                    <h3 className="mb-2 flex items-center gap-2 text-xl font-bold tracking-tight">
                      {step.title}
                      {i === 0 && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </h3>
                    <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
