import { OrdersPage } from "@/features/dashboard/orders";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/dashboard-access";
import { Role } from "@/types/user";
import { redirect } from "next/navigation";

const Orders = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?reason=login_required");
  }
  const role = normalizeRole(session.user.role);

  if (role === Role.ADMIN) {
    redirect("/dashboard/admin/orders");
  }
  return (
    <div>
      <OrdersPage />
    </div>
  );
};

export default Orders;
