/**
 * Reusable loading-skeleton primitives. Shimmer is pure CSS (see the
 * `.dr-shimmer` keyframes appended to src/index.css) — GPU-cheap and runs
 * fine even while GSAP is mid-animation elsewhere on the page, so it pairs
 * with usePageEntrance() without fighting it for frames.
 */
export function Skeleton({ className = "" }) {
  return <div className={`dr-shimmer rounded-md bg-surface-variant/40 ${className}`} />;
}

export function SkeletonFileCard() {
  return (
    <div className="rounded-xl file-card flex flex-col overflow-hidden">
      <Skeleton className="h-32 w-full !rounded-none" />
      <div className="p-4 flex flex-col gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonFileRow() {
  return (
    <div className="glass-panel-vault p-3 rounded-xl flex items-center gap-3">
      <Skeleton className="h-8 w-8 !rounded-full flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export function SkeletonProjectCard() {
  return (
    <div className="glass rounded-xl p-6 flex flex-col h-[200px] gap-4">
      <Skeleton className="h-9 w-9 !rounded-lg" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="mt-auto"><Skeleton className="h-3 w-1/3" /></div>
    </div>
  );
}

export function SkeletonListRow() {
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-4">
      <Skeleton className="h-10 w-10 !rounded-lg flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/5" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8, Item = SkeletonFileCard, className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => <Item key={i} />)}
    </div>
  );
}