import { BillingDetail } from "@/features/dashboard/billing/BillingDetail";
import { PaymentHistoryDetail } from "@/features/dashboard/billing/PaymentHistoryDetail";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/dashboard-access";
import { redirect } from "next/navigation";

type BillingDetailPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ paymentId?: string; attemptId?: string }>;
};

const BillingDetailPage = async ({
  params,
  searchParams,
}: BillingDetailPageProps) => {
  const session = await auth();
  if (!session) {
    redirect("/login?reason=login_required");
  }

  const role = normalizeRole(session.user.role);
  if (role !== "USER") {
    redirect("/dashboard");
  }

  const { orderId } = await params;
  const { paymentId, attemptId } = await searchParams;

  return (
    <div>
      {attemptId ? (
        <PaymentHistoryDetail
          orderId={orderId}
          paymentAttemptId={attemptId}
        />
      ) : (
        <BillingDetail
          orderId={orderId}
          paymentId={paymentId}
          paymentAttemptId={attemptId}
        />
      )}
    </div>
  );
};

export default BillingDetailPage;
