import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--accent))] text-white rounded-full px-6 font-display font-medium tracking-tight shadow-lifted transition-all duration-400 ease-snap hover:shadow-ambient active:scale-[0.98] active:shadow-pressed",
        destructive:
          "bg-[hsl(var(--danger))] text-white rounded-full shadow-lifted hover:bg-[hsl(var(--danger))]/90 active:scale-[0.98]",
        outline:
          "border border-[hsl(var(--border-strong))] bg-transparent rounded-full text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--accent-ghost))] hover:text-[hsl(var(--accent))] transition-all duration-400 ease-snap",
        secondary:
          "bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))] rounded-full hover:bg-[hsl(var(--accent-ghost))] transition-all duration-400 ease-snap active:scale-[0.98]",
        ghost:
          "text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bezel-outer-bg))] rounded-lg transition-all duration-400 ease-snap",
        link: "text-primary underline-offset-4 hover:underline transition-colors duration-400 ease-snap",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
