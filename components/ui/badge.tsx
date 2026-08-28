import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary shadow-[0_1px_3px_hsl(var(--neo-shadow-dark)/0.15)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_1px_3px_hsl(var(--neo-shadow-dark)/0.1)]",
        destructive:
          "bg-destructive/10 text-destructive shadow-[0_1px_3px_hsl(var(--neo-shadow-dark)/0.15)]",
        outline:
          "bg-background text-foreground border border-border/60",
        success:
          "bg-emerald-500/10 text-emerald-700 shadow-[0_1px_3px_hsl(var(--neo-shadow-dark)/0.12)]",
        warning:
          "bg-amber-500/10 text-amber-700 shadow-[0_1px_3px_hsl(var(--neo-shadow-dark)/0.12)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
