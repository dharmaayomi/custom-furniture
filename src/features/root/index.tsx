"use Client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export const HomePage = () => {
  return (
    <div>
      <Link href="/custom">
        <Button>Custom ur Interior</Button>
      </Link>
    </div>
  );
};
