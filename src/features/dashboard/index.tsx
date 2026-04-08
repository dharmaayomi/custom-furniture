"use client";

import useGetSavedDesign from "@/hooks/api/design/useGetSavedDesign";
import useGetOrders from "@/hooks/api/order/useGetOrders";
import useGetUserPayments from "@/hooks/api/payment/useGetUserPayments";
import useGetUserAddresses from "@/hooks/api/user/useGetUserAddresses";
import { useUser } from "@/providers/UserProvider";
import {
  CreditCard,
  LayoutDashboard,
  MapPin,
  PackageCheck,
  Palette,
} from "lucide-react";
import { useMemo } from "react";
import { SummaryStatCard } from "./orders/components/SummaryStatCard";

export default function UserDashboardPage() {
  const { navUser, userId } = useUser();
  const displayName = navUser?.userName?.trim() || "User";
  const currentIndonesiaDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
  const { data: orders = [] } = useGetOrders();
  const { data: payments = [] } = useGetUserPayments(userId);
  const { data: addressesData } = useGetUserAddresses(userId);
  const { data: designsData } = useGetSavedDesign(userId, {
    page: 1,
    perPage: 1,
    sortBy: "createdAt",
    orderBy: "desc",
  });

  const addressesPayload = (addressesData as { data?: unknown })?.data ?? addressesData;
  const addressCount = Array.isArray(addressesPayload)
    ? addressesPayload.length
    : 0;
  const designCount = designsData?.meta?.total ?? designsData?.data?.length ?? 0;

  const pendingPaymentCount = useMemo(
    () =>
      payments.filter((payment) =>
        ["WAITING_FOR_PAYMENT", "CHALLENGE", "EXPIRED"].includes(payment.status),
      ).length,
    [payments],
  );
  const activeOrderCount = useMemo(
    () =>
      orders.filter((order) =>
        [
          "AWAITING_PRODUCTION",
          "IN_PRODUCTION",
          "READY_TO_SHIP",
          "SHIPPED",
        ].includes(order.status),
      ).length,
    [orders],
  );

  return (
    <div>
      <header
        className="bg-card border-accent relative mt-2 rounded-2xl border px-6 shadow-lg/5 sm:px-10"
        style={{ paddingTop: "2rem", paddingBottom: "0" }}
      >
        <div className="relative z-10 flex items-end justify-between gap-4 pb-6">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="bg-primary/10 rounded-lg p-2">
                <LayoutDashboard className="text-primary h-5 w-5" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Selamat datang kembali{" "}
                <span className="text-primary capitalize">{displayName}</span>
              </h1>
            </div>
            <p className="text-muted-foreground max-w-md text-sm">
              {currentIndonesiaDate} - berikut ringkasan aktivitas akun kamu
            </p>
          </div>

          <img
            src="greet-user.png"
            alt="greet-user"
            className="absolute right-8 -bottom-1 z-20 hidden h-35 w-auto object-contain drop-shadow-lg sm:block dark:brightness-0 dark:invert"
          />
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStatCard
          title="Pembayaran Aktif"
          value={pendingPaymentCount}
          helperText="Tagihan yang masih menunggu aksi"
          icon={<CreditCard className="text-primary" />}
        />
        <SummaryStatCard
          title="Pesanan Berjalan"
          value={activeOrderCount}
          helperText="Pesanan yang sedang diproses atau dikirim"
          icon={<PackageCheck className="text-primary" />}
        />
        <SummaryStatCard
          title="Desain Tersimpan"
          value={designCount}
          helperText="Konsep ruangan yang sudah kamu simpan"
          icon={<Palette className="text-primary" />}
        />
        <SummaryStatCard
          title="Alamat Tersimpan"
          value={addressCount}
          helperText="Alamat siap pakai untuk checkout berikutnya"
          icon={<MapPin className="text-primary" />}
        />
      </div>
    </div>
  );
}
