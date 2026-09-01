import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { createServerClient } from '@/src/lib/postgres/server';
import { useState } from 'react';

type Agregado = {
  id: string;
  code: string;
  household_size: number | null;
  parish: string | null;
  status: string;
};

async function listarAgregados(): Promise<Agregado[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('households')
    .select('*')
    .order('code', { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as Agregado[];
}

async function criarAgregado(formData: FormData) {
  'use server';

  const code = formData.get('code') as string;
  const household_size = Number(formData.get('household_size'));
  const parish = (formData.get('parish') as string) || null;
  const status = formData.get('status') as string || 'ativo';

  const postgres = createServerClient();
  const { error } = await postgres
    .from('households')
    .insert({ code, household_size, parish, status });

  if (error) {
    return { erro: 'Não foi possível criar o agregado.' };
  }

  return { sucesso: true };
}

export default function BeneficiariosPage() {
  const [agregados, setAgregados] = useState<Agregado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [code, setCode] = useState('');
  const [householdSize, setHouseholdSize] = useState('');
  const [parish, setParish] = useState('');
  const [status, setStatus] = useState('ativo');

  async function carregar() {
    const lista = await listarAgregados();
    setAgregados(lista);
    setCarregando(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agregados familiares"
        description="Gestão de agregados familiares apoiados."
        action={
          <Button onClick={() => setAbrirDialog(true)}>Novo agregado</Button>
        }
      />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          abrirDialog ? '' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Novo agregado</h2>
          <form action={criarAgregado} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Código
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: DEMO-HH-01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                N.º elementos
              </label>
              <Input
                type="number"
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Freguesia / área
              </label>
              <Input
                value={parish}
                onChange={(e) => setParish(e.target.value)}
                placeholder="Ex.: Cedofeita"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Estado
              </label>
              <Input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setAbrirDialog(false);
                  setCode('');
                  setHouseholdSize('');
                  setParish('');
                  setStatus('ativo');
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
        <div className="p-4 text-center text-muted">A carregar agregados…</div>
      ) : (
        <Card>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  N.º elementos
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Freguesia / área
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {agregados.map((agregado) => (
                <tr key={agregado.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{agregado.code}</td>
                  <td className="px-4 py-3">
                    {agregado.household_size ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {agregado.parish ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                      {agregado.status}
                    </span>
                  </td>
                </tr>
              ))}
              {agregados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Nenhum agregado registado.
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
