import * as React from "react"
import { cn } from "@/utils/cn"

interface DropdownMenuProps {
  children: React.ReactNode
  trigger: React.ReactNode
  align?: "start" | "end" | "center"
}

const DropdownMenu = ({ children, trigger, align = "start" }: DropdownMenuProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">{trigger}</div>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className={cn(
            "absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            align === "end" && "right-0",
            align === "center" && "left-1/2 -translate-x-1/2"
          )}>
            {children}
          </div>
        </>
      )}
    </div>
  )
}

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

export { DropdownMenu, DropdownMenuItem }

