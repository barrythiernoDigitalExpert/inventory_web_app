export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#1E1E1E] rounded-xl h-28" />
        ))}
      </div>
      {/* Recent properties skeleton */}
      <div className="bg-[#1E1E1E] rounded-xl h-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1E1E1E] rounded-xl h-48" />
        <div className="bg-[#1E1E1E] rounded-xl h-48" />
      </div>
    </div>
  );
}
