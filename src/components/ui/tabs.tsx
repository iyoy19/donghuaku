import * as React from "react"
import { cn } from "@/utils/cn"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

const Tabs = ({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = ({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsTrigger must be used within Tabs")

  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        context.value === value
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}

const TabsContent = ({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsContent must be used within Tabs")

  if (context.value !== value) return null

  return <div className={cn("mt-2", className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

