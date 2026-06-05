"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Clock3,
  FileText,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/features/dashboard/products/components/ImageUpload";
import useGetAdminOrder from "@/hooks/api/order/useGetAdminOrder";
import useCreateProductionProgress from "@/hooks/api/production/useCreateProductionProgress";
import useGetProductionProgress from "@/hooks/api/production/useGetProductionProgress";
import { UploadedProductImage } from "@/types/product";
import {
  PAYMENT_PHASES,
  PaymentPhase,
  PaymentPhaseStepper,
} from "./PaymentPhaseStepper";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ProductionLog = {
  id: string;
  percentage: number;
  notes: string;
  timestamp: string;
  images: number;
};

type AdminOrderProcessPageTrialProps = {
  orderId?: string;
  orderNumber?: string;
};

const processLoadingStates = [
  { text: "Memuat detail pesanan" },
  { text: "Memeriksa fase pembayaran" },
  { text: "Mengambil riwayat produksi" },
  { text: "Memvalidasi izin unggah foto" },
  { text: "Menyiapkan formulir progres" },
];

export default function AdminOrderProcessPage({
  orderId,
  orderNumber,
}: AdminOrderProcessPageTrialProps) {
  const router = useRouter();
  const safeOrderId = orderId?.trim() ?? "";
  const { data: order, isLoading: isOrderLoading } = useGetAdminOrder(
    safeOrderId || undefined,
  );

  const [uploadedImageItems, setUploadedImageItems] = useState<
    UploadedProductImage[]
  >([]);
  const [progressValue, setProgressValue] = useState([0]);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const {
    data: productionProgress = [],
    isLoading: isProductionProgressLoading,
  } = useGetProductionProgress(safeOrderId || undefined);
  const { mutateAsync: createProgress, isPending: submitting } =
    useCreateProductionProgress();

  const paymentPhase = useMemo<PaymentPhase | undefined>(() => {
    const rawPhase = order?.currentPaymentPhase;
    if (rawPhase && PAYMENT_PHASES.includes(rawPhase as PaymentPhase)) {
      return rawPhase as PaymentPhase;
    }
    return undefined;
  }, [order?.currentPaymentPhase]);

  const productionLogs: ProductionLog[] = useMemo(
    () =>
      [...productionProgress]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map((progress) => ({
          id: progress.id,
          percentage: progress.percentage,
          notes: progress.description || "-",
          timestamp: new Date(progress.createdAt).toLocaleString("id-ID"),
          images: progress.photoUrls.length,
        })),
    [productionProgress],
  );
  const latestProgressFloor = useMemo(
    () =>
      productionProgress.length === 0
        ? 0
        : productionProgress.reduce(
            (maxValue, item) => Math.max(maxValue, item.percentage),
            0,
          ),
    [productionProgress],
  );

  const statusText = useMemo(() => {
    const percentage = progressValue[0] ?? 0;
    if (percentage < 33) return "Tahap Awal";
    if (percentage < 66) return "Setengah Jalan";
    return "Hampir Selesai";
  }, [progressValue]);

  useEffect(() => {
    return () => {
      uploadedImageItems.forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [uploadedImageItems]);

  useEffect(() => {
    setProgressValue((prev) => {
      const current = prev[0] ?? 0;
      if (current >= latestProgressFloor) return prev;
      return [latestProgressFloor];
    });
  }, [latestProgressFloor]);

  const handleSubmitProgress = async () => {
    const percentage = progressValue[0] ?? 0;
    if (!safeOrderId) {
      toast.error("Invalid order id");
      return;
    }
    if (uploadedImageItems.length === 0) {
      toast.error("Please upload at least one photo");
      return;
    }

    try {
      await createProgress({
        orderId: safeOrderId,
        percentage,
        imageFiles: uploadedImageItems.map((item) => item.file),
        description: notes.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
      setUploadedImageItems([]);
      setNotes("");
      toast.success("Progress submitted");
      setTimeout(() => {
        router.push("/dashboard/admin/orders");
      }, 800);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to submit progress";
      toast.error(message);
    }
  };

  const percentage = progressValue[0] ?? 0;
  const canSubmitProgress = order?.currentPaymentStatus === "PAID";
  const showLoader = submitting;
  const orderRef =
    order?.orderNumber?.trim() || orderNumber || safeOrderId || "ORD-12345";
  const nowLabel = new Date().toLocaleString("id-ID");

  return (
    <section className="mx-auto w-full space-y-6">
      <MultiStepLoader
        loadingStates={processLoadingStates}
        loading={showLoader}
        duration={1500}
        loop={true}
      />

      <header className="space-y-4">
        <div className="bg-primary/4 relative overflow-hidden rounded-2xl border shadow-sm">
          <div className="from-primary/60 via-primary to-primary/60 absolute inset-x-0 top-0 h-1 bg-linear-to-r" />

          <div className="px-6 pt-6 pb-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => router.push("/dashboard/admin/orders")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                      Order Number
                    </p>
                    <h1 className="text-xl leading-tight font-bold tracking-tight">
                      {orderRef}
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
                    <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                    Process Mode
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Clock3 className="h-3.5 w-3.5" />
                    {nowLabel}
                  </span>
                </div>
              </div>

              <Button
                size="default"
                className="gap-2 self-start rounded-xl font-semibold shadow-sm"
                onClick={() =>
                  orderId
                    ? router.push(`/dashboard/admin/orders/${orderId}`)
                    : router.push("/dashboard/admin/orders")
                }
              >
                View Detail
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card space-y-4 rounded-xl border px-4 pt-4 pb-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Payment Progress</p>
            <Badge variant="outline">{paymentPhase ?? "-"}</Badge>
          </div>
          {!canSubmitProgress && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <Clock3 className="h-4 w-4" />
              <AlertTitle>Payment not settled</AlertTitle>
              <AlertDescription>
                Progress cannot be submitted until current payment status is{" "}
                <strong>PAID</strong>
              </AlertDescription>
            </Alert>
          )}
          <PaymentPhaseStepper paymentPhase={paymentPhase} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="py-4">
          <CardHeader>
            <CardTitle className="text-base">Input Progres Harian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs uppercase">
                <Camera className="mr-2 inline h-3.5 w-3.5" />
                Upload Foto
              </Label>

              <ImageUpload
                onImagesChange={setUploadedImageItems}
                images={uploadedImageItems}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs uppercase">Persentase Progress</Label>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">
                    Progress Saat Ini
                  </p>
                  <p className="text-3xl font-bold">{percentage}%</p>
                </div>
                <Badge variant="outline">{statusText}</Badge>
              </div>
              <Progress value={percentage} />
              <Slider
                value={progressValue}
                min={latestProgressFloor}
                max={100}
                step={1}
                onValueChange={(value) =>
                  setProgressValue([
                    Math.max(latestProgressFloor, value[0] ?? 0),
                  ])
                }
                className="**:data-[slot=slider-thumb]:border-primary **:data-[slot=slider-thumb]:bg-background **:data-[slot=slider-thumb]:size-5 **:data-[slot=slider-track]:h-2"
              />
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant={percentage === val ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setProgressValue([Math.max(latestProgressFloor, val)])
                    }
                    disabled={val < latestProgressFloor}
                  >
                    {val}%
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase">
                <FileText className="mr-2 inline h-3.5 w-3.5" />
                Catatan Produksi
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Deskripsi progress produksi hari ini..."
                rows={4}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmitProgress}
              disabled={submitting || !canSubmitProgress}
            >
              {submitting ? (
                "Menyimpan..."
              ) : submitted ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Progress Tersimpan!
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Progress
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Riwayat Log</CardTitle>
            <Badge variant="outline">{productionLogs.length} entri</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {isProductionProgressLoading ? (
              <p className="text-muted-foreground text-sm">Loading logs...</p>
            ) : productionLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No production logs yet.
              </p>
            ) : (
              productionLogs.map((log) => (
                <div key={log.id} className="bg-muted/30 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline">{log.percentage}%</Badge>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm">{log.notes}</p>
                      <div className="text-muted-foreground flex items-center gap-4 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.timestamp}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          {log.images} foto
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
