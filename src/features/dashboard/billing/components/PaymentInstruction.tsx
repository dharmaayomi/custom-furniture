import { useMemo } from "react";
import {
  getInstructionChannels,
  PaymentInstructionMethod,
} from "@/lib/bankInstruction";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Copy,
  Download,
  ListOrdered,
  QrCode,
  Wallet,
} from "lucide-react";
import { useState } from "react";

export type PaymentInstructionValue = {
  method: PaymentInstructionMethod;
  vaNumbers: Array<{ bank: string; va_number: string }>;
  permataVaNumber: string | null;
  qrString: string | null;
  billKey?: string | null;
  billerCode?: string | null;
};

/* ── Copy button with "copied" feedback ─────────────────────── */
const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`h-8 w-8 shrink-0 rounded-lg p-0 transition-all duration-200 ${
        copied
          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
};

/* ── Reusable field row ─────────────────────────────────────── */
const FieldRow = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div
    className={`group flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-150 ${
      accent
        ? "border-primary/15 bg-primary/4 hover:border-primary/25 hover:bg-primary/[0.07] border"
        : "border-border/60 bg-muted/30 hover:border-border hover:bg-muted/60 border"
    }`}
  >
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground/70 mb-1 text-[10px] font-semibold tracking-widest uppercase">
        {label}
      </p>
      <p className="text-foreground truncate font-mono text-sm font-semibold tracking-wider">
        {value}
      </p>
    </div>
    <CopyButton value={value} />
  </div>
);

const downloadQrImage = async (imageUrl: string) => {
  if (!imageUrl) return;
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `qris-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(imageUrl, "_blank");
  }
};

/* ── Main component ─────────────────────────────────────────── */
export const PaymentInstruction = ({
  value,
}: {
  value: PaymentInstructionValue;
}) => {
  const channels = useMemo(
    () => getInstructionChannels(value.method),
    [value.method],
  );

  const qrImageUrl = value.qrString
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value.qrString)}`
    : "";

  const hasFields =
    value.vaNumbers.length > 0 ||
    value.permataVaNumber ||
    value.billerCode ||
    value.billKey;

  return (
    <div className="space-y-4 text-sm">
      {/* ── Section title ── */}
      <div className="flex items-center gap-2.5">
        <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
          <Wallet className="text-primary h-3.5 w-3.5" />
        </div>
        <p className="text-foreground text-sm font-semibold">
          Payment Instructions
        </p>
      </div>

      {/* ── QR Code ── */}
      {value.qrString ? (
        <div className="border-border/60 bg-card overflow-hidden rounded-2xl border shadow-sm">
          {/* QR header */}
          <div className="border-border/60 bg-muted/30 flex items-center justify-between gap-2 border-b px-4 py-2.5">
            <div className="flex items-center gap-2">
              <QrCode className="text-muted-foreground h-3.5 w-3.5" />
              <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                QRIS Code
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:bg-muted hover:text-foreground h-7 gap-1.5 rounded-lg px-2.5 text-[11px] font-medium"
              onClick={() => downloadQrImage(qrImageUrl)}
            >
              <Download className="h-3 w-3" />
              Download
            </Button>
          </div>

          {/* QR body */}
          <div className="flex flex-col items-center gap-3 py-7">
            <div className="rounded-xl bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <img
                src={qrImageUrl}
                alt="QRIS payment code"
                className="h-52 w-52 rounded-md object-contain"
              />
            </div>
            <p className="text-muted-foreground/70 text-[11px] font-medium">
              Scan with any QRIS-supported app
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Payment fields ── */}
      {hasFields ? (
        <div className="space-y-2">
          {value.vaNumbers.map((item) => (
            <FieldRow
              key={`${item.bank}-${item.va_number}`}
              label={`${item.bank.toUpperCase()} Virtual Account`}
              value={item.va_number}
              accent
            />
          ))}

          {value.permataVaNumber ? (
            <FieldRow
              label="Permata Virtual Account"
              value={value.permataVaNumber}
              accent
            />
          ) : null}

          {value.billerCode ? (
            <FieldRow label="Biller Code" value={value.billerCode} />
          ) : null}

          {value.billKey ? (
            <FieldRow label="Bill Key" value={value.billKey} />
          ) : null}
        </div>
      ) : null}

      {/* ── Step-by-step accordion ── */}
      {channels.length > 0 ? (
        <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
          {/* Header */}
          <div className="bg-muted/40 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-md">
                <ListOrdered className="text-primary h-4 w-4" />
              </div>
              <p className="text-foreground text-sm font-semibold">
                How to Pay
              </p>
            </div>

            <Badge
              variant="secondary"
              className="h-5 rounded-md px-2 text-[10px] font-semibold"
            >
              {channels.length} channel{channels.length > 1 ? "s" : ""}
            </Badge>
          </div>

          <Accordion
            type="single"
            collapsible
            defaultValue={channels[0]?.id}
            className="divide-y"
          >
            {channels.map((channel) => (
              <AccordionItem
                key={channel.id}
                value={channel.id}
                className="border-none"
              >
                <AccordionTrigger className="hover:bg-muted/40 px-4 py-4 text-sm font-medium transition [&>svg]:h-4 [&>svg]:w-4">
                  {channel.label}
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-5">
                  <ol className="space-y-3 pt-1">
                    {channel.steps.map((step, index) => (
                      <li
                        key={`${channel.id}-${index}`}
                        className="flex items-start gap-3"
                      >
                        <span className="bg-primary/15 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                          {index + 1}
                        </span>

                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : null}
    </div>
  );
};
