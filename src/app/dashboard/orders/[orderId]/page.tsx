import { OrderDetailPage } from "@/features/dashboard/orders/detail";

type OrderDetailRouteProps = {
  params: Promise<{ orderId: string }>;
};

const OrderDetailRoute = async ({ params }: OrderDetailRouteProps) => {
  const { orderId } = await params;

  return <OrderDetailPage orderId={orderId} />;
};

export default OrderDetailRoute;

