import AdminOrderProcessPage from "@/features/dashboard/orders/admin/trialprocess";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/dashboard-access";
import { redirect } from "next/navigation";

type DeliverOrderRouteProps = {
  params: Promise<{ orderid: string }>;
};

const DeliverOrderRoute = async ({ params }: DeliverOrderRouteProps) => {
  const session = await auth();
  if (!session) {
    redirect("/login?reason=login_required");
  }

  const role = normalizeRole(session.user.role);
  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { orderid } = await params;

  return <div>halo</div>;
};

export default DeliverOrderRoute;
