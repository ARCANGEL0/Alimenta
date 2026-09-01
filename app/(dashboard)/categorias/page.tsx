import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { createServerClient } from '@/src/lib/postgres/server';
import { useState } from 'react';

type Categoria = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

async function listarCategorias(): Promise<Categoria[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as Categoria[];
}

async function criarCategoria(formData: FormData) {
  'use server';

  const nome = formData.get('nome') as string;
  const descricao = (formData.get('descricao') as string) || null;

  const postgres = createServerClient();
  const { error } = await postgres
    .from('categories')
    .insert({ name: nome, description: descricao });

  if (error) {
    return { erro: 'Não foi possível criar a categoria.' };
  }

  return { sucesso: true };
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  async function carregar() {
    const lista = await listarCategorias();
    setCategorias(lista);
    setCarregando(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de produtos"
        description="Gerir as categorias do catálogo de produtos."
        action={
          <Button onClick={() => setAbrirDialog(true)}>Nova categoria</Button>
        }
      />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          abrirDialog ? '' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Nova categoria</h2>
          <form action={criarCategoria} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Nome
              </label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Cereais e derivados"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Descrição
              </label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição opcional"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setAbrirDialog(false);
                  setNome('');
                  setDescricao('');
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
        <div className="p-4 text-center text-muted">A carregar categorias…</div>
      ) : (
        <Card>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{categoria.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {categoria.description ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                      {categoria.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                </tr>
              ))}
              {categorias.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted">
                    Nenhuma categoria registada.
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
