"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import useCreateCustomOrder from "@/hooks/api/order/useCreateCustomOrder";
import useGetDeliveryFeeEstimates, {
  DeliveryFeeEstimate,
} from "@/hooks/api/order/useGetDeliveryFeeEstimates";
import useCreateNewAddress, {
  CreateAddressInput,
} from "@/hooks/api/user/useCreateNewAddress";
import useGetUserAddresses from "@/hooks/api/user/useGetUserAddresses";
import { getApiErrorMessage } from "@/lib/api-error";
import { saveCheckoutSnapshot } from "@/lib/checkoutStorage";
import { deliveryTypeUsesAddress } from "@/lib/deliveryType";
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
  ChevronDown,
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

import SummaryAddressForm, {
  SummaryAddressFormData,
} from "./components/SummaryAddressForm";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const getAddressOptionLabel = (address: Address) =>
  `${address.label} - ${address.recipientName}`;

type FulfillmentOption = DeliveryType;
const FULFILLMENT_OPTION_ORDER: FulfillmentOption[] = [
  "DELIVERY",
  "STORE_DELIVERY",
  "PICKUP",
];

const getFulfillmentLabel = (option: FulfillmentOption) => {
  if (option === "DELIVERY") return "JNE Kargo";
  if (option === "STORE_DELIVERY") return "Kurir toko";
  return "Ambil di toko";
};

const getFulfillmentDescription = (estimate?: DeliveryFeeEstimate | null) => {
  if (!estimate) return "Pilih alamat lalu cek opsi fulfillment.";
  if (!estimate.available) {
    if (estimate.type === "DELIVERY") {
      return "JNE Kargo belum tersedia untuk alamat ini.";
    }
    if (estimate.type === "STORE_DELIVERY") {
      return "Kurir toko belum tersedia untuk alamat ini.";
    }
  }
  if (estimate.type === "DELIVERY") {
    return "Pengiriman reguler ke alamat yang dipilih.";
  }
  if (estimate.type === "STORE_DELIVERY") {
    return "Pengiriman lokal dari toko ke alamat yang dipilih.";
  }
  return "Ambil pesanan langsung di toko tanpa ongkir.";
};

const getFulfillmentNotice = (option: FulfillmentOption) => {
  if (option === "DELIVERY") {
    return "JNE Kargo akan dikirim ke alamat yang dipilih.";
  }
  if (option === "STORE_DELIVERY") {
    return "Kurir toko akan mengantar ke alamat yang dipilih.";
  }
  return "Ambil langsung di toko sesuai jadwal pickup.";
};

export default function SummaryDesignPage() {
  const router = useRouter();
  const { userId } = useUser();
  const [payload, setPayload] = useState<SummaryOrderPayload | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [fulfillmentOption, setFulfillmentOption] =
    useState<FulfillmentOption>("DELIVERY");
  const [hasCalculatedFulfillment, setHasCalculatedFulfillment] =
    useState(false);
  const [fulfillmentEstimates, setFulfillmentEstimates] = useState<
    DeliveryFeeEstimate[]
  >([]);
  const [selectedAddressValue, setSelectedAddressValue] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPaymentInfoOpen, setIsPaymentInfoOpen] = useState(false);
  const { data: addressesData, refetch: refetchAddresses } =
    useGetUserAddresses(userId);
  const { mutateAsync: createAddress, isPending: isCreatingAddress } =
    useCreateNewAddress(userId, {
      onSuccess: (newAddress) => {
        toast.success("Alamat berhasil ditambahkan.");
        setSelectedAddressValue(String(newAddress.id));
        setIsAddressModalOpen(false);
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(error, "Gagal menambahkan alamat baru."),
        );
      },
    });
  const { mutateAsync: createCustomOrder, isPending: isCreatingOrder } =
    useCreateCustomOrder();
  const {
    mutateAsync: getDeliveryFeeEstimates,
    isPending: isCalculatingFulfillment,
  } = useGetDeliveryFeeEstimates();

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
    if (!sortedAddresses.length || selectedAddressValue) return;
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
  const requiresAddress = deliveryTypeUsesAddress(fulfillmentOption);
  const checkoutDeliveryType: DeliveryType = fulfillmentOption;
  const subtotal = payload?.subtotal ?? 0;
  const discount =
    discountApplied && promoCode === "SAVE10" ? subtotal * 0.1 : 0;
  const totalItems = useMemo(
    () => payload?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [payload],
  );
  const selectedFulfillmentEstimate = useMemo(
    () => fulfillmentEstimates.find((item) => item.type === fulfillmentOption),
    [fulfillmentEstimates, fulfillmentOption],
  );
  const estimatedShippingFee = hasCalculatedFulfillment
    ? Number(selectedFulfillmentEstimate?.fee ?? 0)
    : 0;
  const estimatedTotal = subtotal - discount + estimatedShippingFee;

  useEffect(() => {
    setHasCalculatedFulfillment(false);
    setFulfillmentEstimates([]);
    setFulfillmentOption("DELIVERY");
  }, [selectedAddressValue]);

  const handleCreateAddress = async (data: SummaryAddressFormData) => {
    if (!userId) {
      toast.error("Silakan login terlebih dahulu untuk menambah alamat.");
      return;
    }
    const nextPayload: CreateAddressInput = {
      label: data.label,
      recipientName: data.recipientName,
      phoneNumber: data.phoneNumber,
      line1: data.line1,
      line2: data.line2 || undefined,
      city: data.city,
      district: data.district,
      subdistrict: data.subdistrict || undefined,
      province: data.province,
      jneTariffCode: data.jneTariffCode || undefined,
      country: data.country,
      isDefault: data.isDefault,
      latitude: data.latitude,
      longitude: data.longitude,
      postalCode: data.postalCode,
    };
    await createAddress(nextPayload);
    await refetchAddresses();
  };

  const handleCalculateFulfillment = async () => {
    if (!selectedAddress) {
      toast.error("Pilih alamat terlebih dahulu sebelum menghitung estimasi.");
      return;
    }

    if (!payload?.configuration) {
      toast.error("Konfigurasi desain tidak ditemukan.");
      return;
    }

    try {
      const estimates = await getDeliveryFeeEstimates({
        addressId: selectedAddress.id,
        configuration: payload.configuration,
      });
      const sortedEstimates = FULFILLMENT_OPTION_ORDER.map(
        (option) => estimates.find((item) => item.type === option),
      ).filter((item): item is DeliveryFeeEstimate => Boolean(item));
      const fallbackOption =
        sortedEstimates.find(
          (item) => item.type === fulfillmentOption && item.available,
        )?.type ??
        sortedEstimates.find((item) => item.available)?.type ??
        "PICKUP";

      setFulfillmentEstimates(sortedEstimates);
      setFulfillmentOption(fallbackOption);
      setHasCalculatedFulfillment(true);
    } catch {
      setHasCalculatedFulfillment(false);
      setFulfillmentEstimates([]);
    }
  };

  const handleProceedCheckout = async () => {
    if (!hasCalculatedFulfillment || !selectedFulfillmentEstimate) {
      toast.error("Pilih alamat lalu cek opsi fulfillment terlebih dahulu.");
      return;
    }
    if (requiresAddress && !selectedAddress) {
      toast.error("Silakan pilih alamat pengiriman terlebih dahulu.");
      return;
    }
    if (!selectedFulfillmentEstimate.available) {
      toast.error("Metode fulfillment yang dipilih belum tersedia.");
      return;
    }
    const fallbackDesignCode = loadDesignCodeFromStorage().trim();
    const resolvedDesignCode =
      payload?.designCode?.trim() || fallbackDesignCode;
    const resolvedConfiguration = payload?.configuration;
    if (!resolvedDesignCode && !resolvedConfiguration) {
      toast.error(
        "Data desain tidak ditemukan. Silakan kembali lalu buka ulang halaman ringkasan.",
      );
      return;
    }

    try {
      const checkoutPayload = {
        ...(resolvedDesignCode
          ? { designCode: resolvedDesignCode }
          : { configuration: resolvedConfiguration }),
        ...(payload?.previewUrl ? { previewUrl: payload.previewUrl } : {}),
        deliveryType: checkoutDeliveryType,
        ...(requiresAddress && selectedAddress
          ? { addressId: selectedAddress.id }
          : {}),
      };
      const result = await createCustomOrder(checkoutPayload);
      const orderId = String((result as any)?.id ?? "");
      const orderNumber = String((result as any)?.orderNumber ?? "").trim();

      if (orderId) {
        saveCheckoutSnapshot({
          orderNumber: orderNumber || undefined,
          orderId,
          status: (result as any)?.status ?? "PENDING_PAYMENT",
          deliveryType: checkoutDeliveryType,
          subtotal: Number((result as any)?.subtotalPrice ?? subtotal),
          deliveryFee: Number((result as any)?.deliveryFee ?? 0),
          grandTotal: Number(
            (result as any)?.grandTotalPrice ?? estimatedTotal,
          ),
          items: payload?.items ?? [],
          previewImage: payload?.previewImage,
          previewUrl: payload?.previewUrl,
          createdAt: (result as any)?.createdAt ?? new Date().toISOString(),
        });
      }

      toast.success("Pesanan berhasil dibuat.");
      router.push(orderId ? `/checkout?orderId=${orderId}` : "/checkout");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Gagal membuat pesanan."));
    }
  };

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="text-muted-foreground mb-5 flex items-center gap-2 text-sm">
          <span>Desain</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Ringkasan Desain</span>
        </div>

        <h1 className="mb-7 text-2xl font-bold tracking-tight sm:text-3xl">
          Ringkasan Desain
        </h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
          {/* left section */}
          <div className="space-y-5 lg:col-span-3">
            <Card className="ring-border/60 overflow-hidden border-0 shadow-sm ring-1">
              <CardContent className="p-3 sm:p-4">
                <div className="bg-muted overflow-hidden rounded-xl">
                  <div className="flex h-56 items-center justify-center sm:h-80 lg:h-105">
                    {payload?.previewImage ? (
                      <img
                        src={payload.previewImage}
                        alt="Preview ruangan"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center gap-2">
                        <Box className="h-10 w-10 opacity-30" />
                        <p className="text-sm">Preview belum tersedia</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="ring-border/60 border-0 shadow-sm ring-1">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                    <Package className="text-primary h-3.5 w-3.5" />
                  </div>
                  Daftar Produk
                  <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {totalItems} produk
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
                            Tersedia
                          </span>
                          <span className="text-muted-foreground text-xs">
                            Jumlah:{" "}
                            <span className="text-foreground font-semibold">
                              {item.quantity}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold sm:text-base">
                          {formatPrice(item.unitPrice)}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Subtotal {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
                    Belum ada produk pada ringkasan ini.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* right section */}
          <div className="lg:col-span-2">
            <div className="space-y-4 lg:sticky lg:top-22">
              <Card className="ring-border/60 border-0 shadow-sm ring-1">
                <CardHeader className="pt-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                      <Truck className="text-primary h-3.5 w-3.5" />
                    </div>
                    Metode Fulfillment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-5 pb-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                        <MapPin className="h-3 w-3" />
                        Alamat Pengiriman
                      </p>
                      {selectedAddress?.isDefault && (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-100 px-1.5 py-0 text-[10px] text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          Utama
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
                            placeholder="Pilih alamat pengiriman"
                            className="w-full text-xs md:text-sm"
                            showClear
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>
                              Alamat tidak ditemukan.
                            </ComboboxEmpty>
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
                                    {address?.isDefault ? " (Utama)" : ""}
                                  </ComboboxItem>
                                );
                              }}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>

                        {selectedAddress ? (
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
                              {selectedAddress.district}, {selectedAddress.city},{" "}
                              {selectedAddress.province}
                            </p>
                            <p className="text-muted-foreground">
                              {selectedAddress.country} {selectedAddress.postalCode}
                            </p>
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => setIsAddressModalOpen(true)}
                          className="text-primary flex items-center gap-1 text-xs font-medium hover:underline"
                        >
                          <Plus className="h-3 w-3" />
                          Tambah alamat baru
                        </button>
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed p-4 text-center">
                        <MapPin className="text-muted-foreground/40 mx-auto mb-2 h-6 w-6" />
                        <p className="text-muted-foreground mb-2 text-xs">
                          Belum ada alamat.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddressModalOpen(true)}
                          className="text-primary text-xs font-semibold hover:underline"
                        >
                          Tambah alamat pertama
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                    Pilih alamat terlebih dahulu, lalu cek opsi fulfillment untuk melihat ongkir setiap metode.
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleCalculateFulfillment}
                    disabled={
                      !selectedAddress ||
                      !payload?.configuration ||
                      isCalculatingFulfillment
                    }
                  >
                    {isCalculatingFulfillment
                      ? "Menghitung opsi fulfillment..."
                      : "Cek Opsi Fulfillment"}
                  </Button>
                  {hasCalculatedFulfillment ? (
                    <div className="space-y-3">
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">
                          Pilih Metode Fulfillment
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Ongkir di bawah ini mengikuti alamat yang dipilih.
                        </p>
                      </div>
                      <RadioGroup
                        value={fulfillmentOption}
                        onValueChange={(value) =>
                          setFulfillmentOption(value as FulfillmentOption)
                        }
                        className="max-w-full space-y-2"
                      >
                        {fulfillmentEstimates.map((estimate) => {
                          const icon =
                            estimate.type === "PICKUP" ? (
                              <Store className="h-3.5 w-3.5" />
                            ) : (
                              <Truck className="h-3.5 w-3.5" />
                            );

                          return (
                            <FieldLabel
                              key={estimate.type}
                              htmlFor={`fulfillment-${estimate.type}`}
                              className={
                                !estimate.available
                                  ? "cursor-not-allowed opacity-60"
                                  : undefined
                              }
                            >
                              <Field
                                orientation="horizontal"
                                data-disabled={!estimate.available}
                                className="items-start gap-3"
                              >
                                <FieldContent>
                                  <FieldTitle className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                                    {icon}
                                    <span className="text-sm">
                                      {getFulfillmentLabel(estimate.type)}
                                    </span>
                                    <span className="text-primary sm:ml-auto text-sm font-bold">
                                      {estimate.available
                                        ? estimate.fee === 0
                                          ? "Gratis"
                                          : formatPrice(
                                              Number(estimate.fee ?? 0),
                                            )
                                        : "Tidak tersedia"}
                                    </span>
                                  </FieldTitle>
                                  <FieldDescription className="text-xs">
                                    {getFulfillmentDescription(estimate)}
                                  </FieldDescription>
                                </FieldContent>
                                <RadioGroupItem
                                  value={estimate.type}
                                  id={`fulfillment-${estimate.type}`}
                                  disabled={!estimate.available}
                                />
                              </Field>
                            </FieldLabel>
                          );
                        })}
                      </RadioGroup>

                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                        {getFulfillmentNotice(fulfillmentOption)}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="ring-border/60 border-0 shadow-sm ring-1">
                <CardHeader className="pt-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                      <CreditCard className="text-primary h-3.5 w-3.5" />
                    </div>
                    Ringkasan Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-5 pb-5">
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                      <Tag className="h-3 w-3" />
                      Kode Promo
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder='contoh: "SAVE10"'
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-w-0 grow rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                      />
                      <button
                        onClick={() =>
                          promoCode.trim() && setDiscountApplied(true)
                        }
                        className="border-input bg-background hover:bg-muted shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition"
                      >
                        Pakai
                      </button>
                    </div>
                    {discountApplied && discount > 0 && (
                      <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Kode berhasil dipakai, diskon 10%.
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total Produk ({totalItems})
                      </span>
                      <span className="font-medium">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                        <span>Diskon (10%)</span>
                        <span className="font-medium">
                          -{formatPrice(discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Estimasi Ongkir
                      </span>
                      <span className="font-medium">
                        {!hasCalculatedFulfillment
                          ? "Pilih alamat dulu"
                          : estimatedShippingFee === 0
                            ? "Gratis"
                            : formatPrice(estimatedShippingFee)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/40 flex items-center justify-between rounded-xl px-4 py-3">
                    <span className="text-sm font-semibold">
                      Estimasi Pembayaran
                    </span>
                    <span className="text-xl font-bold tracking-tight">
                      {formatPrice(estimatedTotal)}
                    </span>
                  </div>

                  <Collapsible
                    open={isPaymentInfoOpen}
                    onOpenChange={setIsPaymentInfoOpen}
                    className="space-y-3"
                  >
                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-100">
                      <p className="font-semibold">
                        Bayar bertahap, tidak perlu lunas sekarang
                      </p>
                      <p className="mt-1 text-sm leading-6 text-sky-900/80 dark:text-sky-100/80">
                        Pembayaran dilakukan bertahap sesuai progres produksi.
                        Hari ini kamu hanya membayar DP untuk memulai.{" "}
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="text-sky-950 underline underline-offset-2 transition hover:text-sky-700 dark:text-sky-50 dark:hover:text-sky-200"
                          >
                            pelajari lebih lanjut
                          </button>
                        </CollapsibleTrigger>
                      </p>
                    </div>

                    <CollapsibleContent className="overflow-hidden rounded-xl border border-sky-200 bg-white px-4 py-4 text-sm shadow-sm dark:border-sky-900/40 dark:bg-slate-950">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            Bagaimana sistem pembayaran bertahap ini bekerja?
                          </p>
                        </div>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground shrink-0 transition"
                            aria-label="Tutup penjelasan pembayaran bertahap"
                          >
                            <ChevronDown className="h-4 w-4 rotate-180" />
                          </button>
                        </CollapsibleTrigger>
                      </div>

                      <div className="space-y-2 text-sm leading-6">
                        <p>
                          <span className="font-semibold">
                            Tahap 1 - DP
                          </span>{" "}
                          - Dibayar sekarang, produksi dimulai
                        </p>
                        <p>
                          <span className="font-semibold">Tahap 2</span> -
                          Ditagih setelah foto progres rakitan dikirim
                        </p>
                        <p>
                          <span className="font-semibold">Tahap 3</span> -
                          Ditagih setelah foto finishing dikirim
                        </p>
                        <p>
                          <span className="font-semibold">Tahap 4</span> -
                          Ditagih setelah produk siap kirim
                        </p>
                      </div>

                      <p className="text-muted-foreground mt-4 text-sm leading-6">
                        Nominal dan persentase tiap tahap akan tertera saat kamu
                        melanjutkan ke checkout. Kamu akan selalu dapat
                        notifikasi beserta foto bukti progres sebelum tagihan
                        berikutnya muncul.
                      </p>
                    </CollapsibleContent>
                  </Collapsible>

                  <Button
                    className="w-full gap-2 font-semibold"
                    size="lg"
                    onClick={handleProceedCheckout}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Membuat pesanan...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Lanjut ke Checkout
                      </>
                    )}
                  </Button>

                  <p className="text-muted-foreground text-center text-xs">
                    Total di atas sudah termasuk produk dan estimasi ongkir
                  </p>

                  <div className="space-y-2 pt-1">
                    <div className="text-muted-foreground flex items-center gap-2.5 text-xs">
                      <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
                        <Truck className="h-3.5 w-3.5" />
                      </div>
                      <span>
                        Opsi fulfillment mengikuti alamat yang dipilih
                      </span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2.5 text-xs">
                      <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </div>
                      <span>Gratis retur dalam 30 hari</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2.5 text-xs">
                      <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
                        <Shield className="h-3.5 w-3.5" />
                      </div>
                      <span>Checkout aman</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
            <DialogTitle>Tambah Alamat Pengiriman</DialogTitle>
            <DialogDescription>
              Tambahkan alamat pengiriman untuk melanjutkan checkout.
            </DialogDescription>
          </DialogHeader>
          <SummaryAddressForm
            title="Tambah Alamat Baru"
            description="Lengkapi detail alamat pengiriman Anda"
            submitLabel={isCreatingAddress ? "Menyimpan..." : "Simpan Alamat"}
            onSubmit={handleCreateAddress}
            layout="stacked"
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
