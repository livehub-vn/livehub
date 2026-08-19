"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore, type ReactNode } from "react";

function useIsMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function ThemeToggle(): ReactNode {
  const mounted = useIsMounted();
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = (): void => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <button
        className="focus-ring border-border bg-background hover:bg-muted inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors"
        aria-label="Chuyển giao diện sáng hoặc tối"
        disabled
      >
        <span className="h-5 w-5" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="focus-ring border-border bg-background hover:bg-muted inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors"
      aria-label={
        isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
      }
      aria-pressed={isDark}
      type="button"
    >
      {isDark ? (
        <Sun className="text-foreground h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="text-foreground h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}

export function ThemeToggleWithLabel(): ReactNode {
  const mounted = useIsMounted();
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = (): void => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <button
        className="focus-ring hover:bg-muted inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        disabled
      >
        <span className="h-4 w-4" />
        <span>Giao diện</span>
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="focus-ring hover:bg-muted inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
      aria-label={
        isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
      }
      type="button"
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4" aria-hidden="true" />
          <span>Sáng</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" aria-hidden="true" />
          <span>Tối</span>
        </>
      )}
    </button>
  );
}
