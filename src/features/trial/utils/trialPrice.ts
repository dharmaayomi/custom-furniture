import {
  TRIAL_PRODUCT_BASES,
  TRIAL_PRODUCT_COMPONENTS,
  TRIAL_PRODUCT_MATERIALS,
} from "../core/AssetCatalog";

/**
 * Step 1:
 * Trial uses backend-shaped mock data, so the price calculation should read from
 * those source collections instead of the older static GLB map in `src/lib/price.ts`.
 */

const getTrialProductBasePrice = (assetId: string) => {
  return (
    TRIAL_PRODUCT_BASES.find((item) => item.id === assetId)?.basePrice ?? 0
  );
};

const getTrialProductComponentPrice = (assetId: string) => {
  return (
    TRIAL_PRODUCT_COMPONENTS.find((item) => item.id === assetId)?.price ?? 0
  );
};

const getTrialProductMaterialPrice = (assetId: string) => {
  return (
    TRIAL_PRODUCT_MATERIALS.find((item) => item.id === assetId)?.price ?? 0
  );
};

export const calculateTrialTotalPrice = (
  frameProductIds: string[],
  componentProductIds: string[],
  materialProductIds: string[],
) => {
  let total = 0;

  frameProductIds.forEach((assetId) => {
    total += getTrialProductBasePrice(assetId);
  });

  componentProductIds.forEach((assetId) => {
    total += getTrialProductComponentPrice(assetId);
  });

  materialProductIds.forEach((assetId) => {
    total += getTrialProductMaterialPrice(assetId);
  });

  return Math.round(total);
};
