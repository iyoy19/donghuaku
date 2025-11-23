import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/utils/cn"

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  side?: "left" | "right" | "top" | "bottom"
}

const Sheet = ({ open, onOpenChange, children, side = "right" }: SheetProps) => {
  if (!open) return null

  const sideClasses = {
    left: "left-0 top-0 h-full",
    right: "right-0 top-0 h-full",
    top: "top-0 left-0 w-full",
    bottom: "bottom-0 left-0 w-full",
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed z-50 bg-background border shadow-lg transition-transform",
          sideClasses[side],
          side === "left" || side === "right" ? "w-[300px]" : "h-[300px]"
        )}
      >
        {children}
      </div>
    </>
  )
}

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left p-6", className)}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetClose = ({ onClose }: { onClose: () => void }) => (
  <button
    onClick={onClose}
    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </button>
)

export { Sheet, SheetHeader, SheetTitle, SheetClose }

