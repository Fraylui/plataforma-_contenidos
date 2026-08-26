export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <div className="h-9 w-2/3 animate-pulse rounded bg-border" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-border" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
          >
            <div className="h-3 w-16 animate-pulse rounded bg-border" />
            <div className="h-5 w-full animate-pulse rounded bg-border" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}
