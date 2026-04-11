"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/price";
import {
  CheckCircle2,
  ChevronDown,
  CreditCard,
  RotateCcw,
  Shield,
  Tag,
  Truck,
} from "lucide-react";

type SummaryOrderCardProps = {
  promoCode: string;
  onPromoCodeChange: (value: string) => void;
  onApplyPromoCode: () => void;
  discountApplied: boolean;
  discount: number;
  totalItems: number;
  subtotal: number;
  hasCalculatedFulfillment: boolean;
  estimatedShippingFee: number;
  estimatedTotal: number;
  isPaymentInfoOpen: boolean;
  onPaymentInfoOpenChange: (open: boolean) => void;
  onProceedCheckout: () => void;
  isProceedingCheckout: boolean;
};

export default function SummaryOrderCard({
  promoCode,
  onPromoCodeChange,
  onApplyPromoCode,
  discountApplied,
  discount,
  totalItems,
  subtotal,
  hasCalculatedFulfillment,
  estimatedShippingFee,
  estimatedTotal,
  isPaymentInfoOpen,
  onPaymentInfoOpenChange,
  onProceedCheckout,
  isProceedingCheckout,
}: SummaryOrderCardProps) {
  return (
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
              onChange={(e) => onPromoCodeChange(e.target.value)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-w-0 grow rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
            <button
              onClick={onApplyPromoCode}
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
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
              <span>Diskon (10%)</span>
              <span className="font-medium">-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimasi Ongkir</span>
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
          <span className="text-sm font-semibold">Estimasi Pembayaran</span>
          <span className="text-xl font-bold tracking-tight">
            {formatPrice(estimatedTotal)}
          </span>
        </div>

        <Collapsible
          open={isPaymentInfoOpen}
          onOpenChange={onPaymentInfoOpenChange}
          className="space-y-3"
        >
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-100">
            <p className="font-semibold">
              Bayar bertahap, tidak perlu lunas sekarang
            </p>
            <p className="mt-1 text-xs leading-6 text-sky-900/80 dark:text-sky-100/80">
              Pembayaran dilakukan bertahap sesuai progres produksi. Hari ini
              kamu hanya membayar DP untuk memulai.{" "}
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

            <div className="space-y-2 text-xs leading-6">
              <p>
                <span className="font-semibold">Tahap 1 - DP</span> - Dibayar
                sekarang, produksi dimulai
              </p>
              <p>
                <span className="font-semibold">Tahap 2</span> - Ditagih setelah
                foto progres rakitan dikirim
              </p>
              <p>
                <span className="font-semibold">Tahap 3</span> - Ditagih setelah
                foto finishing dikirim
              </p>
              <p>
                <span className="font-semibold">Tahap 4</span> - Ditagih setelah
                produk siap kirim
              </p>
            </div>

            <p className="text-muted-foreground mt-4 text-xs leading-6">
              Nominal dan persentase tiap tahap akan tertera saat kamu
              melanjutkan ke checkout. Kamu akan selalu dapat notifikasi beserta
              foto bukti progres sebelum tagihan berikutnya muncul.
            </p>
          </CollapsibleContent>
        </Collapsible>

        <Button
          className="w-full gap-2 font-semibold"
          size="lg"
          onClick={onProceedCheckout}
          disabled={isProceedingCheckout}
        >
          {isProceedingCheckout ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Menyiapkan checkout...
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
            <span>Opsi fulfillment mengikuti alamat yang dipilih</span>
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
  );
}
