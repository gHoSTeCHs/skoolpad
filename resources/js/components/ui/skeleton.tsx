import { cn } from "@/lib/utils"

const shimmerStyle = {
    background: 'linear-gradient(90deg, var(--skeleton-a) 25%, var(--skeleton-b) 50%, var(--skeleton-a) 75%)',
    backgroundSize: '200% 100%',
} as React.CSSProperties;

function Skeleton({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-shimmer rounded-md", className)}
      style={{ ...shimmerStyle, ...style }}
      {...props}
    />
  )
}

function SkeletonText({ className, ...props }: React.ComponentProps<"div">) {
    return <Skeleton className={cn("h-4 w-full", className)} {...props} />;
}

function SkeletonCircle({ className, ...props }: React.ComponentProps<"div">) {
    return <Skeleton className={cn("rounded-full", className)} {...props} />;
}

export { Skeleton, SkeletonText, SkeletonCircle }
