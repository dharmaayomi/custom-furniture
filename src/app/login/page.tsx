import { LoginPage } from "@/features/login/page";

type LoginRouteProps = {
  searchParams?: Promise<{
    reason?: string;
  }>;
};

const Login = async ({ searchParams }: LoginRouteProps) => {
  const params = await searchParams;
  const reason = params?.reason;

  return (
    <div>
      <LoginPage reason={reason} />
    </div>
  );
};

export default Login;
