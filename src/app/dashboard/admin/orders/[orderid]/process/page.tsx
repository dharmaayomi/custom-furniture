import { ProcessOrderPage } from "@/features/dashboard/orders/process";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/dashboard-access";
import { redirect } from "next/navigation";

type ProcessOrderRouteProps = {
  params: Promise<{ orderid: string }>;
};

const ProcessOrderRoute = async ({ params }: ProcessOrderRouteProps) => {
  const session = await auth();
  if (!session) {
    redirect("/login?reason=login_required");
  }

  const role = normalizeRole(session.user.role);
  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { orderid } = await params;

  return <ProcessOrderPage orderId={orderid} />;
};

export default ProcessOrderRoute;
