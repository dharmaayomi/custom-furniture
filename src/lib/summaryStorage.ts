import { SummaryOrderPayload } from "@/types/summary";

export const SUMMARY_STORAGE_KEY = "custom-summary-order";

export const saveSummaryPayload = (payload: SummaryOrderPayload) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(payload));
};

export const loadSummaryPayload = (): SummaryOrderPayload | null => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SUMMARY_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SummaryOrderPayload;
  } catch {
    return null;
  }
};
