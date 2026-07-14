export default function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-soft-accent border-t-vibrant-blue" />
        <p className="font-body text-sm text-on-surface-variant">Loading...</p>
      </div>
    </div>
  );
}
