"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, LayoutDashboard, Search, ShieldCheck, AlertCircle } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { CurrentProfile } from "@/lib/auth/session";

export function CommandPalette({ profile }: { profile: CurrentProfile | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  if (!profile) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command shouldFilter={false}>
      <CommandInput placeholder="Type a command or search..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>
          {search.trim() ? (
            <button
              className="w-full px-2 py-1.5 text-left text-sm"
              onClick={() => go(`/issues?q=${encodeURIComponent(search.trim())}`)}
            >
              Search issues for &ldquo;{search.trim()}&rdquo;
            </button>
          ) : (
            "No results found."
          )}
        </CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("/issues/new")}>
            <FilePlus2 />
            Report an issue
          </CommandItem>
          <CommandItem onSelect={() => go(`/issues?q=${encodeURIComponent(search.trim())}`)}>
            <Search />
            Search issues
          </CommandItem>
          <CommandItem onSelect={() => go("/issues?status=reported")}>
            <AlertCircle />
            View unresolved issues
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard />
            Open dashboard
          </CommandItem>
          {profile.role === "admin" && (
            <CommandItem onSelect={() => go("/admin")}>
              <ShieldCheck />
              Open admin dashboard
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
