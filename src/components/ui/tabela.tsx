import type { ReactNode } from 'react';

export default function Tabela({
  cabecalhos,
  linhas,
  vazio = 'Ainda não há registos.',
}: {
  cabecalhos: string[];
  linhas: ReactNode[][];
  vazio?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas text-left">
            {cabecalhos.map((c) => (
              <th key={c} className="px-4 py-3 font-semibold text-muted">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.length === 0 ? (
            <tr>
              <td colSpan={cabecalhos.length} className="px-4 py-10 text-center text-muted">
                {vazio}
              </td>
            </tr>
          ) : (
            linhas.map((linha, i) => (
              <tr key={i} className="border-b border-line last:border-0 hover:bg-canvas/60">
                {linha.map((celula, j) => (
                  <td key={j} className="px-4 py-3 align-middle text-ink">
                    {celula}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
