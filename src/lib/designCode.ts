export const DESIGN_CODE_STORAGE_KEY = "custom:designCode";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateDesignCode = (length = 6) => {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
};

export const saveDesignCodeToStorage = (code: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DESIGN_CODE_STORAGE_KEY, code);
};

export const loadDesignCodeFromStorage = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(DESIGN_CODE_STORAGE_KEY) || "";
};
