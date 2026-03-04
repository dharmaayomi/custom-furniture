import { BillingTestDetail } from "@/features/dashboard/billing/BillingTestDetail";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/dashboard-access";
import { redirect } from "next/navigation";

type BillingTestDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

const BillingTestDetailPage = async ({ params }: BillingTestDetailPageProps) => {
  const session = await auth();
  if (!session) {
    redirect("/login?reason=login_required");
  }

  const role = normalizeRole(session.user.role);
  if (role !== "USER") {
    redirect("/dashboard");
  }

  const { orderId } = await params;

  return (
    <div>
      <BillingTestDetail orderId={orderId} />
    </div>
  );
};

export default BillingTestDetailPage;

