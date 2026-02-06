export const ASSET_PRICES: Record<string, number> = {
  "wine_cabinet.glb": 2500000,
  "wooden_cupboard.glb": 2000000,
  "lemaritest.glb": 1500000,
  "cabinet-2.glb": 1800000,
  "cabinet.glb": 1500000,
  "wall_cupboard.glb": 2000000,
  "BoomBox.glb": 2500000,
};

export const TEXTURE_PRICES: Record<string, number> = {
  // "fine-wood-texture.jpg": 150000,
  // "light-wood-texture.jpg": 150000,
  // "wood-texture.jpg": 100000,
  // "WoodFine23_COL_1K.jpg": 200000,
  // "gray-abstract-texture.jpg": 80000,
  // "texture-of-dry-concrete-wall.jpg": 60000,
};

export const getAssetPrice = (assetName: string): number => {
  return ASSET_PRICES[assetName] || 0;
};

export const getTexturePrice = (textureName: string): number => {
  return TEXTURE_PRICES[textureName] || 0;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const extractModelNameFromId = (uniqueId: string): string => {
  // Extract original model name from uniqueId
  // Supported formats:
  // - model_timestamp_randomstring
  // - model_index
  const parts = uniqueId.split("_");
  let base = uniqueId;

  if (parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1])) {
    base = parts.slice(0, -1).join("_");
  } else if (parts.length > 2) {
    base = parts.slice(0, -2).join("_");
  }

  if (!base.includes(".") && ASSET_PRICES[`${base}.glb`]) {
    return `${base}.glb`;
  }

  return base;
};

export const calculateTotalPrice = (
  mainModel: string,
  additionalModels: string[],
  activeTexture: string,
): number => {
  let total = 0;

  if (mainModel) {
    total += getAssetPrice(mainModel);
  }

  additionalModels.forEach((model) => {
    // Extract the actual model name if it's a unique ID
    const modelName = extractModelNameFromId(model);
    total += getAssetPrice(modelName);
  });

  if (activeTexture) {
    total += getTexturePrice(activeTexture);
  }
  return total;
};
