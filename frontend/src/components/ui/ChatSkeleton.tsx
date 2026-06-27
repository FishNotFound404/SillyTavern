import { Skeleton } from './Skeleton'

export function ChatSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-48" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 pr-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <div className="max-w-[80%] space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-20 w-96 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex gap-2 items-end">
          <Skeleton className="flex-1 h-12 rounded-lg" />
          <Skeleton className="h-12 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
