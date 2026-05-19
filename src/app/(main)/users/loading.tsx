export default function UsersLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="flex gap-3 mb-6">
        <div className="bg-[#1E1E1E] rounded-lg h-10 flex-1" />
        <div className="bg-[#1E1E1E] rounded-lg h-10 w-36" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-[#1E1E1E] rounded-xl h-16 flex items-center px-4 gap-4">
          <div className="h-10 w-10 bg-[#2a2a2a] rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#2a2a2a] rounded w-1/3" />
            <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
          </div>
          <div className="h-7 w-20 bg-[#2a2a2a] rounded-full" />
        </div>
      ))}
    </div>
  );
}
