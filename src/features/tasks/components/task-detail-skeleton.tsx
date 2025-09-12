import { Skeleton } from '@/components/ui/skeleton'

export function TaskDetailSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <Skeleton className="h-6 w-6 rounded-full mt-1" />
        <div className="flex-1">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
