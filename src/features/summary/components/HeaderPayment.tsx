import { ShoppingCart, User } from "lucide-react";

export const HeaderPayment = () => {
  return (
    <header className="mx-8 p-4">
      <div className="flex justify-between">
        <div className="flex gap-5">
          <User />
          <ShoppingCart />
        </div>
      </div>
    </header>
  );
};
