import { HomePage } from "@/features/root";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="container mx-auto">
        <div className="text-center">
          <HomePage />
        </div>
      </main>
    </div>
  );
}
