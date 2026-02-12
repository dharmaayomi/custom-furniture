export const DESIGN_CODE_STORAGE_KEY = "custom:designCode";

export const saveDesignCodeToStorage = (code: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DESIGN_CODE_STORAGE_KEY, code);
};

export const loadDesignCodeFromStorage = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(DESIGN_CODE_STORAGE_KEY) || "";
};

export const clearDesignCodeFromStorage = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DESIGN_CODE_STORAGE_KEY);
};
