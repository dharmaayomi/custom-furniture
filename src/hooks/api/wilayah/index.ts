export type WilayahOption = {
  id: string;
  name: string;
};

const WILAYAH_PROXY_BASE_URL = "/api/wilayah";

const parseWilayahOptions = (payload: unknown): WilayahOption[] => {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      const raw = item as Record<string, unknown>;
      const id =
        typeof raw.id === "string"
          ? raw.id
          : typeof raw.code === "string"
            ? raw.code
            : "";
      const name = typeof raw.name === "string" ? raw.name : "";

      if (!id || !name) return null;
      return { id, name };
    })
    .filter((item): item is WilayahOption => Boolean(item));
};

const fetchWilayahOptions = async (path: string): Promise<WilayahOption[]> => {
  const normalizedPath = path.replace(/^\/+/, "");
  const response = await fetch(`${WILAYAH_PROXY_BASE_URL}/${normalizedPath}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch wilayah options: ${response.status}`);
  }

  const payload = await response.json();
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data: unknown }).data
      : payload;

  return parseWilayahOptions(data);
};

export const getProvinces = () => fetchWilayahOptions("provinces.json");
export const getRegencies = (provinceCode: string) =>
  fetchWilayahOptions(`regencies/${provinceCode}.json`);
export const getDistricts = (regencyCode: string) =>
  fetchWilayahOptions(`districts/${regencyCode}.json`);
export const getVillages = (districtCode: string) =>
  fetchWilayahOptions(`villages/${districtCode}.json`);
