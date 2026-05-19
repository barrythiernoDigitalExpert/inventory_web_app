export default function PropertiesLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      {/* Search / header bar skeleton */}
      <div className="flex gap-3 mb-6">
        <div className="bg-[#1E1E1E] rounded-lg h-10 flex-1" />
        <div className="bg-[#1E1E1E] rounded-lg h-10 w-32" />
      </div>
      {/* Property cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-[#1E1E1E] rounded-xl overflow-hidden">
            <div className="h-40 bg-[#2a2a2a]" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
              <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
              <div className="h-3 bg-[#2a2a2a] rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
