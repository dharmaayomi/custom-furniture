"use client";

import AddressForm, { AddressFormData } from "./AddressForm";
import useGetUserAddressById from "@/hooks/api/user/useGetUserAddressById";
import useEditAddress, {
  EditAddressSchema,
} from "@/hooks/api/user/useEditAddress";
import { useUser } from "@/providers/UserProvider";
import { Address } from "@/types/address";
import { toast } from "sonner";

interface AddressEditFormProps {
  addressId: number;
}

export default function AddressEditForm({ addressId }: AddressEditFormProps) {
  const { userId } = useUser();
  const {
    data: addressData,
    isLoading,
    isError,
  } = useGetUserAddressById(userId ?? 0, addressId);
  const addressPayload = (addressData as any)?.data ?? addressData;
  const address = addressPayload as Address | undefined;
  const { mutateAsync } = useEditAddress(userId ?? 0, addressId);

  const initialData: Partial<AddressFormData> | undefined = address
    ? {
        label: address.label,
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        line1: address.line1,
        line2: address.line2 ?? "",
        city: address.city,
        district: address.district,
        province: address.province,
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
    if (current.province !== original.province) {
      payload.province = current.province;
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
      payload.postalCode = nextPostalCode ? Number(nextPostalCode) : undefined;
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
    toast("Address updated");
  };

  if (!userId) {
    return (
      <div className="text-sm text-muted-foreground">
        Please log in to edit your address.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading address...</div>
    );
  }

  if (isError || !address) {
    return (
      <div className="text-sm text-muted-foreground">
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
    />
  );
}
