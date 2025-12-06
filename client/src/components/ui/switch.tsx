import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Base styles - larger iOS-style toggle
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full",
      // Border and shadows
      "border-2 border-transparent shadow-inner",
      // Transitions
      "transition-all duration-300 ease-in-out",
      // Focus states
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Checked state - vibrant gradient
      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600 data-[state=checked]:shadow-blue-500/30 data-[state=checked]:shadow-md",
      // Unchecked state - subtle gray
      "data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Base styles - larger thumb
        "pointer-events-none block h-5 w-5 rounded-full",
        // White background with shadow
        "bg-white shadow-lg",
        // Subtle border for definition
        "ring-1 ring-black/5",
        // Smooth spring-like transition
        "transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        // Transform positions
        "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px]",
        // Active press effect
        "active:scale-95"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }

