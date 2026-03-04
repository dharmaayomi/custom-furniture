import { RevenuePage } from "@/features/revenue";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/dashboard-access";
import { redirect } from "next/navigation";

const Revenue = async () => {
  const session = await auth();
  if (!session) {
    redirect("/login?reason=login_required");
  }

  const role = normalizeRole(session.user.role);
  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div>
      <RevenuePage />
    </div>
  );
};

export default Revenue;
