"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
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
import { Box, CheckCircle2, ChevronRight, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import SummaryAddressForm, {
  SummaryAddressFormData,
} from "./components/SummaryAddressForm";
import SummaryFulfillmentCard from "./components/SummaryFulfillmentCard";
import SummaryOrderCard from "./components/SummaryOrderCard";

const getAddressOptionLabel = (address: Address) =>
  `${address.label} - ${address.recipientName}`;

type FulfillmentOption = DeliveryType;
const FULFILLMENT_OPTION_ORDER: FulfillmentOption[] = [
  "STORE_DELIVERY",
  "DELIVERY",
  "PICKUP",
];
const CHECKOUT_LOADING_STATES = [
  { text: "Memvalidasi ringkasan desain" },
  { text: "Memeriksa metode fulfillment terpilih" },
  { text: "Membuat order checkout" },
  { text: "Menyiapkan pembayaran bertahap" },
  { text: "Mengarahkan ke halaman checkout" },
];
const CHECKOUT_LOADER_DURATION_MS = 1000;
const CHECKOUT_LOADER_TOTAL_MS =
  CHECKOUT_LOADING_STATES.length * CHECKOUT_LOADER_DURATION_MS;

export default function SummaryDesignPage() {
  const router = useRouter();
  const { userId } = useUser();
  const [payload, setPayload] = useState<SummaryOrderPayload | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [fulfillmentOption, setFulfillmentOption] =
    useState<FulfillmentOption>("STORE_DELIVERY");
  const [hasCalculatedFulfillment, setHasCalculatedFulfillment] =
    useState(false);
  const [fulfillmentEstimates, setFulfillmentEstimates] = useState<
    DeliveryFeeEstimate[]
  >([]);
  const [selectedAddressValue, setSelectedAddressValue] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPaymentInfoOpen, setIsPaymentInfoOpen] = useState(false);
  const [isCheckoutTransitioning, setIsCheckoutTransitioning] = useState(false);
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
    setFulfillmentOption("STORE_DELIVERY");
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
      const sortedEstimates = FULFILLMENT_OPTION_ORDER.map((option) =>
        estimates.find((item) => item.type === option),
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

    const checkoutTransitionStartedAt = Date.now();
    setIsCheckoutTransitioning(true);

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
      const remainingLoaderTime = Math.max(
        CHECKOUT_LOADER_TOTAL_MS - (Date.now() - checkoutTransitionStartedAt),
        0,
      );

      if (remainingLoaderTime > 0) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, remainingLoaderTime),
        );
      }
      router.push(orderId ? `/checkout?orderId=${orderId}` : "/checkout");
    } catch (error) {
      setIsCheckoutTransitioning(false);
      toast.error(getApiErrorMessage(error, "Gagal membuat pesanan."));
    }
  };

  return (
    <>
      <MultiStepLoader
        loadingStates={CHECKOUT_LOADING_STATES}
        loading={isCheckoutTransitioning}
        duration={CHECKOUT_LOADER_DURATION_MS}
        loop={false}
      />

      <main className="bg-background text-foreground min-h-screen">
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
          <div className="text-muted-foreground mb-5 flex items-center gap-2 text-sm">
            <span>Desain</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">
              Ringkasan Desain
            </span>
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
                <SummaryFulfillmentCard
                  selectedAddress={selectedAddress}
                  sortedAddresses={sortedAddresses}
                  addressOptions={addressOptions}
                  addressLabelById={addressLabelById}
                  selectedAddressValue={selectedAddressValue}
                  onSelectedAddressValueChange={setSelectedAddressValue}
                  onOpenAddressModal={() => setIsAddressModalOpen(true)}
                  onCalculateFulfillment={handleCalculateFulfillment}
                  isCalculatingFulfillment={isCalculatingFulfillment}
                  hasCalculatedFulfillment={hasCalculatedFulfillment}
                  payloadConfiguration={payload?.configuration}
                  fulfillmentOption={fulfillmentOption}
                  onFulfillmentOptionChange={setFulfillmentOption}
                  fulfillmentEstimates={fulfillmentEstimates}
                />

                <SummaryOrderCard
                  promoCode={promoCode}
                  onPromoCodeChange={setPromoCode}
                  onApplyPromoCode={() =>
                    promoCode.trim() && setDiscountApplied(true)
                  }
                  discountApplied={discountApplied}
                  discount={discount}
                  totalItems={totalItems}
                  subtotal={subtotal}
                  hasCalculatedFulfillment={hasCalculatedFulfillment}
                  estimatedShippingFee={estimatedShippingFee}
                  estimatedTotal={estimatedTotal}
                  isPaymentInfoOpen={isPaymentInfoOpen}
                  onPaymentInfoOpenChange={setIsPaymentInfoOpen}
                  onProceedCheckout={handleProceedCheckout}
                  isProceedingCheckout={
                    isCreatingOrder || isCheckoutTransitioning
                  }
                />
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
    </>
  );
}
