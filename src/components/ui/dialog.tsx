import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/utils/cn"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-md"
        onClick={handleBackdropClick}
      />
      <div 
        className="relative z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative bg-card border rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogClose = ({
  onClose,
}: {
  onClose: () => void
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }}
    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </button>
)

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose }

