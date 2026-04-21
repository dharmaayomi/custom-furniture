import useAxios from "@/hooks/useAxios";
import {
  JneCity,
  JneDestination,
  JneDistrict,
  JneProvince,
  JneSubdistrict,
} from "@/types/jneDestinations";
import { useQuery } from "@tanstack/react-query";

type ApiArrayResponse<T> = {
  data?: T[];
};

const JNE_DESTINATIONS_BASE_PATH = "/user/jne-destinations";

const normalizeParam = (value: string) => value.trim();

const extractArrayData = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as ApiArrayResponse<T>).data)
  ) {
    return (payload as ApiArrayResponse<T>).data ?? [];
  }

  return [];
};

const hasText = (value: string | null | undefined) => value?.trim().length;

export const useGetJNEDestinations = (search: string) => {
  const axiosInstance = useAxios();
  const normalizedSearch = normalizeParam(search);

  return useQuery<JneDestination[]>({
    queryKey: ["jne-destinations", normalizedSearch],
    queryFn: async () => {
      const { data } = await axiosInstance.get(JNE_DESTINATIONS_BASE_PATH, {
        params: { search: normalizedSearch },
      });

      return extractArrayData<JneDestination>(data);
    },
    enabled: normalizedSearch.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useGetProvinces = () => {
  const axiosInstance = useAxios();

  return useQuery<JneProvince[]>({
    queryKey: ["jne-destinations", "provinces"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `${JNE_DESTINATIONS_BASE_PATH}/provinces`,
      );

      return extractArrayData<JneProvince>(data).filter((item) =>
        Boolean(hasText(item.provinceName)),
      );
    },
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useGetCities = (provinceName: string) => {
  const axiosInstance = useAxios();
  const normalizedProvinceName = normalizeParam(provinceName);

  return useQuery<JneCity[]>({
    queryKey: ["jne-destinations", "cities", normalizedProvinceName],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `${JNE_DESTINATIONS_BASE_PATH}/cities`,
        {
          params: { province: normalizedProvinceName },
        },
      );

      return extractArrayData<JneCity>(data).filter((item) =>
        Boolean(hasText(item.cityName)),
      );
    },
    enabled: normalizedProvinceName.length > 0,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useGetDistricts = (provinceName: string, cityName: string) => {
  const axiosInstance = useAxios();
  const normalizedProvinceName = normalizeParam(provinceName);
  const normalizedCityName = normalizeParam(cityName);

  return useQuery<JneDistrict[]>({
    queryKey: [
      "jne-destinations",
      "districts",
      normalizedProvinceName,
      normalizedCityName,
    ],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `${JNE_DESTINATIONS_BASE_PATH}/districts`,
        {
          params: {
            province: normalizedProvinceName,
            city: normalizedCityName,
          },
        },
      );

      return extractArrayData<JneDistrict>(data).filter((item) =>
        Boolean(hasText(item.districtName)),
      );
    },
    enabled: normalizedProvinceName.length > 0 && normalizedCityName.length > 0,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useGetSubdistricts = (
  provinceName: string,
  cityName: string,
  districtName: string,
) => {
  const axiosInstance = useAxios();
  const normalizedProvinceName = normalizeParam(provinceName);
  const normalizedCityName = normalizeParam(cityName);
  const normalizedDistrictName = normalizeParam(districtName);

  return useQuery<JneSubdistrict[]>({
    queryKey: [
      "jne-destinations",
      "subdistricts",
      normalizedProvinceName,
      normalizedCityName,
      normalizedDistrictName,
    ],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `${JNE_DESTINATIONS_BASE_PATH}/subdistricts`,
        {
          params: {
            province: normalizedProvinceName,
            city: normalizedCityName,
            district: normalizedDistrictName,
          },
        },
      );

      return extractArrayData<JneSubdistrict>(data).filter(
        (item) => item.id > 0 && Boolean(hasText(item.subdistrictName)),
      );
    },
    enabled:
      normalizedProvinceName.length > 0 &&
      normalizedCityName.length > 0 &&
      normalizedDistrictName.length > 0,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

const useGetDestination = {
  useGetJNEDestinations,
  useGetProvinces,
  useGetCities,
  useGetDistricts,
  useGetSubdistricts,
};

export default useGetDestination;
