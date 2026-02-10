type AvatarFallbackOptions = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  fallback?: string;
};

export const getAvatarFallback = ({
  firstName,
  lastName,
  name,
  fallback = "U",
}: AvatarFallbackOptions): string => {
  const initials: string[] = [];
  const safeFirst = firstName?.trim() ?? "";
  const safeLast = lastName?.trim() ?? "";

  if (safeFirst) initials.push(safeFirst[0]);
  if (safeLast) initials.push(safeLast[0]);

  if (initials.length === 0) {
    const fullName = name?.trim() ?? "";
    if (fullName) {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        initials.push(parts[0][0]);
      } else {
        initials.push(parts[0][0], parts[parts.length - 1][0]);
      }
    }
  }

  const value = initials.join("").toUpperCase();
  return value || fallback;
};
