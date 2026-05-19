export default function PropertyDetailLoading() {
  return (
    <div className="p-6 animate-pulse space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-8 w-8 bg-[#1E1E1E] rounded" />
        <div className="h-6 bg-[#1E1E1E] rounded w-48" />
      </div>
      {/* Property image + info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#1E1E1E] rounded-xl h-56" />
        <div className="lg:col-span-2 space-y-3">
          <div className="h-5 bg-[#1E1E1E] rounded w-2/3" />
          <div className="h-4 bg-[#1E1E1E] rounded w-1/2" />
          <div className="h-4 bg-[#1E1E1E] rounded w-3/4" />
          <div className="flex gap-2 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-[#1E1E1E] rounded-full" />
            ))}
          </div>
        </div>
      </div>
      {/* Rooms grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#1E1E1E] rounded-xl h-28" />
        ))}
      </div>
    </div>
  );
}
