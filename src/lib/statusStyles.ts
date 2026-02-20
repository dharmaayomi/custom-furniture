import { cn } from "@/lib/utils";

export type StatusTone = "warning" | "info" | "success" | "danger" | "neutral";

const badgeToneClass: Record<StatusTone, string> = {
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  success:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  danger: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
  neutral: "bg-muted text-muted-foreground",
};

const alertToneClass: Record<StatusTone, string> = {
  warning:
    "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
  info: "border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10",
  success:
    "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10",
  danger: "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10",
  neutral: "border-border bg-muted/50",
};

const alertTitleToneClass: Record<StatusTone, string> = {
  warning: "text-amber-900 dark:text-amber-200",
  info: "text-sky-900 dark:text-sky-200",
  success: "text-emerald-900 dark:text-emerald-200",
  danger: "text-rose-900 dark:text-rose-200",
  neutral: "text-foreground",
};

const alertDescriptionToneClass: Record<StatusTone, string> = {
  warning: "text-amber-700 dark:text-amber-300",
  info: "text-sky-700 dark:text-sky-300",
  success: "text-emerald-700 dark:text-emerald-300",
  danger: "text-rose-700 dark:text-rose-300",
  neutral: "text-muted-foreground",
};

export const getStatusBadgeClass = (tone: StatusTone) =>
  cn("rounded-full px-2.5 py-1 text-xs font-medium", badgeToneClass[tone]);

export const getStatusAlertClass = (tone: StatusTone) =>
  cn("rounded-lg border p-3", alertToneClass[tone]);

export const getStatusAlertTitleClass = (tone: StatusTone) =>
  cn("text-sm font-medium", alertTitleToneClass[tone]);

export const getStatusAlertDescriptionClass = (tone: StatusTone) =>
  cn("mt-1 text-xs", alertDescriptionToneClass[tone]);
