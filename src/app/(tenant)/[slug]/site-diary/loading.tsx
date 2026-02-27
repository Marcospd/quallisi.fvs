import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from '@/components/page-skeleton'

export default function Loading() {
    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-40" />
            </div>
            <TableSkeleton rows={8} cols={5} />
        </div>
    )
}
