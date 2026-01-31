import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
}

// Transaction Item Skeleton
function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
      {/* Icon */}
      <Skeleton className="w-10 h-10 rounded-full" />
      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      {/* Amount */}
      <div className="text-right space-y-2">
        <Skeleton className="h-4 w-16 ml-auto" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
    </div>
  )
}

// Pocket Card Skeleton
function PocketCardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

// Stats Card Skeleton
function StatsCardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}

// Chart Skeleton
function ChartSkeleton() {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100">
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="flex items-end justify-between gap-2 h-32">
        {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <Skeleton key={i} className="h-3 w-4" />
        ))}
      </div>
    </div>
  )
}

// Goal Card Skeleton
function GoalCardSkeleton() {
  return (
    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-100 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}

// List Skeleton (multiple items)
function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TransactionSkeleton key={i} />
      ))}
    </div>
  )
}

function PocketListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <PocketCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Home Screen Skeleton
function HomeScreenSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Balance Card */}
      <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>

      {/* Daily Tracker */}
      <StatsCardSkeleton />

      {/* Pockets */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-20" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[140px]">
              <PocketCardSkeleton />
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <TransactionListSkeleton count={4} />
      </div>
    </div>
  )
}

export {
  Skeleton,
  TransactionSkeleton,
  PocketCardSkeleton,
  StatsCardSkeleton,
  ChartSkeleton,
  GoalCardSkeleton,
  TransactionListSkeleton,
  PocketListSkeleton,
  HomeScreenSkeleton
}
