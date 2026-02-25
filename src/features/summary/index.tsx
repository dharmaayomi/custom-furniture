"use client";

import { useEffect, useMemo, useState } from "react";
import { Truck, RotateCcw, Shield } from "lucide-react";
import { formatPrice } from "@/lib/price";
import { loadSummaryPayload } from "@/lib/summaryStorage";
import { SummaryOrderPayload } from "@/types/summary";
import useGetUserAddresses from "@/hooks/api/user/useGetUserAddresses";
import { useUser } from "@/providers/UserProvider";
import { Address } from "@/types/address";
import AddressForm, {
  AddressFormData,
} from "@/features/dashboard/address/components/AddressForm";
import useCreateNewAddress, {
  CreateAddressInput,
} from "@/hooks/api/user/useCreateNewAddress";
import { getApiErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const getAddressOptionLabel = (address: Address) =>
  `${address.label} - ${address.recipientName}`;

export default function SummaryDesignPage() {
  const [payload, setPayload] = useState<SummaryOrderPayload | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [selectedAddressValue, setSelectedAddressValue] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const { userId } = useUser();
  const { data: addressesData, refetch: refetchAddresses } =
    useGetUserAddresses(userId);

  useEffect(() => {
    setPayload(loadSummaryPayload());
  }, []);

  const addressesPayload = (addressesData as any)?.data ?? addressesData;
  const addresses = Array.isArray(addressesPayload)
    ? (addressesPayload as Address[])
    : [];
  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
    [addresses],
  );
  const addressOptions = useMemo(
    () => sortedAddresses.map((address) => String(address.id)),
    [sortedAddresses],
  );
  const addressLabelById = useMemo(
    () =>
      Object.fromEntries(
        sortedAddresses.map((address) => [
          String(address.id),
          getAddressOptionLabel(address),
        ]),
      ),
    [sortedAddresses],
  );

  useEffect(() => {
    if (!sortedAddresses.length) return;
    if (selectedAddressValue) return;
    const defaultAddress = sortedAddresses.find((address) => address.isDefault);
    setSelectedAddressValue(String((defaultAddress ?? sortedAddresses[0]).id));
  }, [sortedAddresses, selectedAddressValue]);

  const selectedAddress = useMemo(
    () =>
      sortedAddresses.find(
        (address) => String(address.id) === selectedAddressValue,
      ) ?? (selectedAddressValue ? sortedAddresses[0] : undefined),
    [sortedAddresses, selectedAddressValue],
  );
  const { mutateAsync: createAddress, isPending: isCreatingAddress } =
    useCreateNewAddress(userId, {
      onSuccess: (newAddress) => {
        toast.success("Address created");
        setSelectedAddressValue(String(newAddress.id));
        setIsAddressModalOpen(false);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Failed to create address."));
      },
    });

  const handleCreateAddress = async (data: AddressFormData) => {
    if (!userId) {
      toast.error("Please log in to add address.");
      return;
    }

    const payload: CreateAddressInput = {
      label: data.label,
      recipientName: data.recipientName,
      phoneNumber: data.phoneNumber,
      line1: data.line1,
      line2: data.line2 || undefined,
      city: data.city,
      district: data.district,
      subdistrict: data.subdistrict || undefined,
      province: data.province,
      provinceCode: data.provinceCode || undefined,
      cityCode: data.cityCode || undefined,
      districtCode: data.districtCode || undefined,
      subdistrictCode: data.subdistrictCode || undefined,
      country: data.country,
      isDefault: data.isDefault,
      latitude: data.latitude,
      longitude: data.longitude,
      postalCode: data.postalCode,
    };

    await createAddress(payload);
    await refetchAddresses();
  };

  const subtotal = payload?.subtotal ?? 0;
  const discount =
    discountApplied && promoCode === "SAVE10" ? subtotal * 0.1 : 0;
  const shippingCost = 0;
  const total = subtotal - discount + shippingCost;
  const totalItems = useMemo(
    () => payload?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [payload],
  );

  const applyPromo = () => {
    if (promoCode.trim()) {
      setDiscountApplied(true);
    }
  };

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-2 px-1 py-5 sm:mx-6 sm:px-2 sm:py-7 lg:mx-8 lg:px-4 lg:py-12">
        <h1 className="mb-5 text-2xl font-bold sm:mb-8 sm:text-3xl">
          Design Overview
        </h1>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="bg-muted mb-6 rounded-md p-2 sm:mb-10">
              <div className="bg-card flex h-55 items-center justify-center overflow-hidden rounded-md p-2 sm:h-80 lg:h-150">
                {payload?.previewImage ? (
                  <img
                    src={payload.previewImage}
                    alt="Room preview"
                    className="h-full w-full rounded-md object-cover"
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Preview image not available
                  </p>
                )}
              </div>
            </div>

            <div className="mb-3 text-sm font-semibold sm:text-base">
              Product List
            </div>

            <div className="space-y-6">
              {payload?.items.map((item) => (
                <div
                  key={item.id}
                  className="border-border pb-4 last:border-b-0 max-sm:border-b sm:flex sm:items-start sm:justify-between sm:gap-6 sm:rounded-lg sm:border sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 self-start">
                      <div className="bg-muted h-24 w-24 overflow-hidden rounded sm:h-32 sm:w-32">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full rounded object-cover object-center"
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-lg">
                        {item.name}
                      </h3>
                      <div className="text-muted-foreground mb-2 space-y-1 text-xs sm:mb-3 md:text-sm">
                        <p>SKU: {item.sku}</p>
                      </div>
                      <div className="mb-2 sm:mb-4">
                        <span className="inline-block rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          In Stock
                        </span>
                      </div>
                      <div className="text-muted-foreground hidden text-xs sm:block md:text-sm">
                        Quantity:{" "}
                        <span className="font-semibold">{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:hidden">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-muted-foreground text-xs">
                        Quantity:{" "}
                        <span className="font-semibold">{item.quantity}</span>
                      </p>
                      <p className="text-sm font-bold">
                        {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <p className="text-muted-foreground mt-1 text-right text-xs">
                      {formatPrice(item.subtotal)} subtotal
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-md font-bold md:text-xl">
                      {formatPrice(item.unitPrice)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {formatPrice(item.subtotal)} subtotal
                    </p>
                  </div>
                </div>
              ))}

              {!payload?.items.length ? (
                <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
                  No products in this summary.
                </div>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border-border rounded-lg border p-4 sm:p-6 lg:sticky lg:top-8">
              <h2 className="mb-5 text-lg font-bold sm:mb-6 sm:text-xl">
                Order Summary
              </h2>

              <div className="border-border mb-6 space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Delivery Address</p>
                  {selectedAddress?.isDefault ? (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Default
                    </span>
                  ) : null}
                </div>

                {sortedAddresses.length > 0 ? (
                  <>
                    <Combobox
                      items={addressOptions}
                      value={selectedAddressValue}
                      itemToStringLabel={(value) =>
                        addressLabelById[String(value)] ?? String(value)
                      }
                      onValueChange={(value) =>
                        setSelectedAddressValue(value ?? "")
                      }
                    >
                      <ComboboxInput
                        placeholder="Choose delivery address"
                        className="w-full text-xs md:text-sm"
                        showClear
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>No address found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => {
                            const address = sortedAddresses.find(
                              (entry) => String(entry.id) === item,
                            );
                            return (
                              <ComboboxItem key={item} value={item}>
                                {address
                                  ? getAddressOptionLabel(address)
                                  : item}
                                {address?.isDefault ? " (Default)" : ""}
                              </ComboboxItem>
                            );
                          }}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>

                    {selectedAddress ? (
                      <div className="text-muted-foreground space-y-1 text-xs">
                        <p className="text-foreground font-medium">
                          {selectedAddress.recipientName} (
                          {selectedAddress.phoneNumber})
                        </p>
                        <p>{selectedAddress.line1}</p>
                        {selectedAddress.line2 ? (
                          <p>{selectedAddress.line2}</p>
                        ) : null}
                        <p>
                          {selectedAddress.district}, {selectedAddress.city},{" "}
                          {selectedAddress.province}
                        </p>
                        <p>
                          {selectedAddress.country} {selectedAddress.postalCode}
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">
                      No address found. Add your first address to continue.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                      className="text-primary text-xs font-medium underline"
                    >
                      Add address now
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-w-0 grow rounded border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                />
                <button
                  onClick={applyPromo}
                  className="border-input bg-background hover:bg-muted shrink-0 rounded border px-3 py-2 text-sm font-medium transition sm:px-4"
                >
                  Apply
                </button>
              </div>

              <p className="text-muted-foreground mb-6 text-xs">
                Try <span className="font-semibold">SAVE10</span> for 10% off
              </p>

              <div className="text-muted-foreground mb-6 flex items-center gap-2">
                <span className="text-sm">{totalItems} items</span>
              </div>

              <div className="border-border mb-6 space-y-3 border-b pb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount (10%)</span>
                    <span className="font-medium">
                      -{formatPrice(discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                  </span>
                </div>
              </div>

              <div className="mb-6 flex items-center justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold md:text-2xl">
                  {formatPrice(total)}
                </span>
              </div>

              <button className="bg-primary text-primary-foreground hover:bg-primary/90 mb-6 w-full rounded py-3 font-semibold transition">
                Proceed to Chekout
              </button>

              <div className="text-muted-foreground space-y-3 text-xs">
                <p className="text-muted-foreground mb-4 text-center text-xs">
                  Taxes calculated at checkout
                </p>

                <div className="flex items-start gap-3">
                  <Truck
                    size={16}
                    className="text-muted-foreground/70 mt-0.5 shrink-0"
                  />
                  <span>Free shipping on orders over Rp 150.000</span>
                </div>

                <div className="flex items-start gap-3">
                  <RotateCcw
                    size={16}
                    className="text-muted-foreground/70 mt-0.5 shrink-0"
                  />
                  <span>Free 30-day returns</span>
                </div>

                <div className="flex items-start gap-3">
                  <Shield
                    size={16}
                    className="text-muted-foreground/70 mt-0.5 shrink-0"
                  />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={isAddressModalOpen}
        onOpenChange={(open) => {
          if (isCreatingAddress) return;
          setIsAddressModalOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Delivery Address</DialogTitle>
            <DialogDescription>
              Add your delivery address to continue checkout.
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            title="Add New Address"
            description="Fill in your delivery address details"
            submitLabel={isCreatingAddress ? "Saving..." : "Save Address"}
            onSubmit={handleCreateAddress}
            layout="stacked"
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
