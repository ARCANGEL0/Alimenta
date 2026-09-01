'use client';

import Breadcrumbs from './Breadcrumbs';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <Breadcrumbs />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
        <div>
          <h1 className="text-lg font-semibold text-text tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {action && <div className="ml-auto">{action}</div>}
      </div>
    </div>
  );
}
