"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

const SelectTrigger = Select

const SelectValue = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => (
  <option
    ref={ref}
    value=""
    disabled
    hidden
    className={cn("text-muted-foreground", className)}
    {...props}
  >
    {placeholder}
  </option>
))
SelectValue.displayName = "SelectValue"

function SelectContent({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}
SelectContent.displayName = "SelectContent"

export type SelectItemProps = React.OptionHTMLAttributes<HTMLOptionElement>

const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, children, ...props }, ref) => (
    <option
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
        className
      )}
      {...props}
    >
      {children}
    </option>
  )
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
