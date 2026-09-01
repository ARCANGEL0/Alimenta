import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { createServerClient } from '@/src/lib/postgres/server';
import { useState } from 'react';

type Doador = {
  id: string;
  code: string;
  name: string;
  donor_type: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
};

async function listarDoadores(): Promise<Doador[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('donors')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as Doador[];
}

async function criarDoador(formData: FormData) {
  'use server';

  const code = formData.get('code') as string;
  const name = formData.get('name') as string;
  const donor_type = (formData.get('donor_type') as string) || null;
  const email = (formData.get('email') as string) || null;
  const phone = (formData.get('phone') as string) || null;

  const postgres = createServerClient();
  const { error } = await postgres
    .from('donors')
    .insert({ code, name, donor_type, email, phone });

  if (error) {
    return { erro: 'Não foi possível criar o doador.' };
  }

  return { sucesso: true };
}

export default function DoadoresPage() {
  const [doadores, setDoadores] = useState<Doador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [donorType, setDonorType] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  async function carregar() {
    const lista = await listarDoadores();
    setDoadores(lista);
    setCarregando(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doadores"
        description="Gestão de entidades e pessoas doadoras."
        action={
          <Button onClick={() => setAbrirDialog(true)}>Novo doador</Button>
        }
      />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          abrirDialog ? '' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Novo doador</h2>
          <form action={criarDoador} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Código
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: DEMO-DON-01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Nome / entidade
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Supermercado Modelo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Tipo
              </label>
              <Input
                value={donorType}
                onChange={(e) => setDonorType(e.target.value)}
                placeholder="Ex.: Supermercado"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                E-mail
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@exemplo.pt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Telefone
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+351 21 000 0000"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setAbrirDialog(false);
                  setCode('');
                  setName('');
                  setDonorType('');
                  setEmail('');
                  setPhone('');
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
        <div className="p-4 text-center text-muted">A carregar doadores…</div>
      ) : (
        <Card>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {doadores.map((doador) => (
                <tr key={doador.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{doador.code}</td>
                  <td className="px-4 py-3">{doador.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {doador.donor_type ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {doador.email ?? doador.phone ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                      {doador.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
              {doadores.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Nenhum doador registado.
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
