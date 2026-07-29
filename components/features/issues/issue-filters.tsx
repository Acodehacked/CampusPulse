"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/constants/issues";

const ALL = "all";

export function IssueFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== ALL) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      if (search !== (searchParams.get("q") ?? "")) {
        pushParams({ q: search || null });
      }
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center" aria-busy={isPending}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search issues..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search issues"
        />
      </div>

      <Select value={searchParams.get("status") ?? ALL} onValueChange={(v) => pushParams({ status: v })}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("category") ?? ALL} onValueChange={(v) => pushParams({ category: v })}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("priority") ?? ALL} onValueChange={(v) => pushParams({ priority: v })}>
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All priorities</SelectItem>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(searchParams.get("status") || searchParams.get("category") || searchParams.get("priority") || searchParams.get("q")) && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Clear
        </Button>
      )}
    </div>
  );
}
