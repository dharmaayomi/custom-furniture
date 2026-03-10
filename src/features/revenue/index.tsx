import React from "react";
import { TrendingUp } from "lucide-react";

export const RevenuePage = () => {
  return (
    <section className="space-y-8 px-1 pb-10">
      <header className="bg-card border-accent relative overflow-hidden rounded-2xl border px-6 py-10 shadow-lg/5 sm:px-10">
        <div className="from-primary/5 to-primary/20 pointer-events-none absolute -top-17 -right-20 h-72 w-72 rounded-full bg-linear-to-br md:-top-14 md:-right-24 lg:-top-16 lg:-right-8" />
        <div className="from-primary/10 to-primary/30 pointer-events-none absolute -top-13 -right-28 h-64 w-64 rounded-full bg-linear-to-br md:-top-10 md:-right-32 lg:-top-12 lg:-right-12" />
        <div className="from-primary/20 to-primary/80 pointer-events-none absolute -top-9 -right-36 h-56 w-56 rounded-full bg-linear-to-br md:-top-6 md:-right-40 lg:-top-8 lg:-right-16" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="bg-primary/10 rounded-lg p-2">
                <TrendingUp className="text-primary h-5 w-5" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Revenue
              </h1>
            </div>
            <p className="text-muted-foreground max-w-md text-sm">
              Monitor revenue performance, trends, and business growth.
            </p>
          </div>
        </div>
      </header>
    </section>
  );
};
