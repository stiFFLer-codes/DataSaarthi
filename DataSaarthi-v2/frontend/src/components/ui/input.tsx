import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 h-9 w-full min-w-0 border px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "rounded-xl bg-[hsl(var(--elevated))] border-[hsl(var(--border-hairline))] font-body text-sm placeholder:text-[hsl(var(--text-ghost))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]/20 focus-visible:border-[hsl(var(--accent))]/50 transition-all duration-400 ease-snap",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
