"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SheetContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue>({
  open: false,
  onOpenChange: () => {},
})

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Sheet({ open = false, onOpenChange = () => {}, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onOpenChange } = React.useContext(SheetContext)
  return (
    <button
      ref={ref}
      onClick={(e) => {
        onOpenChange(true)
        onClick?.(e)
      }}
      {...props}
    />
  )
})
SheetTrigger.displayName = "SheetTrigger"

const SheetOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(SheetContext)
  if (!open) return null
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out",
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  )
})
SheetOverlay.displayName = "SheetOverlay"

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right"
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = "right", children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(SheetContext)
    if (!open) return null
    return (
      <>
        <SheetOverlay />
        <div
          ref={ref}
          className={cn(
            "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-transform",
            side === "right" &&
              "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
            side === "left" &&
              "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
            side === "top" && "inset-x-0 top-0 border-b",
            side === "bottom" && "inset-x-0 bottom-0 border-t",
            className
          )}
          {...props}
        >
          {children}
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => onOpenChange(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
      </>
    )
  }
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetOverlay,
}
