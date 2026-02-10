"use client";

import AddressForm, { AddressFormData } from "./AddressForm";
import { MOCK_ADDRESSES } from "../data/mockAddresses";

interface AddressEditFormProps {
  addressId: number;
}

export default function AddressEditForm({ addressId }: AddressEditFormProps) {
  const address = MOCK_ADDRESSES.find((item) => item.id === addressId);

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
        latitude: address.latitude,
        longitude: address.longitude,
        postalCode: String(address.postalCode ?? ""),
        isDefault: address.isDefault,
      }
    : undefined;

  return (
    <AddressForm
      initialData={initialData}
      title="Edit Address"
      description="Update your delivery address details"
      submitLabel="Update Address"
    />
  );
}
