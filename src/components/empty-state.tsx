import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../lib/cx";

export interface EmptyStateProps extends Omit<ComponentPropsWithRef<"div">, "title"> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** One clear next step, usually a Button. */
  action?: ReactNode;
}

/** Says what is missing, why it is fine, and what to do next. */
export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div {...props} className={cx("mk-empty", className)}>
      {icon && <div className="mk-empty-icon">{icon}</div>}
      <div className="mk-empty-text">
        <p className="mk-empty-title">{title}</p>
        {description && <p className="mk-empty-description">{description}</p>}
      </div>
      {action && <div className="mk-empty-action">{action}</div>}
    </div>
  );
}
