import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { createServerClient } from '@/src/lib/postgres/server';
import { useState } from 'react';

type Doacao = {
  id: string;
  reference: string;
  donor_name: string | null;
  received_at: string;
  status: string;
};

async function listarDoacoes(): Promise<Doacao[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('donations')
    .select(`
      *,
      donors (name)
    `)
    .order('received_at', { ascending: false });

  if (error) {
    return [];
  }

  return (
    data?.map((item) => ({
      id: item.id,
      reference: item.reference,
      donor_name: item.donors?.name ?? null,
      received_at: item.received_at,
      status: item.status,
    })) ?? []
  ) as Doacao[];
}

async function criarDoacao(formData: FormData) {
  'use server';

  const donor_id = formData.get('donor_id') as string;
  const received_at = formData.get('received_at') as string;
  const notes = (formData.get('notes') as string) || null;

  const postgres = createServerClient();
  const { error } = await postgres
    .from('donations')
    .insert({ donor_id, received_at, notes });

  if (error) {
    return { erro: 'Não foi possível criar a doação.' };
  }

  return { sucesso: true };
}

export default function DoacoesPage() {
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [donorId, setDonorId] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [notes, setNotes] = useState('');

  async function carregar() {
    const lista = await listarDoacoes();
    setDoacoes(lista);
    setCarregando(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doações"
        description="Registo de doações recebidas e respetiva inspeção."
        action={
          <Button onClick={() => setAbrirDialog(true)}>Nova doação</Button>
        }
      />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          abrirDialog ? '' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Nova doação</h2>
          <form action={criarDoacao} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Doador
              </label>
              <Input
                value={donorId}
                onChange={(e) => setDonorId(e.target.value)}
                placeholder="ID do doador"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Data de receção
              </label>
              <Input
                type="datetime-local"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
                required
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
                  setDonorId('');
                  setReceivedAt('');
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
        <div className="p-4 text-center text-muted">A carregar doações…</div>
      ) : (
        <Card>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Referência
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Doador
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Data de receção
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {doacoes.map((doacao) => (
                <tr key={doacao.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{doacao.reference}</td>
                  <td className="px-4 py-3">{doacao.donor_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(doacao.received_at).toLocaleString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800">
                      {doacao.status}
                    </span>
                  </td>
                </tr>
              ))}
              {doacoes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Nenhuma doação registada.
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
