export default function MainLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4A017]" />
        <p className="text-gray-400 text-sm">Chargement…</p>
      </div>
    </div>
  );
}
