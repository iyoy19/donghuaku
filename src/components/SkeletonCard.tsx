import { Skeleton } from "./ui/skeleton"

export function SkeletonCard() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

