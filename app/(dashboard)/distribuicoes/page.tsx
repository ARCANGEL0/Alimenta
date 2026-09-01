import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { createServerClient } from '@/src/lib/postgres/server';
import { useState } from 'react';

type Distribuicao = {
  id: string;
  reference: string;
  household_code: string | null;
  status: string;
  created_at: string;
};

async function listarDistribuicoes(): Promise<Distribuicao[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('distributions')
    .select(`
      *,
      households (code)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return (
    data?.map((item) => ({
      id: item.id,
      reference: item.reference,
      household_code: item.households?.code ?? null,
      status: item.status,
      created_at: item.created_at,
    })) ?? []
  ) as Distribuicao[];
}

async function criarDistribuicao(formData: FormData) {
  'use server';

  const household_id = formData.get('household_id') as string;
  const scheduled_at = (formData.get('scheduled_at') as string) || null;
  const notes = (formData.get('notes') as string) || null;

  const postgres = createServerClient();
  const { error } = await postgres
    .from('distributions')
    .insert({ household_id, scheduled_at, notes, status: 'draft' });

  if (error) {
    return { erro: 'Não foi possível criar a distribuição.' };
  }

  return { sucesso: true };
}

export default function DistribuicoesPage() {
  const [distribuicoes, setDistribuicoes] = useState<Distribuicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [householdId, setHouseholdId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');

  async function carregar() {
    const lista = await listarDistribuicoes();
    setDistribuicoes(lista);
    setCarregando(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distribuições"
        description="Preparação, reserva e entrega de cabazes."
        action={
          <Button onClick={() => setAbrirDialog(true)}>Nova distribuição</Button>
        }
      />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          abrirDialog ? '' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Nova distribuição</h2>
          <form action={criarDistribuicao} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Agregado
              </label>
              <Input
                value={householdId}
                onChange={(e) => setHouseholdId(e.target.value)}
                placeholder="ID do agregado"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Data prevista
              </label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Observações
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações opcionais"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setAbrirDialog(false);
                  setHouseholdId('');
                  setScheduledAt('');
                  setNotes('');
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </div>
      </div>

      {carregando ? (
        <div className="p-4 text-center text-muted">A carregar distribuições…</div>
      ) : (
        <Card>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Referência
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Agregado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Criada em
                </th>
              </tr>
            </thead>
            <tbody>
              {distribuicoes.map((distribuicao) => (
                <tr key={distribuicao.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{distribuicao.reference}</td>
                  <td className="px-4 py-3">{distribuicao.household_code ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800">
                      {distribuicao.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(distribuicao.created_at).toLocaleString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
              {distribuicoes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Nenhuma distribuição registada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
