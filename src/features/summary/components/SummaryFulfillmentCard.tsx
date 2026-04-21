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
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { DeliveryFeeEstimate } from "@/hooks/api/order/useGetDeliveryFeeEstimates";
import { formatPrice } from "@/lib/price";
import { Address } from "@/types/address";
import { DeliveryType } from "@/types/customOrder";
import { SummaryOrderPayload } from "@/types/summary";
import { MapPin, Plus, Store, Truck } from "lucide-react";

type SummaryFulfillmentCardProps = {
  selectedAddress?: Address;
  sortedAddresses: Address[];
  addressOptions: string[];
  addressLabelById: Record<string, string>;
  selectedAddressValue: string;
  onSelectedAddressValueChange: (value: string) => void;
  onOpenAddressModal: () => void;
  onCalculateFulfillment: () => void;
  isCalculatingFulfillment: boolean;
  hasCalculatedFulfillment: boolean;
  payloadConfiguration?: SummaryOrderPayload["configuration"];
  fulfillmentOption: DeliveryType;
  onFulfillmentOptionChange: (value: DeliveryType) => void;
  fulfillmentEstimates: DeliveryFeeEstimate[];
};

const getFulfillmentLabel = (option: DeliveryType) => {
  if (option === "STORE_DELIVERY") return "Kurir toko";
  if (option === "DELIVERY") return "JNE Kargo";
  return "Ambil di toko";
};

const getFulfillmentDescription = (estimate?: DeliveryFeeEstimate | null) => {
  if (!estimate) return "Pilih alamat lalu cek opsi fulfillment.";
  if (!estimate.available) {
    if (estimate.type === "STORE_DELIVERY") {
      return "Kurir toko belum tersedia untuk alamat ini. Khusus JABODETABEK.";
    }
    if (estimate.type === "DELIVERY") {
      return "JNE Kargo belum tersedia untuk alamat ini.";
    }
  }
  if (estimate.type === "STORE_DELIVERY") {
    return "Pengiriman dari kurir toko ke alamat yang dipilih. Hanya tersedia di JABODETABEK";
  }
  if (estimate.type === "DELIVERY") {
    return "Pengiriman reguler ke alamat yang dipilih.";
  }

  return "Ambil pesanan langsung di toko tanpa ongkir.";
};

const getFulfillmentNotice = (option: DeliveryType) => {
  if (option === "STORE_DELIVERY") {
    return "Kurir toko akan mengantar ke alamat yang dipilih. Hanya tersedia di JABODETABEK.";
  }
  if (option === "DELIVERY") {
    return "JNE Kargo akan dikirim ke alamat yang dipilih.";
  }

  return "Ambil langsung di toko sesuai jadwal pickup.";
};

export default function SummaryFulfillmentCard({
  selectedAddress,
  sortedAddresses,
  addressOptions,
  addressLabelById,
  selectedAddressValue,
  onSelectedAddressValueChange,
  onOpenAddressModal,
  onCalculateFulfillment,
  isCalculatingFulfillment,
  hasCalculatedFulfillment,
  payloadConfiguration,
  fulfillmentOption,
  onFulfillmentOptionChange,
  fulfillmentEstimates,
}: SummaryFulfillmentCardProps) {
  return (
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
                  onSelectedAddressValueChange(value ?? "")
                }
              >
                <ComboboxInput
                  placeholder="Pilih alamat pengiriman"
                  className="w-full text-xs md:text-sm"
                  showClear
                />
                <ComboboxContent>
                  <ComboboxEmpty>Alamat tidak ditemukan.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => {
                      const address = sortedAddresses.find(
                        (entry) => String(entry.id) === item,
                      );
                      return (
                        <ComboboxItem key={item} value={item}>
                          {addressLabelById[item] ?? item}
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
                    {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}
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
                onClick={onOpenAddressModal}
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
                onClick={onOpenAddressModal}
                className="text-primary text-xs font-semibold hover:underline"
              >
                Tambah alamat pertama
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          Pilih alamat terlebih dahulu, lalu cek opsi fulfillment untuk melihat
          ongkir setiap metode.
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onCalculateFulfillment}
          disabled={
            !selectedAddress ||
            !payloadConfiguration ||
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
              <p className="text-sm font-semibold">Pilih Metode Fulfillment</p>
              <p className="text-muted-foreground text-xs">
                Ongkir di bawah ini mengikuti alamat yang dipilih.
              </p>
            </div>
            <RadioGroup
              value={fulfillmentOption}
              onValueChange={(value) =>
                onFulfillmentOptionChange(value as DeliveryType)
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
                          <span className="text-primary text-sm font-bold sm:ml-auto">
                            {estimate.available
                              ? Number(estimate.fee ?? 0) === 0
                                ? "Gratis"
                                : formatPrice(Number(estimate.fee ?? 0))
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
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
