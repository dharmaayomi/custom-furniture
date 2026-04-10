import UserDashboardPage from "@/features/dashboard";
import { auth } from "@/lib/auth";
import { normalizeRole } from "@/lib/dashboard-access";
import { Role } from "@/types/user";
import { redirect } from "next/navigation";

const Dashboard = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?reason=login_required");
  }

  const role = normalizeRole(session.user.role);

  if (role === Role.ADMIN) {
    redirect("/dashboard/admin");
  }
  return (
    <div>
      <UserDashboardPage />
    </div>
  );
};

export default Dashboard;
