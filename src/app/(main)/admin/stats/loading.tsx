export default function AdminStatsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#1E1E1E] rounded-xl h-24" />
        ))}
      </div>
      <div className="bg-[#1E1E1E] rounded-xl h-64" />
      <div className="bg-[#1E1E1E] rounded-xl h-48" />
    </div>
  );
}
