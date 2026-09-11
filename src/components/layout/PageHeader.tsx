'use client';

import Breadcrumbs from './Breadcrumbs';

interface PageHeaderProps {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}

export default function PageHeader({ titulo, descricao, acao }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <Breadcrumbs />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
        <div>
          <h1 className="text-lg font-semibold text-ink tracking-tight">{titulo}</h1>
          {descricao && <p className="text-sm text-muted">{descricao}</p>}
        </div>
        {acao && <div className="ml-auto">{acao}</div>}
      </div>
    </div>
  );
}
