// Adapted from Fluid Functionalism's registry button. See THIRD-PARTY-NOTICES.md.
import type { ComponentProps } from "react";
import { cn } from "@/lib";
import { buttonVariants, surfaceVariants } from "./button-variants";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: "primary" | "secondary" | "tertiary" | "ghost";
}

/** Fluid's layered press surface, with only the native-button API this example needs. */
export function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant }), className)} {...props}>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-px rounded-[inherit] transition-[box-shadow,background-color] [transition-duration:180ms,80ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1),ease] group-active:[transition-duration:80ms,80ms] motion-reduce:transition-none",
          surfaceVariants[variant],
        )}
      />
      <span className="relative inline-flex items-center justify-center gap-[inherit]">
        <span className="[text-box:trim-both_cap_alphabetic]">{children}</span>
      </span>
    </button>
  );
}
