import { BillingTest } from "@/features/dashboard/billing/BillingTest";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/dashboard-access";
import { redirect } from "next/navigation";

const BillingTestPage = async () => {
  const session = await auth();
  if (!session) {
    redirect("/login?reason=login_required");
  }

  const role = normalizeRole(session.user.role);
  if (role !== "USER") {
    redirect("/dashboard");
  }

  return (
    <div>
      <BillingTest />
    </div>
  );
};

export default BillingTestPage;

