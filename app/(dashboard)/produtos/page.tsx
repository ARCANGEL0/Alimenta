import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { createServerClient } from '@/src/lib/postgres/server';
import { useState } from 'react';

type Produto = {
  id: string;
  sku: string;
  name: string;
  category_name: string | null;
  default_unit: string;
  is_active: boolean;
};

async function listarProdutos(): Promise<Produto[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('products')
    .select(`
      *,
      categories (name)
    `)
    .order('name', { ascending: true });

  if (error) {
    return [];
  }

  return (
    data?.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      category_name: item.categories?.name ?? null,
      default_unit: item.default_unit,
      is_active: item.is_active,
    })) ?? []
  ) as Produto[];
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [sku, setSku] = useState('');
  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [unidade, setUnidade] = useState('');

  async function carregar() {
    const lista = await listarProdutos();
    setProdutos(lista);
    setCarregando(false);
  }

  async function criarProduto(formData: FormData) {
    'use server';

    const sku = formData.get('sku') as string;
    const nome = formData.get('nome') as string;
    const categoriaId = (formData.get('categoria_id') as string) || null;
    const unidade = formData.get('unidade') as string;

    const postgres = createServerClient();
    const { error } = await postgres
      .from('products')
      .insert({ sku, nome, category_id: categoriaId, default_unit: unidade });

    if (error) {
      return { erro: 'Não foi possível criar o produto.' };
    }

    return { sucesso: true };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos disponíveis para doações e distribuições."
        action={
          <Button onClick={() => setAbrirDialog(true)}>Novo produto</Button>
        }
      />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          abrirDialog ? '' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Novo produto</h2>
          <form action={criarProduto} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                SKU
              </label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ex.: DEMO-SKU-01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Nome
              </label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Arroz branco 1kg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Categoria
              </label>
              <Input
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                placeholder="ID da categoria (opcional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Unidade
              </label>
              <Input
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="kg"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setAbrirDialog(false);
                  setSku('');
                  setNome('');
                  setCategoriaId('');
                  setUnidade('');
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
        <div className="p-4 text-center text-muted">A carregar produtos…</div>
      ) : (
        <Card>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Unidade
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{produto.sku}</td>
                  <td className="px-4 py-3">{produto.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {produto.category_name ?? '—'}
                  </td>
                  <td className="px-4 py-3">{produto.default_unit}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                      {produto.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
              {produtos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Nenhum produto registado.
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
