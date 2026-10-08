import { connection } from 'next/server';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import BotaoAcao from '@/components/form/BotaoAcao';
import { listarProdutos, listarCategoriasAtivas } from '@/modules/catalogo/queries';
import {
  actionCriarProduto,
  actionDesativarProduto,
} from '@/modules/catalogo/actions';
import { formatDateTime } from '@/lib/formatting';

export const instant = false;


export default async function ProdutosPage() {
  await connection();
  const [produtos, categorias] = await Promise.all([
    listarProdutos(),
    listarCategoriasAtivas(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader titulo="Produtos" descricao="Produtos que entram nas doações." />
      <Tabela
        cabecalhos={['SKU', 'Nome', 'Categoria', 'Unidade', 'Estado', 'Criado em', '']}
        vazio="Ainda não há produtos."
        linhas={produtos.map((p) => [
          p.sku,
          p.name,
          p.category_name ?? '—',
          p.default_unit,
          <Badge key={p.id} variant={p.is_active ? 'success' : 'secondary'}>
            {p.is_active ? 'ativo' : 'inativo'}
          </Badge>,
          formatDateTime(p.created_at),
          p.is_active ? (
            <BotaoAcao
              key={p.id}
              acao={actionDesativarProduto.bind(null, p.id)}
              className="text-xs font-medium text-danger hover:underline"
            >
              desativar
            </BotaoAcao>
          ) : (
            '—'
          ),
        ])}
      />
      <Formulario
        titulo="Novo produto"
        acao={actionCriarProduto}
        botao="Criar produto"
        campos={[
          { name: 'sku', label: 'SKU', required: true, placeholder: 'Ex.: ARROZ-1KG' },
          { name: 'name', label: 'Nome', required: true, placeholder: 'Ex.: Arroz branco 1kg' },
          {
            name: 'category_id',
            label: 'Categoria',
            type: 'select',
            options: categorias.map((c) => ({ value: c.id, label: c.name })),
          },
          {
            name: 'default_unit',
            label: 'Unidade por defeito',
            type: 'select',
            required: true,
            options: [
              { value: 'kg', label: 'kg' },
              { value: 'un', label: 'un' },
              { value: 'l', label: 'l' },
            ],
          },
          { name: 'description', label: 'Descrição', placeholder: 'opcional' },
        ]}
      />
    </div>
  );
}
