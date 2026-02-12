"use client";

import AddressForm, { AddressFormData } from "./AddressForm";
import { useUser } from "@/providers/UserProvider";
import useCreateNewAddress, {
  CreateAddressInput,
} from "@/hooks/api/user/useCreateNewAddress";
import { toast } from "sonner";

export default function AddressCreateForm() {
  const { userId } = useUser();
  const { mutateAsync } = useCreateNewAddress(userId, {
    onSuccess: () => {
      toast.success("Address created");
    },
    onError: (error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to create address.";
      toast.error(message);
    },
  });

  const handleSubmit = async (data: AddressFormData) => {
    if (!userId) return;
    const payload: CreateAddressInput = {
      label: data.label,
      recipientName: data.recipientName,
      phoneNumber: data.phoneNumber,
      line1: data.line1,
      line2: data.line2 || undefined,
      city: data.city,
      district: data.district,
      province: data.province,
      country: data.country,
      isDefault: data.isDefault,
      latitude: data.latitude,
      longitude: data.longitude,
      postalCode: Number(data.postalCode),
    };
    await mutateAsync(payload);
  };

  return <AddressForm onSubmit={handleSubmit} layout="stacked" />;
}
