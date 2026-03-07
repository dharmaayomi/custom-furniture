import { BillingDetail } from "@/features/dashboard/billing/BillingDetail";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/dashboard-access";
import { redirect } from "next/navigation";

type BillingDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

const BillingDetailPage = async ({ params }: BillingDetailPageProps) => {
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
      <BillingDetail orderId={orderId} />
    </div>
  );
};

export default BillingDetailPage;
