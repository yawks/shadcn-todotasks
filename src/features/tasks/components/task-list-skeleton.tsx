import { Skeleton } from '@/components/ui/skeleton'

export function TaskListSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 rounded-md border p-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
