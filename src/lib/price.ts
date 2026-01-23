export const ASSET_PRICES: Record<string, number> = {
  "wine_cabinet.glb": 2500000,
  "cabinet-1.glb": 1800000,
  "cabinet.glb": 1500000,
  "chair-1.glb": 800000,
  "man.glb": 0,
  "wall_cupboard.glb": 2000000,
  "rakayolahkaliinibener.glb": 1500000,
  "ral-1.glb": 1500000,
  "restaurant_pub_wardrobe.glb": 2500000,
};

export const TEXTURE_PRICES: Record<string, number> = {
  // Textures are typically applied to existing items, so they don't add separate cost
  // If you want texture upgrades to have a cost, uncomment and set values:
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
    total += getAssetPrice(model);
  });

  if (activeTexture) {
    total += getTexturePrice(activeTexture);
  }

  return total;
};
