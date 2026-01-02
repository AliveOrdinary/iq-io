export default function EmployeeLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header skeleton */}
        <header className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-32 bg-white/5 rounded mt-2 animate-pulse" />
          </div>
        </header>

        {/* Main Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Clock widget skeleton */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex flex-col items-center gap-6">
              <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
              <div className="w-48 h-48 rounded-full border-8 border-white/10 animate-pulse" />
            </div>
          </div>
          
          {/* Activity log skeleton */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="h-6 w-32 bg-white/10 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
