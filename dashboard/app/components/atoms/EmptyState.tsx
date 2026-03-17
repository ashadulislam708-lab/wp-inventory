import { cn } from "~/lib/utils";
import { InboxIcon } from "lucide-react";

interface EmptyStateProps {
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  className,
  title = "No data found",
  description = "There are no items to display.",
  icon,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {icon ?? (
        <InboxIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
      )}
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
