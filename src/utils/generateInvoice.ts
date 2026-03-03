/**
 * generateInvoicePdf.ts
 *
 * Generates a professional PDF invoice from order data.
 * Requires: npm install jspdf
 */

import jsPDF from "jspdf";

// ─── Minimal shape we need from the order ────────────────────────────────────

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
  deliveryType: string;
  trackNumber?: string | null;
  totalWeight?: number | string | null;
  deliveryDistance?: number | string | null;
  deliveryDistancce?: number | string | null; // typo in original API
  subtotalPrice?: number | string | null;
  deliveryFee?: number | string | null;
  grandTotalPrice?: number | string | null;
  snapShotAddress?: InvoiceAddress | null;
  items: InvoiceItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Color palette ───────────────────────────────────────────────────────────

const C = {
  primary: [15, 23, 42] as [number, number, number], // slate-900
  accent: [99, 102, 241] as [number, number, number], // indigo-500
  accentLight: [224, 231, 255] as [number, number, number], // indigo-100
  muted: [100, 116, 139] as [number, number, number], // slate-500
  border: [226, 232, 240] as [number, number, number], // slate-200
  bg: [248, 250, 252] as [number, number, number], // slate-50
  white: [255, 255, 255] as [number, number, number],
  success: [22, 163, 74] as [number, number, number], // green-600
};

// ─── Core generator ──────────────────────────────────────────────────────────

export function generateInvoicePdf(order: InvoiceOrder): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const ML = 16; // margin left
  const MR = 16; // margin right
  const CW = PAGE_W - ML - MR; // content width

  let y = 0;

  // ── Helpers inside scope ──────────────────────────────────────────────────

  function rgb(c: [number, number, number]) {
    doc.setFillColor(c[0], c[1], c[2]);
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setTextColor(c[0], c[1], c[2]);
  }

  function text(
    str: string,
    x: number,
    yy: number,
    opts?: Parameters<jsPDF["text"]>[3],
  ) {
    doc.text(str, x, yy, opts);
  }

  function line(x1: number, y1: number, x2: number, y2: number) {
    doc.line(x1, y1, x2, y2);
  }

  function rect(
    x: number,
    yy: number,
    w: number,
    h: number,
    style: "F" | "S" | "FD" = "F",
  ) {
    doc.rect(x, yy, w, h, style);
  }

  function setFont(style: "normal" | "bold" | "italic" = "normal", size = 10) {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
  }

  // ── Header band ───────────────────────────────────────────────────────────

  // Full-width accent header
  doc.setFillColor(...C.primary);
  rect(0, 0, PAGE_W, 42);

  // Brand name
  doc.setTextColor(...C.white);
  setFont("bold", 20);
  text("INVOICE", ML, 18);

  // Tagline / company name – replace with your actual company
  setFont("normal", 9);
  doc.setTextColor(148, 163, 184); // slate-400
  text("Your Company Name  ·  your@email.com  ·  yourwebsite.com", ML, 26);

  // Order number & date – right aligned
  const orderNum = order.orderNumber?.trim() || order.id;
  doc.setTextColor(...C.white);
  setFont("bold", 11);
  text(`#${orderNum}`, PAGE_W - MR, 14, { align: "right" });

  setFont("normal", 8);
  doc.setTextColor(148, 163, 184);
  text(
    new Date(order.createdAt).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    PAGE_W - MR,
    21,
    { align: "right" },
  );

  // Status pill on header
  const statusColors: Record<string, [number, number, number]> = {
    IN_PRODUCTION: [234, 179, 8],
    READY_TO_SHIP: [59, 130, 246],
    SHIPPED: [59, 130, 246],
    COMPLETED: [34, 197, 94],
    CANCELLED: [239, 68, 68],
    PENDING_PAYMENT: [234, 179, 8],
  };
  const sColor = statusColors[order.status] ?? C.accent;
  const sLabel = order.status.replace(/_/g, " ");
  doc.setFillColor(...sColor);
  doc.roundedRect(PAGE_W - MR - 36, 27, 36, 9, 2, 2, "F");
  doc.setTextColor(...C.white);
  setFont("bold", 7);
  text(sLabel, PAGE_W - MR - 18, 33, { align: "center" });

  y = 50;

  // ── Two-column info block ─────────────────────────────────────────────────

  const colW = (CW - 6) / 2;

  // Left: Billing/Order info
  doc.setFillColor(...C.bg);
  rect(ML, y, colW, 36);
  doc.setTextColor(...C.muted);
  setFont("bold", 7);
  text("ORDER INFORMATION", ML + 4, y + 6);

  setFont("normal", 8.5);
  doc.setTextColor(...C.primary);
  const infoRows: [string, string][] = [
    ["Order ID", order.id.slice(0, 16) + "…"],
    ["Delivery", order.deliveryType],
    ["Track No.", order.trackNumber ?? "—"],
    ["Weight", `${num(order.totalWeight)} g`],
    [
      "Distance",
      `${num(order.deliveryDistance ?? order.deliveryDistancce)} km`,
    ],
  ];
  infoRows.forEach(([label, val], i) => {
    const rowY = y + 12 + i * 5;
    doc.setTextColor(...C.muted);
    setFont("normal", 7.5);
    text(label, ML + 4, rowY);
    doc.setTextColor(...C.primary);
    setFont("bold", 7.5);
    text(val, ML + colW - 4, rowY, { align: "right" });
  });

  // Right: Address (if delivery)
  if (order.deliveryType === "DELIVERY" && order.snapShotAddress) {
    const addr = order.snapShotAddress;
    const rx = ML + colW + 6;

    doc.setFillColor(...C.accentLight);
    rect(rx, y, colW, 36);

    doc.setTextColor(...C.accent);
    setFont("bold", 7);
    text("DELIVERY ADDRESS", rx + 4, y + 6);

    doc.setTextColor(...C.primary);
    setFont("bold", 8);
    text(addr.recipientName ?? "—", rx + 4, y + 13);

    setFont("normal", 7.5);
    doc.setTextColor(...C.muted);

    const addrLines = [
      addr.phoneNumber,
      addr.line1,
      addr.line2,
      [addr.subdistrict, addr.district, addr.city].filter(Boolean).join(", "),
      [addr.province, addr.country, addr.postalCode].filter(Boolean).join(" "),
    ].filter(Boolean) as string[];

    addrLines.slice(0, 4).forEach((l, i) => {
      text(l, rx + 4, y + 19 + i * 4.8);
    });
  }

  y += 44;

  // ── Items table ───────────────────────────────────────────────────────────

  // Table header
  doc.setFillColor(...C.primary);
  rect(ML, y, CW, 8);
  doc.setTextColor(...C.white);
  setFont("bold", 8);
  text("ITEM", ML + 3, y + 5.5);
  text("PRODUCT ID", ML + 60, y + 5.5);
  text("MATERIAL", ML + 105, y + 5.5);
  text("AMOUNT", PAGE_W - MR - 2, y + 5.5, { align: "right" });

  y += 8;

  order.items.forEach((item, idx) => {
    const rowH =
      9 + (item.components.length > 0 ? item.components.length * 4.5 + 6 : 0);

    // Alternating row bg
    doc.setFillColor(idx % 2 === 0 ? 248 : 241, idx % 2 === 0 ? 250 : 245, 252);
    rect(ML, y, CW, rowH);

    // Left border accent
    doc.setFillColor(...C.accent);
    rect(ML, y, 2, rowH);

    setFont("bold", 8);
    doc.setTextColor(...C.primary);
    text(`Item ${idx + 1}`, ML + 5, y + 6);

    setFont("normal", 7.5);
    doc.setTextColor(...C.muted);
    text(item.productBaseId, ML + 60, y + 6);
    text(item.materialId ?? "—", ML + 105, y + 6);

    setFont("bold", 8.5);
    doc.setTextColor(...C.primary);
    text(fmt(item.itemTotalPrice), PAGE_W - MR - 2, y + 6, { align: "right" });

    // Sub-prices
    setFont("normal", 7);
    doc.setTextColor(...C.muted);
    text(
      `Base: ${fmt(item.lockedBasePrice)}  ·  Material: ${fmt(item.lockedMaterialPrice)}`,
      ML + 5,
      y + 11,
    );

    // Components
    if (item.components.length > 0) {
      let cy = y + 16;
      doc.setTextColor(...C.accent);
      setFont("bold", 6.5);
      text("COMPONENTS", ML + 5, cy);
      cy += 4;

      item.components.forEach((comp) => {
        doc.setTextColor(...C.muted);
        setFont("normal", 7);
        text(`${comp.componentId} ×${comp.quantity}`, ML + 8, cy);
        text(fmt(comp.lockedSubTotal), PAGE_W - MR - 2, cy, { align: "right" });
        cy += 4.5;
      });
    }

    // Row bottom border
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    line(ML, y + rowH, ML + CW, y + rowH);

    y += rowH;
  });

  y += 6;

  // ── Totals block ──────────────────────────────────────────────────────────

  const totalsW = 72;
  const tx = PAGE_W - MR - totalsW;

  const totals: [string, string, boolean][] = [
    ["Subtotal", fmt(num(order.subtotalPrice)), false],
    ["Delivery Fee", fmt(num(order.deliveryFee)), false],
  ];

  doc.setFillColor(...C.bg);
  rect(tx, y, totalsW, 8 * totals.length + 14);

  totals.forEach(([label, value], i) => {
    const rowY = y + 6 + i * 8;
    doc.setTextColor(...C.muted);
    setFont("normal", 8);
    text(label, tx + 4, rowY);
    doc.setTextColor(...C.primary);
    setFont("normal", 8);
    text(value, tx + totalsW - 4, rowY, { align: "right" });
  });

  // Grand total
  const gtY = y + 6 + totals.length * 8;
  doc.setFillColor(...C.primary);
  rect(tx, gtY, totalsW, 12);
  doc.setTextColor(...C.white);
  setFont("bold", 9);
  text("GRAND TOTAL", tx + 4, gtY + 8);
  setFont("bold", 10);
  text(fmt(num(order.grandTotalPrice)), tx + totalsW - 4, gtY + 8, {
    align: "right",
  });

  y = Math.max(y + 8 * totals.length + 32, y + 40);

  // ── Footer ────────────────────────────────────────────────────────────────

  doc.setFillColor(...C.primary);
  rect(0, PAGE_H - 18, PAGE_W, 18);
  doc.setTextColor(148, 163, 184);
  setFont("normal", 7.5);
  text(
    "Thank you for your order! For inquiries, contact support@yourcompany.com",
    PAGE_W / 2,
    PAGE_H - 10,
    { align: "center" },
  );
  setFont("normal", 6.5);
  text(
    `Generated ${new Date().toLocaleString("en-US")}  ·  Order ${orderNum}`,
    PAGE_W / 2,
    PAGE_H - 5,
    { align: "center" },
  );

  return doc;
}

// ─── Download helper ─────────────────────────────────────────────────────────

export function downloadOrderInvoice(order: InvoiceOrder): void {
  const doc = generateInvoicePdf(order);
  const orderNum = order.orderNumber?.trim() || order.id;
  doc.save(`invoice-${orderNum}.pdf`);
}
