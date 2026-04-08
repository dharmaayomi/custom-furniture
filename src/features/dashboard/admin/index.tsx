import React from "react";
import Analytics from "../components/Analytics";
import { Download, RefreshCw, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const DashboardAdminPage = () => {
  return (
    <div>
      <header className="bg-card border-accent relative mb-5 overflow-hidden rounded-2xl border px-6 py-10 shadow-lg/5 sm:px-10">
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
                Operation Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground max-w-md text-sm">
              Revenue, order pipeline, and production progress across the custom
              furniture workflow.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-primary/20 flex items-center gap-2 px-10 font-bold shadow-2xl transition-transform hover:scale-[1.02]"
                >
                  <Download className="mr-2 h-4 w-4" /> Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>CSV Format</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>PDF Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Share Link</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              className="shadow-primary/20 flex items-center gap-2 px-10 font-bold shadow-2xl transition-transform hover:scale-[1.02]"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Check Updates
            </Button>
          </div>
        </div>
      </header>
      <Analytics />
    </div>
  );
};
