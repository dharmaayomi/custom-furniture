"use client";

import AddressForm, { AddressFormData } from "./AddressForm";
import useGetUserAddressById from "@/hooks/api/user/useGetUserAddressById";
import useEditAddress, {
  EditAddressSchema,
} from "@/hooks/api/user/useEditAddress";
import { useUser } from "@/providers/UserProvider";
import { Address } from "@/types/address";
import { toast } from "sonner";
import AddressFormSkeleton from "./AddressFormSkeleton";
import { useRouter } from "next/navigation";

interface AddressEditFormProps {
  addressId: number;
}

export default function AddressEditForm({ addressId }: AddressEditFormProps) {
  const router = useRouter();
  const { userId } = useUser();
  const {
    data: addressData,
    isLoading,
    isError,
  } = useGetUserAddressById(userId, addressId);
  const addressPayload = (addressData as any)?.data ?? addressData;
  const rawAddress = addressPayload as Record<string, any> | undefined;
  const address: Address | undefined = rawAddress
    ? ({
        ...rawAddress,
        label: rawAddress.label ?? rawAddress.address_label ?? "",
        recipientName:
          rawAddress.recipientName ?? rawAddress.recipient_name ?? "",
        phoneNumber: rawAddress.phoneNumber ?? rawAddress.phone_number ?? "",
        line1:
          rawAddress.line1 ?? rawAddress.line_1 ?? rawAddress.address1 ?? "",
        line2:
          rawAddress.line2 ?? rawAddress.line_2 ?? rawAddress.address2 ?? "",
        city:
          rawAddress.city ?? rawAddress.regency ?? rawAddress.kabupaten ?? "",
        district:
          rawAddress.district ??
          rawAddress.kecamatan ??
          rawAddress.subregency ??
          "",
        subdistrict:
          rawAddress.subdistrict ??
          rawAddress.village ??
          rawAddress.kelurahan ??
          rawAddress.sub_district ??
          "",
        province:
          rawAddress.province ??
          rawAddress.provinceName ??
          rawAddress.province_name ??
          "",
        provinceCode: rawAddress.provinceCode ?? rawAddress.province_code ?? "",
        cityCode:
          rawAddress.cityCode ??
          rawAddress.city_code ??
          rawAddress.regencyCode ??
          rawAddress.regency_code ??
          "",
        jneCityCode:
          rawAddress.jneCityCode ?? rawAddress.jne_city_code ?? "",
        districtCode: rawAddress.districtCode ?? rawAddress.district_code ?? "",
        subdistrictCode:
          rawAddress.subdistrictCode ??
          rawAddress.subdistrict_code ??
          rawAddress.villageCode ??
          rawAddress.village_code ??
          "",
        country: rawAddress.country ?? rawAddress.country_name ?? "Indonesia",
        latitude:
          rawAddress.latitude ?? rawAddress.lat ?? rawAddress.location_lat ?? 0,
        longitude:
          rawAddress.longitude ??
          rawAddress.lng ??
          rawAddress.location_lng ??
          0,
        isDefault: rawAddress.isDefault ?? rawAddress.is_default ?? false,
        postalCode: String(
          rawAddress.postalCode ?? rawAddress.postal_code ?? "",
        ),
      } as Address)
    : undefined;
  const { mutateAsync } = useEditAddress(userId, addressId, {
    onSuccess: () => {
      toast("Address updated");
      router.push("/dashboard/address");
    },
    onError: (error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to update address.";
      toast.error(message);
    },
  });

  const initialData: Partial<AddressFormData> | undefined = address
    ? {
        label: address.label,
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        line1: address.line1,
        line2: address.line2 ?? "",
        city: address.city,
        district: address.district,
        subdistrict: address.subdistrict ?? "",
        province: address.province,
        provinceCode: address.provinceCode ?? "",
        cityCode: address.cityCode ?? "",
        districtCode: address.districtCode ?? "",
        subdistrictCode: address.subdistrictCode ?? "",
        country: address.country,
        latitude: address.latitude ?? 0,
        longitude: address.longitude ?? 0,
        postalCode: String(address.postalCode ?? ""),
        isDefault: address.isDefault,
      }
    : undefined;

  const buildEditPayload = (
    current: AddressFormData,
    original: Address,
  ): EditAddressSchema => {
    const payload: EditAddressSchema = {};
    if (current.label !== original.label) payload.label = current.label;
    if (current.recipientName !== original.recipientName) {
      payload.recipientName = current.recipientName;
    }
    if (current.phoneNumber !== original.phoneNumber) {
      payload.phoneNumber = current.phoneNumber;
    }
    if (current.line1 !== original.line1) payload.line1 = current.line1;
    const originalLine2 = original.line2 ?? "";
    if (current.line2 !== originalLine2) payload.line2 = current.line2;
    if (current.city !== original.city) payload.city = current.city;
    if (current.district !== original.district) {
      payload.district = current.district;
    }
    const originalSubdistrict = original.subdistrict ?? "";
    if (current.subdistrict !== originalSubdistrict) {
      payload.subdistrict = current.subdistrict || undefined;
    }
    if (current.province !== original.province) {
      payload.province = current.province;
    }
    const originalProvinceCode = original.provinceCode ?? "";
    if (current.provinceCode !== originalProvinceCode) {
      payload.provinceCode = current.provinceCode || undefined;
    }
    const originalCityCode = original.cityCode ?? "";
    if (current.cityCode !== originalCityCode) {
      payload.cityCode = current.cityCode || undefined;
    }
    const originalDistrictCode = original.districtCode ?? "";
    if (current.districtCode !== originalDistrictCode) {
      payload.districtCode = current.districtCode || undefined;
    }
    const originalSubdistrictCode = original.subdistrictCode ?? "";
    if (current.subdistrictCode !== originalSubdistrictCode) {
      payload.subdistrictCode = current.subdistrictCode || undefined;
    }
    if (current.country !== original.country) {
      payload.country = current.country;
    }
    if (current.isDefault !== original.isDefault) {
      payload.isDefault = current.isDefault;
    }
    if (current.latitude !== (original.latitude ?? 0)) {
      payload.latitude = current.latitude;
    }
    if (current.longitude !== (original.longitude ?? 0)) {
      payload.longitude = current.longitude;
    }
    const originalPostalCode = original.postalCode
      ? String(original.postalCode)
      : "";
    if (current.postalCode !== originalPostalCode) {
      const nextPostalCode = current.postalCode.trim();
      payload.postalCode = nextPostalCode || undefined;
    }
    return payload;
  };

  const handleSubmit = async (data: AddressFormData) => {
    if (!address || !userId) return;
    const payload = buildEditPayload(data, address);
    if (Object.keys(payload).length === 0) {
      toast("No changes", { description: "Nothing to update." });
      return;
    }
    await mutateAsync(payload);
  };

  if (!userId) {
    return (
      <div className="text-muted-foreground text-sm">
        Please log in to edit your address.
      </div>
    );
  }

  if (isLoading) {
    return <AddressFormSkeleton />;
  }

  if (isError || !address) {
    return (
      <div className="text-muted-foreground text-sm">
        Failed to load address.
      </div>
    );
  }

  return (
    <AddressForm
      initialData={initialData}
      title="Edit Address"
      description="Update your delivery address details"
      submitLabel="Update Address"
      onSubmit={handleSubmit}
      layout="stacked"
    />
  );
}
