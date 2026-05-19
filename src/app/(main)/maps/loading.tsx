export default function MapsLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)] animate-pulse">
      {/* Sidebar skeleton */}
      <div className="w-80 bg-[#1E1E1E] border-r border-gray-800 p-4 space-y-3 shrink-0">
        <div className="h-10 bg-[#2a2a2a] rounded-lg" />
        <div className="h-8 bg-[#2a2a2a] rounded w-3/4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-[#2a2a2a] rounded-lg" />
        ))}
      </div>
      {/* Map skeleton */}
      <div className="flex-1 bg-[#2a2a2a] flex items-center justify-center">
        <div className="text-gray-600 text-sm">Chargement de la carte…</div>
      </div>
    </div>
  );
}
