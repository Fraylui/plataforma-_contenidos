export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="h-3 w-24 animate-pulse rounded bg-border" />
      <div className="mt-4 h-10 w-full animate-pulse rounded bg-border" />
      <div className="mt-2 h-10 w-2/3 animate-pulse rounded bg-border" />
      <div className="mt-6 h-4 w-40 animate-pulse rounded bg-border" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-border" />
        ))}
      </div>
    </div>
  );
}
