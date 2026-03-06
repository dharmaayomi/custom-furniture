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
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/features/dashboard/products/components/ImageUpload";
import { UploadedProductImage } from "@/types/product";
import {
  PAYMENT_PHASES,
  PaymentPhase,
  PaymentPhaseStepper,
} from "./PaymentPhaseStepper";
import { useRouter } from "next/navigation";

type ProductionLog = {
  id: number;
  percentage: number;
  notes: string;
  timestamp: string;
  images: number;
};

type AdminOrderProcessPageTrialProps = {
  orderId?: string;
  orderNumber?: string;
};

export default function AdminOrderProcessPageTrial({
  orderId,
  orderNumber,
}: AdminOrderProcessPageTrialProps) {
  const router = useRouter();
  const [uploadedImageItems, setUploadedImageItems] = useState<
    UploadedProductImage[]
  >([]);
  const [progressValue, setProgressValue] = useState([40]);
  const [notes, setNotes] = useState("Sedang proses amplas halus...");
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>("PROGRESS_1");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentPhaseIndex = PAYMENT_PHASES.indexOf(paymentPhase);
  const previousPhase = PAYMENT_PHASES[currentPhaseIndex - 1];
  const nextPhase = PAYMENT_PHASES[currentPhaseIndex + 1];

  const productionLogs: ProductionLog[] = [
    {
      id: 1,
      percentage: 40,
      notes: "Sedang proses amplas halus pada bagian kaki meja.",
      timestamp: "Hari ini, 10:42",
      images: 2,
    },
    {
      id: 2,
      percentage: 35,
      notes: "Rangka utama berhasil dirakit dengan presisi tinggi.",
      timestamp: "Kemarin, 15:20",
      images: 1,
    },
  ];

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

  const handleSubmitProgress = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    }, 1200);
  };

  const percentage = progressValue[0] ?? 0;
  const orderRef = orderNumber ?? "ORD-12345";
  const nowLabel = new Date().toLocaleString("id-ID");

  return (
    <section className="mx-auto w-full space-y-6">
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
            <Badge variant="outline">{paymentPhase}</Badge>
          </div>
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
                min={0}
                max={100}
                step={1}
                onValueChange={setProgressValue}
                className="**:data-[slot=slider-thumb]:border-primary **:data-[slot=slider-thumb]:bg-background **:data-[slot=slider-thumb]:size-5 **:data-[slot=slider-track]:h-2"
              />
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant={percentage === val ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProgressValue([val])}
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
              disabled={submitting}
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
            {productionLogs.map((log) => (
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
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
