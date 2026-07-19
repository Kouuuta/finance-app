"use client";

import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function ConfirmingPage() {
  const router = useRouter();

  return (
    <LoadingScreen
      word="Vault"
      tagline="Your account is ready"
      onComplete={() => {
        router.push("/");
        router.refresh();
      }}
    />
  );
}
