"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type SliderProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="range"
        ref={ref}
        className={cn(
          "w-full h-2 cursor-pointer appearance-none rounded-full bg-primary/20 accent-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
