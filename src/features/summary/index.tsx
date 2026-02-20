"use client";

import { useEffect, useMemo, useState } from "react";
import { Truck, RotateCcw, Shield } from "lucide-react";
import { formatPrice } from "@/lib/price";
import { loadSummaryPayload } from "@/lib/summaryStorage";
import { SummaryOrderPayload } from "@/types/summary";
import useGetUserAddresses from "@/hooks/api/user/useGetUserAddresses";
import { useUser } from "@/providers/UserProvider";
import { Address } from "@/types/address";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export default function SummaryDesignPage() {
  const [payload, setPayload] = useState<SummaryOrderPayload | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [selectedAddressValue, setSelectedAddressValue] = useState("");
  const { userId } = useUser();
  const { data: addressesData } = useGetUserAddresses(userId);

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
  const getAddressOptionLabel = (address: Address) =>
    `${address.label} - ${address.recipientName}`;
  const addressOptions = useMemo(
    () => sortedAddresses.map((address) => getAddressOptionLabel(address)),
    [sortedAddresses],
  );

  useEffect(() => {
    if (!sortedAddresses.length) return;
    if (selectedAddressValue) return;
    const defaultAddress = sortedAddresses.find((address) => address.isDefault);
    setSelectedAddressValue(
      getAddressOptionLabel(defaultAddress ?? sortedAddresses[0]),
    );
  }, [sortedAddresses, selectedAddressValue]);

  const selectedAddress = useMemo(
    () =>
      sortedAddresses.find(
        (address) => getAddressOptionLabel(address) === selectedAddressValue,
      ) ?? (selectedAddressValue ? sortedAddresses[0] : undefined),
    [sortedAddresses, selectedAddressValue],
  );

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
    <main className="min-h-screen">
      <div className="mx-2 px-1 py-5 sm:mx-6 sm:px-2 sm:py-7 lg:mx-8 lg:px-4 lg:py-12">
        <h1 className="mb-5 text-2xl font-bold sm:mb-8 sm:text-3xl">
          Design Overview
        </h1>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="bg-muted mb-6 rounded-md p-2 sm:mb-10">
              <div className="bg-card flex h-55 items-center justify-center overflow-hidden rounded-md p-2 sm:h-80 lg:h-110">
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
                  className="border-b border-gray-200 pb-4 last:border-b-0 sm:flex sm:items-start sm:justify-between sm:gap-6 sm:rounded-lg sm:border sm:p-4"
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
                      <div className="mb-2 space-y-1 text-xs text-gray-600 sm:mb-3 md:text-sm">
                        <p>SKU: {item.sku}</p>
                      </div>
                      <div className="mb-2 sm:mb-4">
                        <span className="inline-block rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                          In Stock
                        </span>
                      </div>
                      <div className="hidden text-xs text-gray-700 sm:block md:text-sm">
                        Quantity:{" "}
                        <span className="font-semibold">{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:hidden">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-700">
                        Quantity:{" "}
                        <span className="font-semibold">{item.quantity}</span>
                      </p>
                      <p className="text-sm font-bold">
                        {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <p className="mt-1 text-right text-xs text-gray-500">
                      {formatPrice(item.subtotal)} subtotal
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-md font-bold md:text-xl">
                      {formatPrice(item.unitPrice)}
                    </p>
                    <p className="text-sm text-gray-500">
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
            <div className="rounded-lg border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-8">
              <h2 className="mb-5 text-lg font-bold sm:mb-6 sm:text-xl">
                Order Summary
              </h2>

              <div className="mb-6 space-y-3 rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Delivery Address</p>
                  {selectedAddress?.isDefault ? (
                    <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      Default
                    </span>
                  ) : null}
                </div>

                {sortedAddresses.length > 0 ? (
                  <>
                    <Combobox
                      items={addressOptions}
                      value={selectedAddressValue}
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
                              (entry) => getAddressOptionLabel(entry) === item,
                            );
                            return (
                              <ComboboxItem key={item} value={item}>
                                {item}
                                {address?.isDefault ? " (Default)" : ""}
                              </ComboboxItem>
                            );
                          }}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>

                    {selectedAddress ? (
                      <div className="space-y-1 text-xs text-gray-600">
                        <p className="font-medium text-gray-800">
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
                  <p className="text-xs text-gray-500">
                    No address found. Add address first in dashboard.
                  </p>
                )}
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="min-w-0 grow rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={applyPromo}
                  className="shrink-0 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-gray-50 sm:px-4"
                >
                  Apply
                </button>
              </div>

              <p className="mb-6 text-xs text-gray-600">
                Try <span className="font-semibold">SAVE10</span> for 10% off
              </p>

              <div className="mb-6 flex items-center gap-2 text-gray-700">
                <span className="text-sm">{totalItems} items</span>
              </div>

              <div className="mb-6 space-y-3 border-b border-gray-200 pb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
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
                  <span className="text-gray-600">Shipping</span>
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

              <button className="mb-6 w-full rounded bg-black py-3 font-semibold text-white transition hover:bg-gray-900">
                Proceed to Checkout
              </button>

              <div className="space-y-3 text-xs text-gray-600">
                <p className="mb-4 text-center text-xs text-gray-500">
                  Taxes calculated at checkout
                </p>

                <div className="flex items-start gap-3">
                  <Truck size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <span>Free shipping on orders over Rp 150.000</span>
                </div>

                <div className="flex items-start gap-3">
                  <RotateCcw
                    size={16}
                    className="mt-0.5 shrink-0 text-gray-400"
                  />
                  <span>Free 30-day returns</span>
                </div>

                <div className="flex items-start gap-3">
                  <Shield size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
