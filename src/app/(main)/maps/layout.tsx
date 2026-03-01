export default function MapsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 top-16 overflow-hidden">
      {children}
    </div>
  );
}
