import jsPDF from "jspdf";

import {
  deliveryTypeUsesAddress,
  formatDeliveryDistance,
  getDeliveryTypeLabel,
} from "@/lib/deliveryType";
import { DeliveryType } from "@/types/customOrder";

interface InvoiceAddress {
  recipientName?: string | null;
  phoneNumber?: string | null;
  line1?: string | null;
  line2?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  postalCode?: string | null;
}

interface InvoiceComponent {
  id: string;
  componentId: string;
  quantity: number;
  lockedSubTotal: number;
}

interface InvoiceItem {
  id: string;
  productBaseId: string;
  materialId?: string | null;
  itemTotalPrice: number;
  lockedBasePrice: number;
  lockedMaterialPrice: number;
  components: InvoiceComponent[];
}

interface InvoiceOrder {
  id: string;
  orderNumber?: string | null;
  status: string;
  createdAt: string;
  deliveryType: DeliveryType;
  trackNumber?: string | null;
  totalWeight?: number | string | null;
  deliveryDistance?: number | string | null;
  deliveryDistancce?: number | string | null;
  subtotalPrice?: number | string | null;
  deliveryFee?: number | string | null;
  grandTotalPrice?: number | string | null;
  snapShotAddress?: InvoiceAddress | null;
  items: InvoiceItem[];
}

function fmt(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function num(v: number | string | null | undefined): number {
  return Number(v ?? 0);
}

const C = {
  black: [0, 0, 0] as [number, number, number],
  green: [0, 168, 107] as [number, number, number],
  greenLight: [220, 245, 235] as [number, number, number],
  yellow: [255, 204, 0] as [number, number, number],
  grey: [153, 153, 153] as [number, number, number],
  greyLight: [240, 240, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const STATUS_COLORS: Record<string, [number, number, number]> = {
  IN_PRODUCTION: C.yellow,
  READY_TO_SHIP: C.green,
  SHIPPED: C.green,
  COMPLETED: C.green,
  CANCELLED: [220, 38, 38],
  PENDING_PAYMENT: C.yellow,
};

const STATUS_TEXT_COLORS: Record<string, [number, number, number]> = {
  IN_PRODUCTION: C.black,
  READY_TO_SHIP: C.white,
  SHIPPED: C.white,
  COMPLETED: C.white,
  CANCELLED: C.white,
  PENDING_PAYMENT: C.black,
};

const loadImageAsPngDataUrl = (src: string): Promise<string | null> =>
  new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });

export async function generateInvoicePdf(order: InvoiceOrder): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const ML = 16;
  const MR = 16;
  const CW = PAGE_W - ML - MR;

  let y = 0;

  function text(str: string, x: number, yy: number, opts?: Parameters<jsPDF["text"]>[3]) {
    doc.text(str, x, yy, opts);
  }

  function line(x1: number, y1: number, x2: number, y2: number) {
    doc.setLineWidth(0.25);
    doc.line(x1, y1, x2, y2);
  }

  function rect(x: number, yy: number, w: number, h: number, style: "F" | "S" | "FD" = "F") {
    doc.rect(x, yy, w, h, style);
  }

  function setFont(style: "normal" | "bold" | "italic" = "normal", size = 10) {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
  }

  function setColor(fill: [number, number, number], textColor?: [number, number, number]) {
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(fill[0], fill[1], fill[2]);
    if (textColor) doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  }

  setColor(C.black);
  rect(0, 0, PAGE_W, 44);

  setColor(C.green);
  rect(0, 40, PAGE_W, 4);

  const logoDataUrl = await loadImageAsPngDataUrl("/logo.svg");
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", ML, 7.5, 52, 16);
  }

  doc.setTextColor(...C.white);
  setFont("bold", 22);
  text("INVOICE", logoDataUrl ? ML + 56 : ML, 18);

  setColor(C.yellow);
  rect(ML, 20, 32, 1.5);

  doc.setTextColor(...C.grey);
  setFont("normal", 8);
  text("PT BYTE BEYOND PERSONA | support@bbpersona.com | bbpersona.com", ML, 28);

  doc.setTextColor(...C.white);
  setFont("bold", 12);
  text(`#${order.orderNumber?.trim() || order.id}`, PAGE_W - MR, 14, { align: "right" });

  doc.setTextColor(...C.grey);
  setFont("normal", 8);
  text(
    new Date(order.createdAt).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    PAGE_W - MR,
    22,
    { align: "right" },
  );

  const sColor = STATUS_COLORS[order.status] ?? C.green;
  const sTextColor = STATUS_TEXT_COLORS[order.status] ?? C.white;
  const sLabel = order.status.replace(/_/g, " ");
  const pillW = 38;

  doc.setFillColor(...sColor);
  doc.roundedRect(PAGE_W - MR - pillW, 28, pillW, 8, 1.5, 1.5, "F");
  doc.setTextColor(...sTextColor);
  setFont("bold", 7);
  text(sLabel, PAGE_W - MR - pillW / 2, 33.5, { align: "center" });

  y = 52;

  const colW = (CW - 6) / 2;

  doc.setFillColor(...C.greyLight);
  rect(ML, y, colW, 38);
  doc.setFillColor(...C.green);
  rect(ML, y, colW, 2);

  doc.setTextColor(...C.green);
  setFont("bold", 7);
  text("ORDER INFORMATION", ML + 4, y + 9);

  const infoRows: [string, string][] = [
    ["Order ID", order.id.slice(0, 18) + "..."],
    ["Delivery", getDeliveryTypeLabel(order.deliveryType)],
    ["Track No.", order.trackNumber ?? "-"],
    ["Weight", `${num(order.totalWeight)} g`],
    [
      "Distance",
      formatDeliveryDistance(
        order.deliveryType,
        num(order.deliveryDistance ?? order.deliveryDistancce),
      ),
    ],
  ];

  infoRows.forEach(([label, val], i) => {
    const rowY = y + 15 + i * 5;
    doc.setTextColor(...C.grey);
    setFont("normal", 7.5);
    text(label, ML + 4, rowY);
    doc.setTextColor(...C.black);
    setFont("bold", 7.5);
    text(val, ML + colW - 4, rowY, { align: "right" });
  });

  if (deliveryTypeUsesAddress(order.deliveryType) && order.snapShotAddress) {
    const addr = order.snapShotAddress;
    const rx = ML + colW + 6;

    doc.setFillColor(...C.greenLight);
    rect(rx, y, colW, 38);
    doc.setFillColor(...C.green);
    rect(rx, y, colW, 2);

    doc.setTextColor(...C.green);
    setFont("bold", 7);
    text("SHIP TO", rx + 4, y + 9);

    doc.setTextColor(...C.black);
    setFont("bold", 8.5);
    text(addr.recipientName ?? "-", rx + 4, y + 16);

    doc.setTextColor(...C.grey);
    setFont("normal", 7.5);
    const addrLines = [
      addr.phoneNumber,
      addr.line1,
      addr.line2,
      [addr.subdistrict, addr.district, addr.city].filter(Boolean).join(", "),
      [addr.province, addr.country, addr.postalCode].filter(Boolean).join(" "),
    ].filter(Boolean) as string[];

    addrLines.slice(0, 4).forEach((l, i) => {
      text(l, rx + 4, y + 22 + i * 4.8);
    });
  }

  y += 46;

  doc.setFillColor(...C.black);
  rect(ML, y, CW, 8);

  doc.setTextColor(...C.yellow);
  setFont("bold", 7.5);
  text("ITEM", ML + 5, y + 5.5);
  text("PRODUCT ID", ML + 62, y + 5.5);
  text("MATERIAL", ML + 108, y + 5.5);
  doc.setTextColor(...C.white);
  text("AMOUNT", PAGE_W - MR - 2, y + 5.5, { align: "right" });

  y += 8;

  order.items.forEach((item, idx) => {
    const compCount = item.components.length;
    const rowH = 14 + (compCount > 0 ? compCount * 4.5 + 7 : 0);

    doc.setFillColor(...(idx % 2 === 0 ? C.white : C.greenLight));
    rect(ML, y, CW, rowH);

    doc.setFillColor(...(idx % 2 === 0 ? C.green : C.yellow));
    rect(ML, y, 2.5, rowH);

    doc.setTextColor(...C.grey);
    setFont("bold", 6.5);
    text(`ITEM ${idx + 1}`, ML + 5, y + 5.5);

    doc.setTextColor(...C.grey);
    setFont("normal", 7.5);
    text(item.productBaseId, ML + 62, y + 5.5);
    text(item.materialId ?? "-", ML + 108, y + 5.5);

    doc.setTextColor(...C.green);
    setFont("bold", 9);
    text(fmt(item.itemTotalPrice), PAGE_W - MR - 2, y + 5.5, { align: "right" });

    doc.setTextColor(...C.grey);
    setFont("normal", 7);
    text(
      `Base: ${fmt(item.lockedBasePrice)}  |  Material: ${fmt(item.lockedMaterialPrice)}`,
      ML + 5,
      y + 10.5,
    );

    if (compCount > 0) {
      let cy = y + 16;
      doc.setTextColor(...C.yellow);
      setFont("bold", 6.5);
      text("COMPONENTS", ML + 5, cy);

      doc.setDrawColor(...C.yellow);
      doc.setLineWidth(0.3);
      doc.line(ML + 5, cy + 1.5, ML + CW - 5, cy + 1.5);
      cy += 5;

      item.components.forEach((comp) => {
        doc.setTextColor(...C.grey);
        setFont("normal", 7);
        text(`${comp.componentId}  x${comp.quantity}`, ML + 8, cy);
        doc.setTextColor(...C.black);
        setFont("bold", 7);
        text(fmt(comp.lockedSubTotal), PAGE_W - MR - 2, cy, { align: "right" });
        cy += 4.5;
      });
    }

    doc.setDrawColor(...C.greyLight);
    doc.setLineWidth(0.2);
    line(ML + 2.5, y + rowH, ML + CW, y + rowH);

    y += rowH;
  });

  y += 8;

  const totalsW = 72;
  const tx = PAGE_W - MR - totalsW;

  const totals: [string, string][] = [
    ["Subtotal", fmt(num(order.subtotalPrice))],
    ["Delivery Fee", fmt(num(order.deliveryFee))],
  ];

  doc.setFillColor(...C.greyLight);
  rect(tx, y, totalsW, totals.length * 9 + 2);

  totals.forEach(([label, value], i) => {
    const rowY = y + 7 + i * 9;
    doc.setTextColor(...C.grey);
    setFont("normal", 8);
    text(label, tx + 4, rowY);
    doc.setTextColor(...C.black);
    setFont("bold", 8);
    text(value, tx + totalsW - 4, rowY, { align: "right" });
  });

  const gtY = y + totals.length * 9 + 2;
  doc.setFillColor(...C.green);
  rect(tx, gtY, totalsW, 13);

  doc.setTextColor(...C.white);
  setFont("bold", 8.5);
  text("GRAND TOTAL", tx + 4, gtY + 8.5);

  setFont("bold", 10);
  text(fmt(num(order.grandTotalPrice)), tx + totalsW - 4, gtY + 8.5, {
    align: "right",
  });

  doc.setFillColor(...C.yellow);
  rect(tx, gtY, totalsW, 1.5);

  y = Math.max(gtY + 30, y + 50);

  doc.setFillColor(...C.black);
  rect(0, PAGE_H - 20, PAGE_W, 20);

  doc.setFillColor(...C.green);
  rect(0, PAGE_H - 20, PAGE_W, 2);

  doc.setTextColor(...C.white);
  setFont("normal", 8);
  text(
    "Thank you for your order! For inquiries, contact support@bbpersona.com",
    PAGE_W / 2,
    PAGE_H - 12,
    { align: "center" },
  );

  doc.setTextColor(...C.grey);
  setFont("normal", 6.5);
  text(
    `Generated ${new Date().toLocaleString("en-US")}  |  Order ${order.orderNumber?.trim() || order.id}`,
    PAGE_W / 2,
    PAGE_H - 6,
    { align: "center" },
  );

  return doc;
}

export async function downloadOrderInvoice(order: InvoiceOrder): Promise<void> {
  const doc = await generateInvoicePdf(order);
  const orderNum = order.orderNumber?.trim() || order.id;
  doc.save(`invoice-${orderNum}.pdf`);
}
