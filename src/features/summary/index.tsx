"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import AddressForm, {
  AddressFormData,
} from "@/features/dashboard/address/components/AddressForm";
import useCreateCustomOrder from "@/hooks/api/order/useCreateCustomOrder";
import useCreateNewAddress, {
  CreateAddressInput,
} from "@/hooks/api/user/useCreateNewAddress";
import useGetUserAddresses from "@/hooks/api/user/useGetUserAddresses";
import { getApiErrorMessage } from "@/lib/api-error";
import { saveCheckoutSnapshot } from "@/lib/checkoutStorage";
import { loadDesignCodeFromStorage } from "@/lib/designCode";
import { formatPrice } from "@/lib/price";
import { loadSummaryPayload } from "@/lib/summaryStorage";
import { useUser } from "@/providers/UserProvider";
import { Address } from "@/types/address";
import { DeliveryType } from "@/types/customOrder";
import { SummaryOrderPayload } from "@/types/summary";
import {
  Box,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  Shield,
  Store,
  Tag,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const getAddressOptionLabel = (address: Address) =>
  `${address.label} - ${address.recipientName}`;

export default function SummaryDesignPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<SummaryOrderPayload | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("DELIVERY");
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
  const { mutateAsync: createCustomOrder, isPending: isCreatingOrder } =
    useCreateCustomOrder();

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

  const handleProceedCheckout = async () => {
    if (deliveryType === "DELIVERY" && !selectedAddress) {
      toast.error("Please select a delivery address first.");
      return;
    }
    const fallbackDesignCode = loadDesignCodeFromStorage().trim();
    const resolvedDesignCode =
      payload?.designCode?.trim() || fallbackDesignCode;
    const resolvedConfiguration = payload?.configuration;

    if (!resolvedDesignCode && !resolvedConfiguration) {
      toast.error("Missing design data. Please go back and re-open Summary.");
      return;
    }

    try {
      console.log(
        "[Summary] checkout mode:",
        resolvedDesignCode ? "designCode" : "configuration",
      );
      if (!resolvedDesignCode && resolvedConfiguration) {
        const config = resolvedConfiguration as Record<string, unknown>;
        const productBase = Array.isArray(config.productBase)
          ? config.productBase
          : [];
        const productComponent = Array.isArray(config.productComponent)
          ? config.productComponent
          : [];
        console.log("[Summary] configuration keys:", Object.keys(config));
        console.log(
          "[Summary] configuration productBase count:",
          productBase.length,
        );
        console.log(
          "[Summary] configuration productComponent count:",
          productComponent.length,
        );
      }

      const checkoutPayload = {
        ...(resolvedDesignCode
          ? { designCode: resolvedDesignCode }
          : { configuration: resolvedConfiguration }),
        ...(payload?.previewUrl ? { previewUrl: payload.previewUrl } : {}),
        deliveryType,
        ...(deliveryType === "DELIVERY" && selectedAddress
          ? { addressId: selectedAddress.id }
          : {}),
      };

      console.log("[Summary] createCustomOrder payload:", checkoutPayload);

      const result = await createCustomOrder(checkoutPayload);

      const orderId = String((result as any)?.id ?? "");
      const orderNumber = String((result as any)?.orderNumber ?? "").trim();

      if (orderId) {
        saveCheckoutSnapshot({
          orderNumber: orderNumber || undefined,
          orderId,
          status: (result as any)?.status ?? "PENDING_PAYMENT",
          deliveryType,
          subtotal: Number((result as any)?.subtotalPrice ?? subtotal),
          deliveryFee: Number(
            (result as any)?.deliveryFee ?? (deliveryType === "PICKUP" ? 0 : 0),
          ),
          grandTotal: Number((result as any)?.grandTotalPrice ?? total),
          items: payload?.items ?? [],
          previewImage: payload?.previewImage,
          previewUrl: payload?.previewUrl,
          createdAt: (result as any)?.createdAt ?? new Date().toISOString(),
        });
      }

      toast.success("Order created");
      router.push(orderId ? `/checkout?orderId=${orderId}` : "/checkout");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create order."));
    }
  };

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        {/* Breadcrumb */}
        <div className="text-muted-foreground mb-5 flex items-center gap-2 text-sm">
          <span>Design</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Design Overview</span>
        </div>

        <h1 className="mb-7 text-2xl font-bold tracking-tight sm:text-3xl">
          Design Overview
        </h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* ── LEFT COLUMN ─────────────────────────────── */}
          <div className="space-y-5 lg:col-span-2">
            {/* Preview card */}
            <Card className="ring-border/60 overflow-hidden border-0 shadow-sm ring-1">
              <CardContent className="p-3 sm:p-4">
                <div className="bg-muted overflow-hidden rounded-xl">
                  <div className="flex h-56 items-center justify-center sm:h-80 lg:h-105">
                    {payload?.previewImage ? (
                      <img
                        src={payload.previewImage}
                        alt="Room preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center gap-2">
                        <Box className="h-10 w-10 opacity-30" />
                        <p className="text-sm">Preview not available</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product list card */}
            <Card className="ring-border/60 border-0 shadow-sm ring-1">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                    <Package className="text-primary h-3.5 w-3.5" />
                  </div>
                  Product List
                  <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {totalItems} item{totalItems !== 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-5">
                {payload?.items.length ? (
                  payload.items.map((item) => (
                    <div
                      key={item.id}
                      className="ring-border/50 hover:bg-muted/20 flex items-start gap-3 rounded-xl p-4 ring-1 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="ring-border/40 h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-1 sm:h-24 sm:w-24">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
                            <Box className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-0.5 text-sm font-semibold sm:text-base">
                          {item.name}
                        </h3>
                        <p className="text-muted-foreground mb-2 text-xs">
                          SKU: {item.sku}
                        </p>
                        {item.materialName ? (
                          <p className="text-muted-foreground mb-2 text-xs">
                            Material:{" "}
                            <span className="text-foreground font-medium">
                              {item.materialName}
                            </span>
                            {item.materialSku ? ` (${item.materialSku})` : ""}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            In Stock
                          </span>
                          <span className="text-muted-foreground text-xs">
                            Qty:{" "}
                            <span className="text-foreground font-semibold">
                              {item.quantity}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold sm:text-base">
                          {formatPrice(item.unitPrice)}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {formatPrice(item.subtotal)} subtotal
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
                    No products in this summary.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT COLUMN – sticky sidebar ───────────── */}
          <div className="lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-22">
              {/* Fulfillment + Address */}
              <Card className="ring-border/60 border-0 shadow-sm ring-1">
                <CardHeader className="pt-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                      <Truck className="text-primary h-3.5 w-3.5" />
                    </div>
                    Fulfillment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-5 pb-5">
                  {/* Toggle */}
                  <div className="bg-muted/50 grid grid-cols-2 gap-1 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("DELIVERY")}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
                        deliveryType === "DELIVERY"
                          ? "bg-background text-foreground ring-border/60 shadow-sm ring-1"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Truck className="h-3.5 w-3.5" />
                      Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("PICKUP")}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
                        deliveryType === "PICKUP"
                          ? "bg-background text-foreground ring-border/60 shadow-sm ring-1"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Store className="h-3.5 w-3.5" />
                      Pickup
                    </button>
                  </div>

                  {/* Address section */}
                  {deliveryType === "DELIVERY" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                          <MapPin className="h-3 w-3" />
                          Delivery Address
                        </p>
                        {selectedAddress?.isDefault && (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-100 px-1.5 py-0 text-[10px] text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            Default
                          </Badge>
                        )}
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

                          {selectedAddress && (
                            <div className="bg-muted/40 space-y-0.5 rounded-xl p-3 text-xs">
                              <p className="text-foreground font-semibold">
                                {selectedAddress.recipientName}{" "}
                                <span className="text-muted-foreground font-normal">
                                  ({selectedAddress.phoneNumber})
                                </span>
                              </p>
                              <p className="text-muted-foreground">
                                {selectedAddress.line1}
                                {selectedAddress.line2
                                  ? `, ${selectedAddress.line2}`
                                  : ""}
                              </p>
                              <p className="text-muted-foreground">
                                {selectedAddress.district},{" "}
                                {selectedAddress.city},{" "}
                                {selectedAddress.province}
                              </p>
                              <p className="text-muted-foreground">
                                {selectedAddress.country}{" "}
                                {selectedAddress.postalCode}
                              </p>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setIsAddressModalOpen(true)}
                            className="text-primary flex items-center gap-1 text-xs font-medium hover:underline"
                          >
                            <Plus className="h-3 w-3" />
                            Add new address
                          </button>
                        </>
                      ) : (
                        <div className="rounded-xl border border-dashed p-4 text-center">
                          <MapPin className="text-muted-foreground/40 mx-auto mb-2 h-6 w-6" />
                          <p className="text-muted-foreground mb-2 text-xs">
                            No address found.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsAddressModalOpen(true)}
                            className="text-primary text-xs font-semibold hover:underline"
                          >
                            Add your first address
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted/40 text-muted-foreground flex items-start gap-2.5 rounded-xl p-3 text-xs">
                      <Store className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Pickup selected — no delivery address required.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="ring-border/60 border-0 shadow-sm ring-1">
                <CardHeader className="pt-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                      <CreditCard className="text-primary h-3.5 w-3.5" />
                    </div>
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-5 pb-5">
                  {/* Promo code */}
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                      <Tag className="h-3 w-3" />
                      Promo Code
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder='e.g. "SAVE10"'
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-w-0 grow rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                      />
                      <button
                        onClick={applyPromo}
                        className="border-input bg-background hover:bg-muted shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition"
                      >
                        Apply
                      </button>
                    </div>
                    {discountApplied && discount > 0 && (
                      <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Code applied — 10% off!
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Line items */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Items ({totalItems})
                      </span>
                      <span className="font-medium">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                        <span>Discount (10%)</span>
                        <span className="font-medium">
                          −{formatPrice(discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {shippingCost === 0
                          ? "Free"
                          : formatPrice(shippingCost)}
                      </span>
                    </div>
                  </div>

                  {/* Grand total */}
                  <div className="bg-muted/40 flex items-center justify-between rounded-xl px-4 py-3">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-xl font-bold tracking-tight">
                      {formatPrice(total)}
                    </span>
                  </div>

                  {/* CTA */}
                  <Button
                    className="w-full gap-2 font-semibold"
                    size="lg"
                    onClick={handleProceedCheckout}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating Order…
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Proceed to Checkout
                      </>
                    )}
                  </Button>

                  <p className="text-muted-foreground text-center text-xs">
                    Taxes calculated at checkout
                  </p>

                  {/* Trust badges */}
                  <div className="space-y-2 pt-1">
                    <div className="text-muted-foreground flex items-center gap-2.5 text-xs">
                      <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
                        <Truck className="h-3.5 w-3.5" />
                      </div>
                      <span>Free shipping on orders over Rp 150.000</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2.5 text-xs">
                      <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </div>
                      <span>Free 30-day returns</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2.5 text-xs">
                      <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
                        <Shield className="h-3.5 w-3.5" />
                      </div>
                      <span>Secure checkout</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Address Dialog */}
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
