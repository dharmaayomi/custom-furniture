import { customAlphabet } from "nanoid";

export const DESIGN_CODE_STORAGE_KEY = "custom:designCode";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const createDesignCode = customAlphabet(CODE_CHARS);

export const generateDesignCode = (length = 6) => {
  return createDesignCode(length);
};

export const saveDesignCodeToStorage = (code: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DESIGN_CODE_STORAGE_KEY, code);
};

export const loadDesignCodeFromStorage = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(DESIGN_CODE_STORAGE_KEY) || "";
};
