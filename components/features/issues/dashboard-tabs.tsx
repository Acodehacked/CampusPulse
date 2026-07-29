"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardTabs({ active }: { active: "reported" | "confirmed" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={active} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value="reported">Reported by me</TabsTrigger>
        <TabsTrigger value="confirmed">I&apos;m affected by</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
