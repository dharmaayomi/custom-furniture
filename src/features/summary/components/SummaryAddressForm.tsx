"use client";

import React, { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import MapComponent from "@/features/dashboard/address/components/MapComponent";
import {
  useGetCities,
  useGetDistricts,
  useGetProvinces,
  useGetSubdistricts,
} from "@/hooks/api/user/useGetDestination";
import { Check, LocateFixed, Map, MapPin } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./SummaryDialogSelect";

export interface SummaryAddressFormData {
  label: string;
  recipientName: string;
  phoneNumber: string;
  line1: string;
  line2: string;
  city: string;
  district: string;
  subdistrict: string;
  province: string;
  provinceCode: string;
  cityCode: string;
  jneTariffCode: string;
  districtCode: string;
  subdistrictCode: string;
  country: string;
  latitude: number;
  longitude: number;
  postalCode: string;
  isDefault: boolean;
}

const INITIAL_STATE: SummaryAddressFormData = {
  label: "Rumah",
  recipientName: "",
  phoneNumber: "",
  line1: "",
  line2: "",
  city: "",
  district: "",
  subdistrict: "",
  province: "",
  provinceCode: "",
  cityCode: "",
  jneTariffCode: "",
  districtCode: "",
  subdistrictCode: "",
  country: "Indonesia",
  latitude: -7.747034,
  longitude: 110.377312,
  postalCode: "",
  isDefault: false,
};

interface SummaryAddressFormProps {
  initialData?: Partial<SummaryAddressFormData>;
  title?: string;
  description?: string;
  submitLabel?: string;
  onSubmit?: (data: SummaryAddressFormData) => Promise<void> | void;
  layout?: "default" | "stacked";
}

export default function SummaryAddressForm({
  initialData,
  title = "Tambah Alamat Baru",
  description = "Lengkapi detail alamat pengiriman Anda",
  submitLabel = "Simpan Alamat",
  onSubmit,
  layout = "default",
}: SummaryAddressFormProps) {
  const [formData, setFormData] = useState<SummaryAddressFormData>(() => ({
    ...INITIAL_STATE,
    ...initialData,
  }));
  const [baselineData, setBaselineData] = useState<SummaryAddressFormData>(
    () => ({
      ...INITIAL_STATE,
      ...initialData,
    }),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState("");

  const { data: provinces = [], isLoading: isLoadingProvinces } =
    useGetProvinces();
  const { data: cities = [], isLoading: isLoadingCities } = useGetCities(
    formData.province,
  );
  const { data: districts = [], isLoading: isLoadingDistricts } =
    useGetDistricts(formData.province, formData.city);
  const { data: subdistricts = [], isLoading: isLoadingSubdistricts } =
    useGetSubdistricts(formData.province, formData.city, formData.district);

  useEffect(() => {
    if (!initialData) return;
    const next = {
      ...INITIAL_STATE,
      ...initialData,
    };
    setFormData((prev) => ({
      ...prev,
      ...next,
    }));
    setBaselineData(next);
  }, [initialData]);

  useEffect(() => {
    if (
      !formData.subdistrict ||
      subdistricts.length === 0 ||
      subdistricts.some((item) => String(item.id) === formData.subdistrictCode)
    ) {
      return;
    }

    const matched = subdistricts.find(
      (item) => item.subdistrictName === formData.subdistrict,
    );

    if (!matched) return;

    setFormData((prev) => ({
      ...prev,
      subdistrictCode: String(matched.id),
      jneTariffCode: matched.tariffCode,
      postalCode: prev.postalCode || matched.zipCode,
    }));
  }, [
    formData.subdistrict,
    formData.subdistrictCode,
    subdistricts,
  ]);

  const hasFormChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(baselineData),
    [formData, baselineData],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.currentTarget;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMapSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationNotice("Geolocation tidak didukung di browser ini.");
      return;
    }

    setIsLocating(true);
    setLocationNotice("Meminta akses lokasi...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleMapSelect(latitude, longitude);
        setLocationNotice(
          "Lokasi berhasil diperbarui. Anda masih bisa menggeser pin untuk menyesuaikan.",
        );
        setIsLocating(false);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Silakan aktifkan akses lokasi di browser Anda."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Lokasi tidak tersedia. Silakan coba lagi."
              : "Permintaan lokasi habis waktu. Silakan coba lagi.";
        setLocationNotice(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    );
  };

  const handleProvinceChange = (provinceName: string) => {
    setFormData((prev) => ({
      ...prev,
      province: provinceName,
      provinceCode: "",
      cityCode: "",
      jneTariffCode: "",
      city: "",
      districtCode: "",
      district: "",
      subdistrictCode: "",
      subdistrict: "",
      postalCode: "",
    }));
  };

  const handleCityChange = (cityName: string) => {
    setFormData((prev) => ({
      ...prev,
      city: cityName,
      cityCode: "",
      jneTariffCode: "",
      districtCode: "",
      district: "",
      subdistrictCode: "",
      subdistrict: "",
      postalCode: "",
    }));
  };

  const handleDistrictChange = (districtName: string) => {
    setFormData((prev) => ({
      ...prev,
      district: districtName,
      districtCode: "",
      jneTariffCode: "",
      subdistrictCode: "",
      subdistrict: "",
      postalCode: "",
    }));
  };

  const handleSubdistrictChange = (subdistrictId: string) => {
    const selected = subdistricts.find(
      (item) => String(item.id) === subdistrictId,
    );

    setFormData((prev) => ({
      ...prev,
      subdistrictCode: selected ? String(selected.id) : "",
      jneTariffCode: selected?.tariffCode ?? "",
      subdistrict: selected?.subdistrictName ?? "",
      postalCode: selected?.zipCode ?? prev.postalCode,
    }));
  };

  const renderRegionFields = () => (
    <>
      {(() => {
        const fallbackProvinceValue =
          formData.province &&
          !provinces.some((item) => item.provinceName === formData.province)
            ? `fallback:${formData.province}`
            : "";
        const fallbackCityValue =
          formData.city && !cities.some((item) => item.cityName === formData.city)
            ? `fallback:${formData.city}`
            : "";
        const fallbackDistrictValue =
          formData.district &&
          !districts.some((item) => item.districtName === formData.district)
            ? `fallback:${formData.district}`
            : "";
        const fallbackSubdistrictValue =
          formData.subdistrict &&
          !subdistricts.some(
            (item) => String(item.id) === formData.subdistrictCode,
          )
            ? `fallback:${formData.subdistrict}`
            : "";

        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="provinceCode" className="text-sm font-medium">
                Provinsi *
              </Label>
              <Select
                value={fallbackProvinceValue || formData.province}
                onValueChange={handleProvinceChange}
                disabled={isLoadingProvinces}
              >
                <SelectTrigger id="provinceCode" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingProvinces
                        ? "Memuat provinsi..."
                        : "Pilih provinsi"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {fallbackProvinceValue ? (
                    <SelectItem value={fallbackProvinceValue}>
                      {formData.province}
                    </SelectItem>
                  ) : null}
                  {provinces.map((province) => (
                    <SelectItem
                      key={province.provinceName}
                      value={province.provinceName}
                    >
                      {province.provinceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityCode" className="text-sm font-medium">
                Kota *
              </Label>
              <Select
                value={fallbackCityValue || formData.city}
                onValueChange={handleCityChange}
                disabled={!formData.province || isLoadingCities}
              >
                <SelectTrigger id="cityCode" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingCities ? "Memuat kota..." : "Pilih kota"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {fallbackCityValue ? (
                    <SelectItem value={fallbackCityValue}>
                      {formData.city}
                    </SelectItem>
                  ) : null}
                  {cities.map((city) => (
                    <SelectItem key={city.cityName} value={city.cityName}>
                      {city.cityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="districtCode" className="text-sm font-medium">
                Kecamatan *
              </Label>
              <Select
                value={fallbackDistrictValue || formData.district}
                onValueChange={handleDistrictChange}
                disabled={!formData.city || isLoadingDistricts}
              >
                <SelectTrigger id="districtCode" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingDistricts
                        ? "Memuat kecamatan..."
                        : "Pilih kecamatan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {fallbackDistrictValue ? (
                    <SelectItem value={fallbackDistrictValue}>
                      {formData.district}
                    </SelectItem>
                  ) : null}
                  {districts.map((district) => (
                    <SelectItem
                      key={district.districtName}
                      value={district.districtName}
                    >
                      {district.districtName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdistrictCode" className="text-sm font-medium">
                Kelurahan
              </Label>
              <Select
                value={fallbackSubdistrictValue || formData.subdistrictCode}
                onValueChange={handleSubdistrictChange}
                disabled={!formData.district || isLoadingSubdistricts}
              >
                <SelectTrigger id="subdistrictCode" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingSubdistricts
                        ? "Memuat kelurahan..."
                        : "Pilih kelurahan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {fallbackSubdistrictValue ? (
                    <SelectItem value={fallbackSubdistrictValue}>
                      {formData.subdistrict}
                    </SelectItem>
                  ) : null}
                  {subdistricts.map((subdistrict) => (
                    <SelectItem
                      key={subdistrict.id}
                      value={String(subdistrict.id)}
                    >
                      {subdistrict.subdistrictName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );
      })()}
    </>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        console.log("Submitting address:", formData);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (layout === "stacked") {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="py-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="label" className="text-sm font-medium">
                  Label
                </Label>
                <Input
                  id="label"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="contoh: Rumah, Kantor"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientName" className="text-sm font-medium">
                  Nama Penerima *
                </Label>
                <Input
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  placeholder="Nama lengkap"
                  required
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  Nomor Telepon *
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+62 812 345 6789"
                  required
                  className="h-9"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="line1" className="text-sm font-medium">
                  Alamat Jalan *
                </Label>
                <Input
                  id="line1"
                  name="line1"
                  value={formData.line1}
                  onChange={handleInputChange}
                  placeholder="Alamat jalan"
                  required
                  className="h-9"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="line2" className="text-sm font-medium">
                  Info Tambahan
                </Label>
                <Input
                  id="line2"
                  name="line2"
                  value={formData.line2}
                  onChange={handleInputChange}
                  placeholder="Apartemen, lantai, dll."
                  className="h-9"
                />
              </div>

              {renderRegionFields()}

              <div className="space-y-2">
                <Label htmlFor="postalCode" className="text-sm font-medium">
                  Kode Pos *
                </Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="55281"
                  required
                  className="h-9"
                />
              </div>

              <div className="border-input bg-background flex h-9 items-center gap-3 rounded-lg border px-3 md:col-span-2">
                <Label
                  htmlFor="isDefault"
                  className="cursor-pointer text-sm font-medium"
                >
                  Jadikan alamat utama
                </Label>
                <Switch
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isDefault: checked }))
                  }
                />
              </div>
              <div className="bg-secondary/50 flex rounded-lg p-3 text-xs md:col-span-2">
                <Map className="text-muted-foreground mr-2 h-4 w-4" />
                <p className="text-muted-foreground">
                  Lat: {formData.latitude.toFixed(6)} | Lng:{" "}
                  {formData.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Pilih Lokasi
            </CardTitle>
            <CardDescription>
              Klik peta untuk memilih lokasi pengiriman
            </CardDescription>
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="gap-2"
              >
                <LocateFixed className="h-4 w-4" />
                {isLocating
                  ? "Mendeteksi lokasi..."
                  : "Gunakan Lokasi Saya Saat Ini"}
              </Button>
              <p className="text-muted-foreground mt-2 text-xs">
                Aktifkan izin lokasi di browser agar pin lebih akurat.
              </p>
              {locationNotice ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  {locationNotice}
                </p>
              ) : null}
            </div>
          </CardHeader>
          <div className="px-6">
            <MapComponent
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationSelect={handleMapSelect}
            />
          </div>
        </Card>

        <Button
          type="submit"
          disabled={isSubmitting || (!!initialData && !hasFormChanges)}
          className="w-full"
        >
          {isSubmitting ? (
            "Menyimpan..."
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label" className="text-sm font-medium">
                Label
              </Label>
              <Input
                id="label"
                name="label"
                value={formData.label}
                onChange={handleInputChange}
                placeholder="contoh: Rumah, Kantor"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientName" className="text-sm font-medium">
                Nama Penerima *
              </Label>
              <Input
                id="recipientName"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                placeholder="Nama lengkap"
                required
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                Nomor Telepon *
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+62 812 345 6789"
                required
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="line1" className="text-sm font-medium">
                Alamat Jalan *
              </Label>
              <Input
                id="line1"
                name="line1"
                value={formData.line1}
                onChange={handleInputChange}
                placeholder="Alamat jalan"
                required
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="line2" className="text-sm font-medium">
                Info Tambahan
              </Label>
              <Input
                id="line2"
                name="line2"
                value={formData.line2}
                onChange={handleInputChange}
                placeholder="Apartemen, lantai, dll."
                className="h-9"
              />
            </div>

            {renderRegionFields()}

            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-sm font-medium">
                Kode Pos *
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="55281"
                required
                className="h-9"
              />
            </div>

            <div className="border-input bg-background flex h-9 items-center gap-3 rounded-lg border px-3">
              <Label
                htmlFor="isDefault"
                className="cursor-pointer text-sm font-medium"
              >
                Jadikan alamat utama
              </Label>
              <Switch
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isDefault: checked }))
                }
              />
            </div>

            <div className="bg-secondary/50 rounded-lg p-3 text-xs">
              <p className="text-muted-foreground">
                Lat: {formData.latitude.toFixed(6)} | Lng:{" "}
                {formData.longitude.toFixed(6)}
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || (!!initialData && !hasFormChanges)}
              className="w-full"
            >
              {isSubmitting ? (
                "Menyimpan..."
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {submitLabel}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Pilih Lokasi
            </CardTitle>
            <CardDescription>
              Klik peta untuk memilih lokasi pengiriman
            </CardDescription>
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="gap-2"
              >
                <LocateFixed className="h-4 w-4" />
                {isLocating
                  ? "Mendeteksi lokasi..."
                  : "Gunakan Lokasi Saya Saat Ini"}
              </Button>
              <p className="text-muted-foreground mt-2 text-xs">
                Aktifkan izin lokasi di browser agar pin lebih akurat.
              </p>
              {locationNotice ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  {locationNotice}
                </p>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MapComponent
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationSelect={handleMapSelect}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
