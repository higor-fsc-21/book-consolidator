function LoadingBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-[#e4e2e2] ${className}`} />
}

export default function AppLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="space-y-3">
        <LoadingBlock className="h-3 w-32" />
        <LoadingBlock className="h-10 w-64" />
        <LoadingBlock className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <LoadingBlock key={index} className="h-40 w-full" />
        ))}
      </div>
    </div>
  )
}