import { Skeleton } from './Skeleton'

export function CharacterDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-10 w-40 mb-6" />
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-80 lg:w-96 bg-gray-900 p-6 flex flex-col items-center">
            <Skeleton className="w-64 h-64 rounded-xl" />
            <Skeleton className="h-8 w-48 mt-6" />
            <Skeleton className="h-4 w-24 mt-2" />
            <Skeleton className="h-12 w-full mt-6" />
          </div>
          <div className="flex-1 p-6 md:p-8 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
