export default function PdfEditorLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212] animate-pulse">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 bg-[#1E1E1E] rounded-xl mx-auto" />
        <div className="h-4 w-40 bg-[#1E1E1E] rounded mx-auto" />
        <div className="h-3 w-28 bg-[#1E1E1E] rounded mx-auto" />
      </div>
    </div>
  );
}
