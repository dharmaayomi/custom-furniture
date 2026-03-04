import { AdminOrderDetailPage } from "@/features/dashboard/orders/admin/detail";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/dashboard-access";
import { redirect } from "next/navigation";

type AdminOrderDetailRouteProps = {
  params: Promise<{ orderid: string }>;
};

const AdminOrderDetailRoute = async ({ params }: AdminOrderDetailRouteProps) => {
  const session = await auth();
  if (!session) {
    redirect("/login?reason=login_required");
  }

  const role = normalizeRole(session.user.role);
  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { orderid } = await params;

  return <AdminOrderDetailPage orderId={orderid} />;
};

export default AdminOrderDetailRoute;
