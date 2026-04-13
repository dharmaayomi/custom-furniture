import { PaymentInstructionMethod } from "@/lib/bankInstruction";
import { CustomOrderPayment } from "@/types/customOrder";

export type PaymentInstructionValue = {
  method: PaymentInstructionMethod;
  vaNumbers: Array<{ bank: string; va_number: string }>;
  permataVaNumber: string | null;
  qrString: string | null;
  billKey?: string | null;
  billerCode?: string | null;
};

export type ParsedPaymentReference = {
  va_numbers?: Array<{ va_number?: string; bank?: string }>;
  permata_va_number?: string;
  bill_key?: string;
  biller_code?: string;
  qr_string?: string;
};

export const parsePaymentReference = (value?: string | null) => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as ParsedPaymentReference;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

export const inferInstructionMethodFromPayment = (
  payment?: Pick<
    CustomOrderPayment,
    "paymentType" | "midtransPaymentType" | "midtransBank"
  > | null,
): PaymentInstructionMethod => {
  const bank = String(payment?.midtransBank ?? "").toLowerCase();
  if (bank === "bca") return "bca_va";
  if (bank === "bni") return "bni_va";
  if (bank === "bri") return "bri_va";
  if (bank === "permata") return "permata_va";
  if (bank === "cimb") return "cimb_va";
  if (bank === "mandiri") return "mandiri_bill";

  const midtransType = String(payment?.midtransPaymentType ?? "").toLowerCase();
  if (midtransType === "qris") return "qris";
  if (midtransType === "gopay") return "gopay";
  if (midtransType === "echannel") return "mandiri_bill";

  const paymentType = String(payment?.paymentType ?? "").toLowerCase();
  if (paymentType.includes("qris")) return "qris";
  if (paymentType.includes("gopay")) return "gopay";
  if (paymentType.includes("echannel")) return "mandiri_bill";

  return "qris";
};

export const buildInstructionFromPayment = (
  payment?: CustomOrderPayment | null,
): PaymentInstructionValue | null => {
  if (!payment) return null;

  const parsedReference = parsePaymentReference(payment.midtransReference);
  const vaNumbers = Array.isArray(parsedReference?.va_numbers)
    ? parsedReference.va_numbers
        .filter((item) => item?.va_number)
        .map((item) => ({
          bank: String(item.bank ?? payment.midtransBank ?? "bank"),
          va_number: String(item.va_number),
        }))
    : [];

  const next: PaymentInstructionValue = {
    method: inferInstructionMethodFromPayment(payment),
    vaNumbers,
    permataVaNumber: parsedReference?.permata_va_number ?? null,
    qrString: parsedReference?.qr_string ?? null,
    billKey: parsedReference?.bill_key ?? null,
    billerCode: parsedReference?.biller_code ?? null,
  };

  const hasInstruction =
    next.vaNumbers.length > 0 ||
    Boolean(next.permataVaNumber) ||
    Boolean(next.qrString) ||
    Boolean(next.billKey) ||
    Boolean(next.billerCode);

  return hasInstruction ? next : null;
};
