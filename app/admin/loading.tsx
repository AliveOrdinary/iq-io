export default function AdminLoading() {
  return (
    <div className="space-y-12">
      <header>
        <div className="h-9 w-64 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-4 w-96 bg-white/5 rounded mt-2 animate-pulse" />
      </header>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-16 bg-white/10 rounded mt-2 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-white/5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="px-6 py-4 flex gap-4">
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
