"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

export default function Step02() {
  const steps = [
    {
      title: "Measure",
      desc: "Share your room dimensions and layout so every cabinet and panel fits your real space.",
    },
    {
      title: "Customize",
      desc: "Choose base furniture, add components, and apply materials to match your style and budget.",
    },
    {
      title: "Review",
      desc: "See your design in preview, check item details, and confirm delivery requirements before checkout.",
    },
    {
      title: "Checkout",
      desc: "Place your order securely, track status updates, and move from concept to installation with confidence.",
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
              Design your custom furniture in{" "}
              <span className="text-primary italic">four clear steps.</span>
            </h2>
            <p className="text-muted-foreground mb-10 text-lg leading-relaxed italic">
              From room measurement to final payment, our workflow helps you
              build fitted furniture faster without losing control of details.
            </p>

            <Button className="bg-foreground text-background h-auto rounded-xl px-8 py-6 text-sm font-black tracking-[0.2em] uppercase shadow-xl transition-all hover:opacity-90">
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
