import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div className="max-w-md">
        {Icon ? (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-steel">
            <Icon size={22} aria-hidden="true" />
          </div>
        ) : null}
        <h3 className="mt-4 text-lg font-semibold text-primary">{title}</h3>
        {description ? (
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-steel">{description}</p>
        ) : null}
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
